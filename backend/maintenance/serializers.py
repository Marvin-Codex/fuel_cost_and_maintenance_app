from django.utils import timezone
from rest_framework import serializers

from vehicles.resource_api import VehicleScopedSerializerMixin

from .models import MaintenanceRecord, MaintenanceReminder


class MaintenanceRecordSerializer(
    VehicleScopedSerializerMixin, serializers.ModelSerializer
):
    class Meta:
        model = MaintenanceRecord
        fields = [
            'id', 'vehicle', 'service_type', 'service_date', 'odometer_km',
            'cost', 'parts_replaced', 'technician', 'service_center', 'notes',
            'client_id', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_parts_replaced(self, value):
        if not isinstance(value, list) or any(not isinstance(part, str) for part in value):
            raise serializers.ValidationError('Parts replaced must be a list of text values.')
        return value

    def validate(self, attrs):
        vehicle = attrs.get('vehicle', getattr(self.instance, 'vehicle', None))
        service_date = attrs.get(
            'service_date', getattr(self.instance, 'service_date', None)
        )
        odometer = attrs.get(
            'odometer_km', getattr(self.instance, 'odometer_km', None)
        )
        if vehicle is None or service_date is None or odometer is None:
            return attrs
        records = MaintenanceRecord.objects.filter(vehicle=vehicle).exclude(
            pk=getattr(self.instance, 'pk', None)
        )
        previous = records.filter(
            service_date__lte=service_date
        ).order_by('-service_date', '-odometer_km').first()
        following = records.filter(
            service_date__gte=service_date
        ).order_by('service_date', 'odometer_km').first()
        if previous and odometer < previous.odometer_km:
            raise serializers.ValidationError({
                'odometer_km': 'Odometer cannot be lower than an earlier service record.'
            })
        if following and odometer > following.odometer_km:
            raise serializers.ValidationError({
                'odometer_km': 'Odometer cannot be higher than a later service record.'
            })
        return attrs


class MaintenanceReminderSerializer(
    VehicleScopedSerializerMixin, serializers.ModelSerializer
):
    computed_status = serializers.SerializerMethodField()
    km_remaining = serializers.SerializerMethodField()
    days_remaining = serializers.SerializerMethodField()

    class Meta:
        model = MaintenanceReminder
        fields = [
            'id', 'vehicle', 'service_type', 'due_date', 'due_odometer_km',
            'status', 'computed_status', 'km_remaining', 'days_remaining',
            'notes', 'completed_at', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'completed_at', 'created_at', 'updated_at',
        ]

    def get_computed_status(self, reminder):
        if reminder.status != MaintenanceReminder.OPEN:
            return reminder.status
        today = timezone.localdate()
        if reminder.due_date and reminder.due_date < today:
            return 'overdue'
        if (
            reminder.due_odometer_km is not None
            and reminder.due_odometer_km < reminder.vehicle.odometer_km
        ):
            return 'overdue'
        if reminder.due_date == today:
            return 'due_soon'
        if (
            reminder.due_odometer_km is not None
            and reminder.due_odometer_km - reminder.vehicle.odometer_km <= 1000
        ):
            return 'due_soon'
        return 'upcoming'

    def get_km_remaining(self, reminder):
        if reminder.due_odometer_km is None:
            return None
        return reminder.due_odometer_km - reminder.vehicle.odometer_km

    def get_days_remaining(self, reminder):
        if reminder.due_date is None:
            return None
        return (reminder.due_date - timezone.localdate()).days

    def validate(self, attrs):
        if (
            attrs.get('due_date', getattr(self.instance, 'due_date', None)) is None
            and attrs.get(
                'due_odometer_km', getattr(self.instance, 'due_odometer_km', None)
            ) is None
        ):
            raise serializers.ValidationError(
                'Set at least one of due_date or due_odometer_km.'
            )
        return attrs
