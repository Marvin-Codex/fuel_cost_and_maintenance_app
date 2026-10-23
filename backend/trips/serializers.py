from decimal import Decimal

from django.utils import timezone
from rest_framework import serializers

from vehicles.resource_api import VehicleScopedSerializerMixin

from .models import Trip


class TripSerializer(VehicleScopedSerializerMixin, serializers.ModelSerializer):
    duration_seconds = serializers.IntegerField(read_only=True)
    average_speed_kmh = serializers.FloatField(read_only=True)
    fuel_economy_l_per_100km = serializers.FloatField(read_only=True)
    fuel_cost = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = Trip
        fields = [
            'id', 'vehicle', 'start_location', 'destination', 'started_at',
            'ended_at', 'duration_seconds', 'distance_km', 'start_odometer_km',
            'end_odometer_km', 'average_speed_kmh', 'fuel_economy_l_per_100km',
            'fuel_consumed_liters', 'fuel_price_per_liter', 'fuel_cost',
            'max_speed_kmh', 'overspeed_events', 'hard_braking_events',
            'excessive_idling_seconds', 'notes', 'client_id',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'start_odometer_km', 'created_at', 'updated_at'
        ]

    def validate(self, attrs):
        vehicle = attrs.get('vehicle', getattr(self.instance, 'vehicle', None))
        started_at = attrs.get(
            'started_at', getattr(self.instance, 'started_at', timezone.now())
        )
        ended_at = attrs.get('ended_at', getattr(self.instance, 'ended_at', None))
        start_odometer = attrs.get(
            'start_odometer_km',
            getattr(
                self.instance,
                'start_odometer_km',
                vehicle.odometer_km if vehicle else None,
            ),
        )
        end_odometer = attrs.get(
            'end_odometer_km', getattr(self.instance, 'end_odometer_km', None)
        )

        if self.instance is None and vehicle is not None:
            start_odometer = vehicle.odometer_km
            attrs['start_odometer_km'] = start_odometer

        finishing_open_trip = (
            self.instance is not None
            and self.instance.ended_at is None
            and (ended_at is not None or end_odometer is not None)
        )
        if self.instance is None and end_odometer is not None and ended_at is None:
            ended_at = timezone.now()
            attrs['ended_at'] = ended_at
        if finishing_open_trip:
            if end_odometer is None:
                raise serializers.ValidationError({
                    'end_odometer_km': 'Enter the ending odometer to complete this trip.'
                })
            ended_at = ended_at or timezone.now()
            attrs['ended_at'] = ended_at

        if started_at and ended_at and ended_at <= started_at:
            raise serializers.ValidationError({
                'ended_at': 'Trip end time must be after its start time.'
            })

        if (
            start_odometer is not None
            and end_odometer is not None
            and end_odometer < start_odometer
        ):
            raise serializers.ValidationError({
                'end_odometer_km': 'End odometer cannot be lower than start odometer.'
            })

        if end_odometer is not None and start_odometer is not None:
            distance = Decimal(end_odometer - start_odometer).quantize(
                Decimal('0.01')
            )
            if distance <= 0:
                raise serializers.ValidationError({
                    'end_odometer_km': (
                        'Ending odometer must be greater than the starting reading.'
                    )
                })
            supplied_distance = attrs.get(
                'distance_km', getattr(self.instance, 'distance_km', None)
            )
            if (
                supplied_distance is not None
                and Decimal(str(supplied_distance)) != distance
            ):
                raise serializers.ValidationError({
                    'distance_km': (
                        'Distance must equal the ending odometer minus the starting '
                        f'odometer ({distance} km).'
                    )
                })
            if ended_at is not None:
                attrs['distance_km'] = distance

        if ended_at is not None:
            distance = attrs.get(
                'distance_km', getattr(self.instance, 'distance_km', None)
            )
            if distance is None:
                raise serializers.ValidationError({
                    'distance_km': (
                        'Enter an odometer difference or trip distance to complete this trip.'
                    )
                })
        elif attrs.get('distance_km') is not None:
            raise serializers.ValidationError({
                'distance_km': 'Distance is recorded when the trip is completed.'
            })

        return attrs
