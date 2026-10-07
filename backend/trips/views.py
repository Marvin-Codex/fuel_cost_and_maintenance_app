from django.db.models import DurationField, ExpressionWrapper, F, Sum
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response

from vehicles.resource_api import VehicleScopedViewSet

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
            queryset = queryset.filter(started_at__date__gte=date_from)
        if date_to:
            queryset = queryset.filter(started_at__date__lte=date_to)
        return queryset

    @action(detail=False, methods=['get'])
    def summary(self, _request):
        queryset = self.get_queryset()
        today = timezone.localdate()
        month_start = today.replace(day=1)
        today_trips = queryset.filter(started_at__date=today)
        month_trips = queryset.filter(started_at__date__gte=month_start)

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

        return Response({
            'today': summarize(today_trips),
            'this_month': summarize(month_trips),
            'totals': {
                'trip_count': queryset.count(),
                'distance_km': queryset.aggregate(value=Sum('distance_km'))['value'] or 0,
                'fuel_cost': queryset.aggregate(value=Sum('fuel_cost'))['value'] or 0,
            },
        })
