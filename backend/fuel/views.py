from datetime import datetime, time, timedelta
from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response

from trips.models import Trip
from vehicles.models import Vehicle
from vehicles.resource_api import VehicleScopedViewSet
from vehicles.resource_scoping import vehicles_visible_to_request

from .models import FuelRecord
from .serializers import FuelRecordSerializer


ZERO_COST = Decimal('0.00')
ZERO_LITERS = Decimal('0.000')


class FuelRecordViewSet(VehicleScopedViewSet):
    queryset = FuelRecord.objects.all()
    serializer_class = FuelRecordSerializer
    resource_name = 'fuel'

    def get_queryset(self):
        return self._scoped_queryset(include_period=True)

    def _scoped_queryset(self, include_period):
        queryset = super().get_queryset()
        vehicle_id = self.request.query_params.get('vehicle')
        if vehicle_id:
            vehicle_id = serializers.UUIDField().run_validation(vehicle_id)
            queryset = queryset.filter(vehicle_id=vehicle_id)

        if include_period:
            date_from = self._query_date('date_from')
            date_to = self._query_date('date_to')
            if date_from:
                queryset = queryset.filter(date__gte=date_from)
            if date_to:
                queryset = queryset.filter(date__lte=date_to)
            if date_from and date_to and date_from > date_to:
                raise ValidationError({
                    'date_to': 'End date must be on or after the start date.'
                })

        fuel_type = self.request.query_params.get('fuel_type')
        if fuel_type and fuel_type not in dict(Vehicle.FUEL_TYPES):
            raise ValidationError({'fuel_type': 'Select a valid fuel type.'})
        if fuel_type:
            queryset = queryset.filter(fuel_type=fuel_type)
        return queryset

    def _query_date(self, name, request=None):
        query_request = request or self.request
        value = query_request.query_params.get(name)
        if value is None:
            return None
        try:
            return serializers.DateField().run_validation(value)
        except ValidationError as exc:
            raise ValidationError({name: exc.detail}) from exc

    def _summary_for(self, records):
        result = records.aggregate(
            total_cost=Sum('total_cost'),
            total_liters=Sum('quantity_liters'),
        )
        return {
            'record_count': records.count(),
            'total_cost': result['total_cost'] or ZERO_COST,
            'total_liters': result['total_liters'] or ZERO_LITERS,
        }

    def _vehicle_for_summary(self, queryset):
        vehicle_id = self.request.query_params.get('vehicle')
        _, vehicles = vehicles_visible_to_request(self.request, 'fuel.view')
        if vehicle_id:
            return vehicles.filter(
                pk=serializers.UUIDField().run_validation(vehicle_id)
            ).first()
        vehicle_ids = list(queryset.values_list('vehicle_id', flat=True).distinct()[:2])
        if len(vehicle_ids) != 1:
            return None
        return vehicles.filter(pk=vehicle_ids[0]).first()

    @staticmethod
    def _purchase_datetime(record):
        if record.purchased_at:
            return record.purchased_at
        return timezone.make_aware(
            datetime.combine(record.date, time.min),
            timezone.get_current_timezone(),
        )

    def _trip_queryset(self, vehicle):
        try:
            _, accessible_vehicles = vehicles_visible_to_request(
                self.request, 'trip.view'
            )
        except PermissionDenied:
            return None
        if not accessible_vehicles.filter(pk=vehicle.pk).exists():
            return None
        return Trip.objects.filter(vehicle=vehicle, ended_at__isnull=False)

    def _fuel_level(self, vehicle, records):
        result = {
            'available': False,
            'remaining_liters': None,
            'percentage': None,
            'estimated_range_km': None,
            'basis': None,
            'unavailable_reason': None,
        }
        if vehicle.tank_capacity_liters is None:
            result['unavailable_reason'] = 'Vehicle tank capacity is not set.'
            return result, []

        full_tank_records = list(
            records.filter(is_full_tank=True).order_by('date', 'purchased_at')
        )
        if not full_tank_records:
            result['unavailable_reason'] = (
                'Record a full-tank purchase to establish a fuel-level baseline.'
            )
            return result, []
        last_full_tank = full_tank_records[-1]
        anchor_time = self._purchase_datetime(last_full_tank)
        trip_records = self._trip_queryset(vehicle)
        if trip_records is None:
            result['unavailable_reason'] = (
                'Trip access is required to estimate fuel remaining.'
            )
            return result, []

        trips_since_refill = trip_records.filter(started_at__gt=anchor_time)
        if Trip.objects.filter(
            vehicle=vehicle,
            started_at__lte=anchor_time,
            ended_at__gt=anchor_time,
        ).exists():
            result['unavailable_reason'] = (
                'A recorded trip overlaps the last full-tank timestamp, so its '
                'fuel use cannot be assigned reliably.'
            )
            return result, []
        if Trip.objects.filter(
            vehicle=vehicle,
            started_at__gt=anchor_time,
            ended_at__isnull=True,
        ).exists():
            result['unavailable_reason'] = (
                'Fuel use cannot be estimated while a trip is still in progress.'
            )
            return result, []
        if trips_since_refill.filter(fuel_consumed_liters__isnull=True).exists():
            result['unavailable_reason'] = (
                'Fuel use is missing for one or more trips since the last full tank.'
            )
            return result, []

        later_purchases = [
            record for record in records.order_by('date', 'purchased_at')
            if record.pk != last_full_tank.pk
            and self._purchase_datetime(record) > anchor_time
        ]
        purchased_after = sum(
            (record.quantity_liters for record in later_purchases), ZERO_LITERS
        )
        consumed_after = trips_since_refill.aggregate(
            value=Sum('fuel_consumed_liters')
        )['value'] or ZERO_LITERS
        capacity = Decimal(vehicle.tank_capacity_liters)
        remaining = capacity + purchased_after - consumed_after
        if remaining < 0 or remaining > capacity:
            result['unavailable_reason'] = (
                'Recorded fuel purchases and trip consumption do not reconcile '
                'with the tank capacity.'
            )
            return result, [{
                'code': 'fuel_balance_inconsistent',
                'severity': 'warning',
                'message': result['unavailable_reason'],
            }]

        result.update({
            'available': True,
            'remaining_liters': remaining.quantize(Decimal('0.01')),
            'percentage': (remaining / capacity * 100).quantize(Decimal('0.1')),
            'basis': 'Tank capacity at the last full-tank record, plus logged purchases, minus recorded trip consumption.',
        })
        alerts = []
        if result['percentage'] <= Decimal('15'):
            alerts.append({
                'code': 'low_fuel',
                'severity': 'warning',
                'message': (
                    f"Estimated fuel is at {result['percentage']}% "
                    f"({result['remaining_liters']} L remaining)."
                ),
            })
        measured_history = trip_records.filter(
            distance_km__gt=0,
            fuel_consumed_liters__gt=0,
        ).aggregate(
            distance=Sum('distance_km'),
            fuel=Sum('fuel_consumed_liters'),
        )
        if measured_history['distance'] and measured_history['fuel']:
            average_consumption = (
                Decimal(measured_history['fuel'])
                / Decimal(measured_history['distance'])
            )
            result['estimated_range_km'] = int(
                remaining / average_consumption
            )
            result['average_consumption_l_per_100km'] = (
                average_consumption * 100
            ).quantize(Decimal('0.01'))
        else:
            result['unavailable_reason'] = (
                'Remaining fuel is estimated, but trip efficiency is not yet '
                'sufficient to estimate driving range.'
            )
        return result, alerts

    @action(detail=False, methods=['get'])
    def summary(self, request):
        queryset = self.get_queryset()
        all_records = self._scoped_queryset(include_period=False)
        today = timezone.localdate()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)
        daily = self._summary_for(all_records.filter(date=today))
        weekly = self._summary_for(all_records.filter(
            date__gte=week_start, date__lte=today
        ))
        monthly = self._summary_for(all_records.filter(
            date__gte=month_start, date__lte=today
        ))
        year_start = today.replace(month=1, day=1)
        yearly = self._summary_for(all_records.filter(
            date__gte=year_start, date__lte=today
        ))
        selected = self._summary_for(queryset)
        response = {
            'period': {
                'from': request.query_params.get('date_from'),
                'to': request.query_params.get('date_to'),
            },
            **selected,
            'this_month_cost': monthly['total_cost'],
            'this_year_cost': yearly['total_cost'],
            'expenditure': {
                'today': daily['total_cost'],
                'this_week': weekly['total_cost'],
                'this_month': monthly['total_cost'],
            },
            'purchases': {
                'today': daily,
                'this_week': weekly,
                'this_month': monthly,
            },
            'fuel_level': None,
            'alerts': [],
        }

        vehicle = self._vehicle_for_summary(all_records)
        if vehicle is None:
            response['fuel_level'] = {
                'available': False,
                'remaining_liters': None,
                'percentage': None,
                'estimated_range_km': None,
                'basis': None,
                'unavailable_reason': (
                    'Select one vehicle to estimate remaining fuel and range.'
                ),
            }
            return Response(response)

        scoped_records = FuelRecord.objects.filter(vehicle=vehicle)
        fuel_level, alerts = self._fuel_level(vehicle, scoped_records)
        response['fuel_level'] = fuel_level
        response['alerts'].extend(alerts)
        if not fuel_level['available'] and not any(
            alert['code'] == 'fuel_balance_inconsistent'
            for alert in response['alerts']
        ):
            response['alerts'].append({
                'code': 'fuel_level_unavailable',
                'severity': 'info',
                'message': fuel_level['unavailable_reason'],
            })

        latest_purchase = scoped_records.order_by(
            '-date', '-purchased_at'
        ).first()
        if latest_purchase and latest_purchase.odometer_km > vehicle.odometer_km:
            response['alerts'].append({
                'code': 'refueling_odometer_inconsistent',
                'severity': 'warning',
                'message': (
                    'A refueling odometer is higher than the current vehicle '
                    'odometer. Check the recorded readings.'
                ),
            })

        trip_records = self._trip_queryset(vehicle)
        if trip_records is not None:
            measured_trips = []
            for trip in trip_records.filter(
                distance_km__gt=0,
                fuel_consumed_liters__gt=0,
            ).order_by('-ended_at')[:4]:
                measured_trips.append(
                    Decimal(trip.fuel_consumed_liters)
                    / Decimal(trip.distance_km) * 100
                )
            if len(measured_trips) >= 3:
                latest = measured_trips[0]
                baseline = sum(measured_trips[1:], Decimal('0')) / (
                    len(measured_trips) - 1
                )
                if latest > baseline * Decimal('1.25'):
                    response['alerts'].append({
                        'code': 'high_fuel_consumption',
                        'severity': 'warning',
                        'message': (
                            f'Recent trip consumption ({latest.quantize(Decimal("0.1"))} '
                            f'L/100 km) is over 25% above the recent baseline '
                            f'({baseline.quantize(Decimal("0.1"))} L/100 km).'
                        ),
                    })
        return Response(response)

    @action(detail=False, methods=['get'])
    def efficiency(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        vehicle = self._vehicle_for_summary(queryset)
        if vehicle is None:
            return Response({
                'vehicle': None,
                'trip_efficiency': [],
                'refill_efficiency': [],
                'message': 'Select one vehicle to retrieve fuel-efficiency history.',
            })

        date_from = self._query_date('date_from', request=request)
        date_to = self._query_date('date_to', request=request)
        if date_from and date_to and date_from > date_to:
            raise ValidationError({
                'date_to': 'End date must be on or after the start date.'
            })
        purchases = list(
            FuelRecord.objects.filter(vehicle=vehicle)
            .order_by('date', 'purchased_at')[:200]
        )
        full_tank_indices = [
            index for index, purchase in enumerate(purchases)
            if purchase.is_full_tank
        ]
        refill_efficiency = []
        for previous_index, current_index in zip(
            full_tank_indices, full_tank_indices[1:]
        ):
            previous = purchases[previous_index]
            current = purchases[current_index]
            current_date = self._purchase_datetime(current).date()
            if date_from and current_date < date_from:
                continue
            if date_to and current_date > date_to:
                continue
            distance = current.odometer_km - previous.odometer_km
            if distance <= 0:
                continue
            period_purchases = purchases[previous_index + 1:current_index + 1]
            liters = sum(
                (purchase.quantity_liters for purchase in period_purchases),
                ZERO_LITERS,
            )
            if liters <= 0:
                continue
            refill_efficiency.append({
                'from': self._purchase_datetime(previous),
                'to': self._purchase_datetime(current),
                'distance_km': distance,
                'fuel_consumed_liters': liters,
                'fuel_economy_l_per_100km': (
                    liters / Decimal(distance) * 100
                ).quantize(Decimal('0.01')),
            })

        trip_query = self._trip_queryset(vehicle)
        trip_efficiency = []
        efficiency_alerts = []
        trip_access = trip_query is not None
        if trip_access:
            filtered_trip_query = trip_query
            if date_from:
                filtered_trip_query = filtered_trip_query.filter(
                    started_at__date__gte=date_from
                )
            if date_to:
                filtered_trip_query = filtered_trip_query.filter(
                    started_at__date__lte=date_to
                )
            if date_from and date_to and date_from > date_to:
                raise ValidationError({
                    'date_to': 'End date must be on or after the start date.'
                })
            trips = list(filtered_trip_query.order_by('-ended_at')[:100])
            for trip in trips:
                economy = trip.fuel_economy_l_per_100km
                if economy is None:
                    continue
                trip_efficiency.append({
                    'trip_id': str(trip.id),
                    'started_at': trip.started_at,
                    'ended_at': trip.ended_at,
                    'start_location': trip.start_location,
                    'destination': trip.destination,
                    'distance_km': trip.distance_km,
                    'fuel_consumed_liters': trip.fuel_consumed_liters,
                    'fuel_cost': trip.fuel_cost,
                    'fuel_economy_l_per_100km': economy,
                })
            if len(trip_efficiency) >= 3:
                latest = Decimal(str(
                    trip_efficiency[0]['fuel_economy_l_per_100km']
                ))
                baseline_items = [
                    Decimal(str(item['fuel_economy_l_per_100km']))
                    for item in trip_efficiency[1:4]
                ]
                baseline = sum(baseline_items, Decimal('0')) / len(baseline_items)
                if latest > baseline * Decimal('1.25'):
                    efficiency_alerts.append({
                        'code': 'unexpected_efficiency_drop',
                        'severity': 'warning',
                        'message': (
                            'The latest measured trip used over 25% more fuel per '
                            '100 km than the previous measured trips.'
                        ),
                    })

        all_fuel_economy = [
            Decimal(str(item['fuel_economy_l_per_100km']))
            for item in trip_efficiency
        ]
        summary = None
        if all_fuel_economy:
            total_distance = sum(
                (Decimal(str(item['distance_km'])) for item in trip_efficiency),
                Decimal('0'),
            )
            total_consumed = sum(
                (
                    Decimal(str(item['fuel_consumed_liters']))
                    for item in trip_efficiency
                ),
                Decimal('0'),
            )
            summary = {
                'average_l_per_100km': (
                    total_consumed / total_distance * 100
                ).quantize(Decimal('0.01')),
                'best_l_per_100km': min(all_fuel_economy),
                'worst_l_per_100km': max(all_fuel_economy),
                'trip_count': len(all_fuel_economy),
            }
        return Response({
            'vehicle': str(vehicle.id),
            'trip_access': trip_access,
            'trip_efficiency': trip_efficiency,
            'trip_efficiency_summary': summary,
            'refill_efficiency': refill_efficiency,
            'alerts': efficiency_alerts,
            'message': None if trip_access else (
                'Trip efficiency is unavailable because trip-view permission is required.'
            ),
        })
