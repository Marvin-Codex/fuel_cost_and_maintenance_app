import uuid
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from accounts.models import Organization


class Vehicle(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    FUEL_TYPES = [
        ('petrol', 'Petrol'),
        ('diesel', 'Diesel'),
        ('electric', 'Electric'),
        ('hybrid', 'Hybrid'),
        ('lpg', 'LPG'),
    ]
    TRANSMISSION_TYPES = [
        ('manual', 'Manual'),
        ('automatic', 'Automatic'),
        ('cvt', 'CVT'),
        ('other', 'Other'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('in_service', 'In service'),
        ('simulation', 'Simulation'),
    ]

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='vehicles',
    )
    # Null means this is a personal vehicle. Organization vehicles are tenant-scoped.
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='vehicles',
    )
    assigned_drivers = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='assigned_vehicles',
    )
    name = models.CharField(max_length=100, blank=True, default='')
    make = models.CharField(max_length=50, blank=True)
    model = models.CharField(max_length=50, blank=True)
    year = models.PositiveSmallIntegerField(null=True, blank=True)
    license_plate = models.CharField(max_length=20)
    vin = models.CharField(max_length=50, blank=True)
    fuel_type = models.CharField(max_length=10, choices=FUEL_TYPES, default='petrol')
    engine_capacity_cc = models.PositiveIntegerField(null=True, blank=True)
    transmission = models.CharField(
        max_length=20, choices=TRANSMISSION_TYPES, default='other'
    )
    tank_capacity_liters = models.DecimalField(
        max_digits=7, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    odometer_km = models.PositiveIntegerField(default=0)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='simulation'
    )
    # Kept for compatibility with clients that used the original API field.
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['organization', '-created_at'], name='vehicle_org_created_idx'),
            models.Index(fields=['owner', '-created_at'], name='vehicle_owner_created_idx'),
            models.Index(fields=['organization', 'is_active'], name='vehicle_org_active_idx'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['owner', 'license_plate'],
                name='unique_owner_license_plate',
            ),
        ]

    def __str__(self):
        return self.name
