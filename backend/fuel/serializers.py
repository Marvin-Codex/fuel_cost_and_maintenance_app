from rest_framework import serializers

from vehicles.models import Vehicle
from vehicles.resource_api import VehicleScopedSerializerMixin

from .models import FuelRecord


class FuelRecordSerializer(VehicleScopedSerializerMixin, serializers.ModelSerializer):
    total_cost = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = FuelRecord
        fields = [
            'id', 'vehicle', 'date', 'odometer_km', 'quantity_liters',
            'unit_price', 'total_cost', 'fuel_type', 'station', 'notes',
            'is_full_tank', 'client_id', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'total_cost', 'created_at', 'updated_at']

    def validate(self, attrs):
        vehicle = attrs.get('vehicle', getattr(self.instance, 'vehicle', None))
        date = attrs.get('date', getattr(self.instance, 'date', None))
        odometer = attrs.get(
            'odometer_km', getattr(self.instance, 'odometer_km', None)
        )
        if vehicle is None or date is None or odometer is None:
            return attrs
        records = FuelRecord.objects.filter(vehicle=vehicle).exclude(
            pk=getattr(self.instance, 'pk', None)
        )
        previous = records.filter(date__lte=date).order_by('-date', '-odometer_km').first()
        following = records.filter(date__gte=date).order_by('date', 'odometer_km').first()
        if previous and odometer < previous.odometer_km:
            raise serializers.ValidationError({
                'odometer_km': 'Odometer cannot be lower than an earlier fuel record.'
            })
        if following and odometer > following.odometer_km:
            raise serializers.ValidationError({
                'odometer_km': 'Odometer cannot be higher than a later fuel record.'
            })

        vehicle_record = Vehicle.objects.filter(pk=vehicle.pk).first()
        if vehicle_record is None:
            raise serializers.ValidationError({'vehicle': 'Vehicle is unavailable.'})
        if self.instance is None and not records.exists() and odometer < vehicle_record.odometer_km:
            raise serializers.ValidationError({
                'odometer_km': 'Odometer cannot be lower than the vehicle odometer.'
            })
        return attrs
