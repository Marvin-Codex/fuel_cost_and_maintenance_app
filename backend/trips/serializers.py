from rest_framework import serializers

from vehicles.resource_api import VehicleScopedSerializerMixin

from .models import Trip


class TripSerializer(VehicleScopedSerializerMixin, serializers.ModelSerializer):
    duration_seconds = serializers.IntegerField(read_only=True)
    average_speed_kmh = serializers.FloatField(read_only=True)
    fuel_cost = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = Trip
        fields = [
            'id', 'vehicle', 'start_location', 'destination', 'started_at',
            'ended_at', 'duration_seconds', 'distance_km', 'start_odometer_km',
            'end_odometer_km', 'average_speed_kmh', 'fuel_consumed_liters',
            'fuel_price_per_liter', 'fuel_cost', 'notes', 'client_id',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        started_at = attrs.get('started_at', getattr(self.instance, 'started_at', None))
        ended_at = attrs.get('ended_at', getattr(self.instance, 'ended_at', None))
        if started_at and ended_at and ended_at <= started_at:
            raise serializers.ValidationError({
                'ended_at': 'Trip end time must be after its start time.'
            })
        start_odometer = attrs.get(
            'start_odometer_km', getattr(self.instance, 'start_odometer_km', None)
        )
        end_odometer = attrs.get(
            'end_odometer_km', getattr(self.instance, 'end_odometer_km', None)
        )
        if (
            start_odometer is not None
            and end_odometer is not None
            and end_odometer < start_odometer
        ):
            raise serializers.ValidationError({
                'end_odometer_km': 'End odometer cannot be lower than start odometer.'
            })
        return attrs
