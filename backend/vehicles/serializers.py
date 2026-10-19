from rest_framework import serializers

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

    class Meta:
        model = Vehicle
        fields = [
            'id', 'owner', 'workspace', 'organization', 'assigned_drivers', 'name', 'make',
            'model', 'year', 'license_plate', 'vin', 'fuel_type', 'odometer_km',
            'is_active', 'created_at', 'updated_at',
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
        return value
