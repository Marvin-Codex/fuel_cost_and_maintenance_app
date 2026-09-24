from django.conf import settings
from django.db import models


class Vehicle(models.Model):
    FUEL_TYPES = [
        ('petrol', 'Petrol'),
        ('diesel', 'Diesel'),
        ('electric', 'Electric'),
        ('hybrid', 'Hybrid'),
        ('lpg', 'LPG'),
    ]

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='vehicles',
    )
    name = models.CharField(max_length=100)
    make = models.CharField(max_length=50, blank=True)
    model = models.CharField(max_length=50, blank=True)
    year = models.PositiveSmallIntegerField(null=True, blank=True)
    license_plate = models.CharField(max_length=20)
    vin = models.CharField(max_length=50, blank=True)
    fuel_type = models.CharField(max_length=10, choices=FUEL_TYPES, default='petrol')
    odometer_km = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        constraints = [
            models.UniqueConstraint(
                fields=['owner', 'license_plate'],
                name='unique_owner_license_plate',
            ),
        ]

    def __str__(self):
        return self.name
