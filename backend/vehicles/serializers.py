from rest_framework import serializers

from preferences.models import UserPreference

from .models import Vehicle
from .scoping import vehicles_for


class VehicleScopedSerializerMixin:
    """Limits the `vehicle` dropdown to vehicles visible in this workspace."""

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get('request')
        if request is not None and 'vehicle' in fields and hasattr(request, 'access'):
            fields['vehicle'].queryset = vehicles_for(request.access)
        return fields


class VehicleSerializer(serializers.ModelSerializer):
    workspace = serializers.PrimaryKeyRelatedField(read_only=True)
    is_selected = serializers.SerializerMethodField()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        self.active_vehicle_id = None
        if request and request.user.is_authenticated:
            self.active_vehicle_id = UserPreference.objects.filter(
                user=request.user
            ).values_list('active_vehicle_id', flat=True).first()
    class Meta:
        model = Vehicle
        fields = [
            'id', 'owner', 'workspace', 'organization', 'assigned_drivers', 'name', 'make',
            'model', 'year', 'license_plate', 'vin', 'fuel_type',
            'engine_capacity_cc', 'transmission', 'tank_capacity_liters',
            'odometer_km', 'status', 'is_active', 'is_selected', 'created_at',
            'updated_at',
        ]
        # owner/workspace are always set server-side from the authenticated
        # request (see VehicleViewSet.perform_create) — never from the client.
        read_only_fields = [
            'id', 'owner', 'workspace', 'organization', 'assigned_drivers', 'created_at', 'updated_at'
        ]

    def validate_year(self, value):
        if value is not None and not (1900 <= value <= 2100):
            raise serializers.ValidationError('Year must be between 1900 and 2100.')
        return value

    def validate_odometer_km(self, value):
        if value < 0:
            raise serializers.ValidationError('Odometer cannot be negative.')
        if self.instance and value < self.instance.odometer_km:
            raise serializers.ValidationError(
                'Odometer cannot be lower than the current reading.'
            )
        return value

    def validate_license_plate(self, value):
        value = value.strip().upper()
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            duplicates = Vehicle.objects.filter(
                owner=request.user, license_plate__iexact=value
            )
            if self.instance:
                duplicates = duplicates.exclude(pk=self.instance.pk)
            if duplicates.exists():
                raise serializers.ValidationError(
                    'A vehicle with this registration number already exists.'
                )
        return value

    def validate(self, attrs):
        capacity = attrs.get('engine_capacity_cc')
        if capacity is not None and capacity <= 0:
            raise serializers.ValidationError({
                'engine_capacity_cc': 'Engine capacity must be greater than zero.'
            })
        if 'status' in self.initial_data and 'status' in attrs:
            attrs['is_active'] = attrs['status'] in {'active', 'simulation'}
        elif 'is_active' in self.initial_data and 'is_active' in attrs:
            attrs['status'] = 'active' if attrs['is_active'] else 'inactive'
        return attrs

    def get_is_selected(self, obj):
        return str(obj.pk) == str(self.active_vehicle_id)

    def create(self, validated_data):
        if not validated_data.get('name'):
            name = ' '.join(
                part for part in (
                    validated_data.get('make', '').strip(),
                    validated_data.get('model', '').strip(),
                ) if part
            )
            validated_data['name'] = name or validated_data['license_plate']
        return super().create(validated_data)
