from datetime import date
from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response

from vehicles.resource_api import VehicleScopedViewSet

from .models import FuelRecord
from .serializers import FuelRecordSerializer


class FuelRecordViewSet(VehicleScopedViewSet):
    queryset = FuelRecord.objects.all()
    serializer_class = FuelRecordSerializer
    resource_name = 'fuel'

    def get_queryset(self):
        queryset = super().get_queryset()
        vehicle_id = self.request.query_params.get('vehicle')
        if vehicle_id:
            queryset = queryset.filter(vehicle_id=vehicle_id)
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        fuel_type = self.request.query_params.get('fuel_type')
        if fuel_type:
            queryset = queryset.filter(fuel_type=fuel_type)
        return queryset

    @action(detail=False, methods=['get'])
    def summary(self, request):
        queryset = self.filter_queryset(self.get_queryset())
        today = timezone.localdate()
        month_start = today.replace(day=1)
        year_start = date(today.year, 1, 1)
        all_records = self.get_queryset()
        month_records = all_records.filter(date__gte=month_start)
        year_records = all_records.filter(date__gte=year_start)
        aggregate = queryset.aggregate(
            total_cost=Sum('total_cost'),
            total_liters=Sum('quantity_liters'),
        )
        return Response({
            'period': {
                'from': request.query_params.get('date_from'),
                'to': request.query_params.get('date_to'),
            },
            'record_count': queryset.count(),
            'total_cost': aggregate['total_cost'] or Decimal('0.00'),
            'total_liters': aggregate['total_liters'] or Decimal('0.000'),
            'this_month_cost': month_records.aggregate(value=Sum('total_cost'))['value'] or Decimal('0.00'),
            'this_year_cost': year_records.aggregate(value=Sum('total_cost'))['value'] or Decimal('0.00'),
        })
