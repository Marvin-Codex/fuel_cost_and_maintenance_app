from rest_framework import serializers

from .models import Vehicle


class VehicleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehicle
        fields = [
            'id', 'owner', 'name', 'make', 'model', 'year', 'license_plate',
            'vin', 'fuel_type', 'odometer_km', 'is_active', 'created_at',
            'updated_at',
        ]
        # owner is always set server-side from the authenticated request user
        # (see VehicleViewSet.perform_create) — never accepted from the client.
        read_only_fields = ['id', 'owner', 'created_at', 'updated_at']

    def validate_year(self, value):
        if value is not None and not (1900 <= value <= 2100):
            raise serializers.ValidationError('Year must be between 1900 and 2100.')
        return value

    def validate_odometer_km(self, value):
        if value < 0:
            raise serializers.ValidationError('Odometer cannot be negative.')
        return value
