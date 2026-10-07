from django.db.models import Sum
from django.utils import timezone
from rest_framework.decorators import action
from rest_framework.response import Response

from vehicles.resource_api import VehicleScopedViewSet

from .models import MaintenanceRecord, MaintenanceReminder
from .serializers import MaintenanceRecordSerializer, MaintenanceReminderSerializer


class MaintenanceRecordViewSet(VehicleScopedViewSet):
    queryset = MaintenanceRecord.objects.all()
    serializer_class = MaintenanceRecordSerializer
    resource_name = 'maintenance'

    def get_queryset(self):
        queryset = super().get_queryset()
        vehicle_id = self.request.query_params.get('vehicle')
        if vehicle_id:
            queryset = queryset.filter(vehicle_id=vehicle_id)
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(service_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(service_date__lte=date_to)
        return queryset

    @action(detail=False, methods=['get'])
    def summary(self, _request):
        queryset = self.get_queryset()
        today = timezone.localdate()
        month_start = today.replace(day=1)
        year_start = today.replace(month=1, day=1)
        return Response({
            'record_count': queryset.count(),
            'total_cost': queryset.aggregate(value=Sum('cost'))['value'] or 0,
            'this_month_cost': queryset.filter(
                service_date__gte=month_start
            ).aggregate(value=Sum('cost'))['value'] or 0,
            'this_year_cost': queryset.filter(
                service_date__gte=year_start
            ).aggregate(value=Sum('cost'))['value'] or 0,
            'average_cost': queryset.aggregate(value=Sum('cost'))['value'] / queryset.count()
            if queryset.count() else 0,
        })


class MaintenanceReminderViewSet(VehicleScopedViewSet):
    queryset = MaintenanceReminder.objects.select_related('vehicle')
    serializer_class = MaintenanceReminderSerializer
    resource_name = 'maintenance'

    def permission_for_action(self):
        if getattr(self, 'action', '') == 'complete':
            return 'maintenance.update'
        return super().permission_for_action()

    def get_queryset(self):
        queryset = super().get_queryset()
        vehicle_id = self.request.query_params.get('vehicle')
        if vehicle_id:
            queryset = queryset.filter(vehicle_id=vehicle_id)
        status = self.request.query_params.get('status')
        if status in MaintenanceReminder.STATUS_CHOICES_DICT:
            queryset = queryset.filter(status=status)
        return queryset

    @action(detail=False, methods=['get'])
    def upcoming(self, _request):
        reminders = self.get_queryset().filter(status=MaintenanceReminder.OPEN)
        records = [
            reminder for reminder in reminders
            if MaintenanceReminderSerializer(reminder).data['computed_status']
            in {'overdue', 'due_soon', 'upcoming'}
        ]
        return Response(self.get_serializer(records, many=True).data)

    @action(detail=True, methods=['post'])
    def complete(self, _request, pk=None):
        reminder = self.get_object()
        reminder.status = MaintenanceReminder.COMPLETED
        reminder.completed_at = timezone.now()
        reminder.save(update_fields=['status', 'completed_at', 'updated_at'])
        return Response(self.get_serializer(reminder).data)
