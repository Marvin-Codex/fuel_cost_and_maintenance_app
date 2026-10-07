import uuid
from decimal import Decimal, ROUND_HALF_UP

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from accounts.models import Organization
from vehicles.models import Vehicle


class FuelRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='fuel_records'
    )
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, null=True, blank=True,
        related_name='fuel_records',
    )
    vehicle = models.ForeignKey(
        Vehicle, on_delete=models.PROTECT, related_name='fuel_records'
    )
    date = models.DateField()
    odometer_km = models.PositiveIntegerField()
    quantity_liters = models.DecimalField(
        max_digits=10, decimal_places=3,
        validators=[MinValueValidator(Decimal('0.001'))],
    )
    unit_price = models.DecimalField(
        max_digits=12, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
    )
    total_cost = models.DecimalField(max_digits=14, decimal_places=2, editable=False)
    fuel_type = models.CharField(max_length=10, choices=Vehicle.FUEL_TYPES, default='petrol')
    station = models.CharField(max_length=150, blank=True)
    notes = models.TextField(blank=True)
    is_full_tank = models.BooleanField(default=False)
    client_id = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['vehicle', '-date'], name='fuel_vehicle_date_idx'),
            models.Index(fields=['owner', '-date'], name='fuel_owner_date_idx'),
            models.Index(fields=['organization', '-date'], name='fuel_org_date_idx'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['owner', 'client_id'],
                condition=models.Q(client_id__isnull=False),
                name='fuel_owner_client_id_unique',
            ),
        ]

    def save(self, *args, **kwargs):
        amount = Decimal(str(self.quantity_liters)) * Decimal(str(self.unit_price))
        self.total_cost = amount.quantize(
            Decimal('0.01'), rounding=ROUND_HALF_UP
        )
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.vehicle} fuel on {self.date}'
