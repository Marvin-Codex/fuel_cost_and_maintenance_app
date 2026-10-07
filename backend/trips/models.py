import uuid
from decimal import Decimal, ROUND_HALF_UP

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from accounts.models import Organization
from vehicles.models import Vehicle


class Trip(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='trips'
    )
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, null=True, blank=True,
        related_name='trips',
    )
    vehicle = models.ForeignKey(Vehicle, on_delete=models.PROTECT, related_name='trips')
    start_location = models.CharField(max_length=200)
    destination = models.CharField(max_length=200)
    started_at = models.DateTimeField()
    ended_at = models.DateTimeField()
    distance_km = models.DecimalField(
        max_digits=10, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    start_odometer_km = models.PositiveIntegerField(null=True, blank=True)
    end_odometer_km = models.PositiveIntegerField(null=True, blank=True)
    fuel_consumed_liters = models.DecimalField(
        max_digits=10, decimal_places=3, null=True, blank=True,
        validators=[MinValueValidator(Decimal('0.001'))],
    )
    fuel_price_per_liter = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(Decimal('0.00'))],
    )
    fuel_cost = models.DecimalField(max_digits=14, decimal_places=2, editable=False)
    notes = models.TextField(blank=True)
    client_id = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-started_at']
        indexes = [
            models.Index(fields=['vehicle', '-started_at'], name='trip_vehicle_started_idx'),
            models.Index(fields=['owner', '-started_at'], name='trip_owner_started_idx'),
            models.Index(fields=['organization', '-started_at'], name='trip_org_started_idx'),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(ended_at__gt=models.F('started_at')),
                name='trip_end_after_start',
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(start_odometer_km__isnull=True)
                    | models.Q(end_odometer_km__isnull=True)
                    | models.Q(end_odometer_km__gte=models.F('start_odometer_km'))
                ),
                name='trip_odometer_non_decreasing',
            ),
            models.UniqueConstraint(
                fields=['owner', 'client_id'],
                condition=models.Q(client_id__isnull=False),
                name='trip_owner_client_id_unique',
            ),
        ]

    @property
    def duration_seconds(self):
        return int((self.ended_at - self.started_at).total_seconds())

    @property
    def average_speed_kmh(self):
        duration_hours = self.duration_seconds / 3600
        return round(float(self.distance_km) / duration_hours, 1) if duration_hours else None

    def save(self, *args, **kwargs):
        if self.fuel_consumed_liters is not None and self.fuel_price_per_liter is not None:
            fuel_consumed = Decimal(str(self.fuel_consumed_liters))
            fuel_price = Decimal(str(self.fuel_price_per_liter))
            self.fuel_cost = (
                fuel_consumed * fuel_price
            ).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        else:
            self.fuel_cost = Decimal('0.00')
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.start_location} to {self.destination} ({self.started_at:%Y-%m-%d})'
