from datetime import timedelta

from django.db import transaction
from django.db.models import Avg, DurationField, ExpressionWrapper, F, Sum
from django.utils import timezone
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from vehicles.resource_api import VehicleScopedViewSet
from vehicles.models import Vehicle
from vehicles.odometer import advance_odometer

from .models import Trip
from .serializers import TripSerializer


class TripViewSet(VehicleScopedViewSet):
    queryset = Trip.objects.all()
    serializer_class = TripSerializer
    resource_name = 'trip'

    def get_queryset(self):
        queryset = super().get_queryset()
        vehicle_id = self.request.query_params.get('vehicle')
        if vehicle_id:
            queryset = queryset.filter(vehicle_id=vehicle_id)
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            try:
                date_from = serializers.DateField().run_validation(date_from)
            except ValidationError as exc:
                raise ValidationError({'date_from': exc.detail}) from exc
            queryset = queryset.filter(started_at__date__gte=date_from)
        if date_to:
            try:
                date_to = serializers.DateField().run_validation(date_to)
            except ValidationError as exc:
                raise ValidationError({'date_to': exc.detail}) from exc
            queryset = queryset.filter(started_at__date__lte=date_to)
        if date_from and date_to and date_from > date_to:
            raise ValidationError({
                'date_to': 'End date must be on or after the start date.'
            })
        return queryset

    def perform_create(self, serializer):
        with transaction.atomic():
            super().perform_create(serializer)
            trip = serializer.instance
            if trip.ended_at is not None and trip.end_odometer_km is not None:
                vehicle = Vehicle.objects.select_for_update().get(pk=trip.vehicle_id)
                if trip.end_odometer_km < vehicle.odometer_km:
                    raise ValidationError({
                        'end_odometer_km': (
                            'Ending odometer cannot be lower than the vehicle’s '
                            'current reading.'
                        )
                    })
                advance_odometer(vehicle, trip.end_odometer_km)

    def perform_update(self, serializer):
        with transaction.atomic():
            vehicle_id = serializer.instance.vehicle_id
            vehicle = Vehicle.objects.select_for_update().get(pk=vehicle_id)
            end_reading = serializer.validated_data.get(
                'end_odometer_km', serializer.instance.end_odometer_km
            )
            ending_at = serializer.validated_data.get(
                'ended_at', serializer.instance.ended_at
            )
            if (
                serializer.instance.ended_at is None
                and ending_at is not None
                and end_reading is not None
                and end_reading < vehicle.odometer_km
            ):
                raise ValidationError({
                    'end_odometer_km': (
                        'Ending odometer cannot be lower than the vehicle’s '
                        'current reading.'
                    )
                })
            super().perform_update(serializer)
            if serializer.instance.ended_at is not None and end_reading is not None:
                advance_odometer(vehicle, end_reading)

    @action(detail=False, methods=['get'])
    def summary(self, _request):
        queryset = self.get_queryset()
        today = timezone.localdate()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)
        completed = queryset.filter(ended_at__isnull=False)
        today_trips = completed.filter(started_at__date=today)
        week_trips = completed.filter(
            started_at__date__gte=week_start,
            started_at__date__lte=today,
        )
        month_trips = completed.filter(
            started_at__date__gte=month_start,
            started_at__date__lte=today,
        )

        def summarize(records):
            aggregates = records.aggregate(
                distance_km=Sum('distance_km'),
                duration=Sum(
                    ExpressionWrapper(
                        F('ended_at') - F('started_at'),
                        output_field=DurationField(),
                    )
                ),
                fuel_used_liters=Sum('fuel_consumed_liters'),
                fuel_cost=Sum('fuel_cost'),
            )
            return {
                'trip_count': records.count(),
                'distance_km': aggregates['distance_km'] or 0,
                'duration_seconds': int(aggregates['duration'].total_seconds())
                if aggregates['duration'] else 0,
                'fuel_used_liters': aggregates['fuel_used_liters'] or 0,
                'fuel_cost': aggregates['fuel_cost'] or 0,
            }

        most_fuel_used = completed.exclude(
            fuel_consumed_liters__isnull=True
        ).order_by('-fuel_consumed_liters', '-started_at').first()
        return Response({
            'today': summarize(today_trips),
            'this_week': summarize(week_trips),
            'this_month': summarize(month_trips),
            'totals': {
                'trip_count': completed.count(),
                'distance_km': completed.aggregate(
                    value=Sum('distance_km')
                )['value'] or 0,
                'fuel_cost': completed.aggregate(
                    value=Sum('fuel_cost')
                )['value'] or 0,
                'average_distance_km': completed.aggregate(
                    value=Avg('distance_km')
                )['value'] or 0,
            },
            'most_fuel_used': TripSerializer(
                most_fuel_used,
                context=self.get_serializer_context(),
            ).data if most_fuel_used else None,
        })
