from django.utils import timezone
from rest_framework import serializers

from vehicles.models import Vehicle
from vehicles.resource_api import VehicleScopedSerializerMixin
from vehicles.scoping import vehicles_for

from .models import FuelRecord


class FuelRecordSerializer(VehicleScopedSerializerMixin, serializers.ModelSerializer):
    date = serializers.DateField(required=False)
    purchased_at = serializers.DateTimeField(required=False, allow_null=True)
    total_cost = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = FuelRecord
        fields = [
            'id', 'vehicle', 'date', 'purchased_at', 'odometer_km', 'quantity_liters',
            'unit_price', 'total_cost', 'fuel_type', 'station', 'notes',
            'receipt_reference', 'is_full_tank', 'client_id', 'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'total_cost', 'created_at', 'updated_at']

    def validate(self, attrs):
        vehicle = attrs.get('vehicle', getattr(self.instance, 'vehicle', None))
        purchased_at = attrs.get(
            'purchased_at', getattr(self.instance, 'purchased_at', None)
        )
        purchase_date = attrs.get('date', getattr(self.instance, 'date', None))
        if purchased_at is not None:
            timestamp_date = timezone.localtime(purchased_at).date()
            if 'date' in attrs and purchase_date != timestamp_date:
                raise serializers.ValidationError({
                    'date': 'Purchase date must match the supplied purchase timestamp.'
                })
            purchase_date = timestamp_date
            attrs['date'] = purchase_date
        elif purchase_date is None and self.instance is None:
            raise serializers.ValidationError({
                'purchased_at': 'Enter the purchase date and time.'
            })
        odometer = attrs.get(
            'odometer_km', getattr(self.instance, 'odometer_km', None)
        )
        if vehicle is None or purchase_date is None or odometer is None:
            return attrs
        records = FuelRecord.objects.filter(vehicle=vehicle).exclude(
            pk=getattr(self.instance, 'pk', None)
        )
        previous = records.filter(date__lte=purchase_date).order_by(
            '-date', '-odometer_km'
        ).first()
        following = records.filter(date__gte=purchase_date).order_by(
            'date', 'odometer_km'
        ).first()
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
        if (
            self.instance is None
            and purchase_date >= timezone.localdate()
            and odometer < vehicle_record.odometer_km
        ):
            raise serializers.ValidationError({
                'odometer_km': 'Odometer cannot be lower than the vehicle odometer.'
            })
        return attrs
