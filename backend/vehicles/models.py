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
        ('cng', 'CNG'),
        ('other', 'Other'),
    ]
    TRANSMISSION_TYPES = [
        ('manual', 'Manual'),
        ('automatic', 'Automatic'),
        ('cvt', 'CVT'),
        ('dct', 'Dual-Clutch (DCT)'),
        ('amt', 'AMT'),
        ('other', 'Other'),
    ]
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('in_service', 'In service'),
        ('simulation', 'Simulation'),
        ('maintenance', 'Maintenance'),
    ]
    DRIVE_TYPES = [
        ('fwd', 'Front-Wheel Drive (FWD)'),
        ('rwd', 'Rear-Wheel Drive (RWD)'),
        ('awd', 'All-Wheel Drive (AWD)'),
        ('4wd', 'Four-Wheel Drive (4WD)'),
        ('other', 'Other'),
    ]
    BODY_TYPES = [
        ('sedan', 'Sedan'),
        ('hatchback', 'Hatchback'),
        ('suv', 'SUV'),
        ('crossover', 'Crossover'),
        ('wagon', 'Wagon/Station Wagon'),
        ('pickup', 'Pickup/Truck'),
        ('van', 'Van/Minivan'),
        ('coupe', 'Coupe'),
        ('convertible', 'Convertible'),
        ('bus', 'Bus'),
        ('other', 'Other'),
    ]

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='vehicles',
    )
    # The tenant this vehicle belongs to (spec §2: vehicles belong to a
    # workspace, not to a user). Null during the migration window only;
    # new rows always get the active workspace server-side.
    workspace = models.ForeignKey(
        'access.Workspace',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='vehicles',
    )
    # Legacy tenant pointer. Kept (nullable) so the org->workspace data
    # migration can map old rows; new code must use `workspace`.
    # Null means this is a personal vehicle. Organization vehicles are tenant-scoped.
    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='vehicles',
    )
    # Per-driver visibility for `assigned`-scope roles (spec: VehicleAssignment
    # on the membership). Kept alongside the legacy assigned_drivers M2M
    # during migration; new code uses VehicleAssignment.
    assigned_memberships = models.ManyToManyField(
        'access.Membership',
        blank=True,
        related_name='assigned_vehicles',
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
    color = models.CharField(max_length=30, blank=True)
    body_type = models.CharField(max_length=20, choices=BODY_TYPES, blank=True)
    doors = models.PositiveSmallIntegerField(null=True, blank=True)
    seats = models.PositiveSmallIntegerField(null=True, blank=True)
    fuel_type = models.CharField(max_length=10, choices=FUEL_TYPES, default='petrol')
    engine_capacity_cc = models.PositiveIntegerField(null=True, blank=True)
    cylinders = models.PositiveSmallIntegerField(null=True, blank=True)
    transmission = models.CharField(
        max_length=20, choices=TRANSMISSION_TYPES, default='other'
    )
    drive_type = models.CharField(max_length=10, choices=DRIVE_TYPES, blank=True)
    # Power
    power_hp = models.DecimalField(
        max_digits=7, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    power_kw = models.DecimalField(
        max_digits=7, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    torque_nm = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    # Speeds / weights
    top_speed_kmh = models.DecimalField(
        max_digits=7, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    curb_weight_kg = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    gross_weight_kg = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    tank_capacity_liters = models.DecimalField(
        max_digits=7, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    combined_fuel_consumption_l_100km = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    city_fuel_consumption_l_100km = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    highway_fuel_consumption_l_100km = models.DecimalField(
        max_digits=6, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    battery_capacity_kwh = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(Decimal('0.01'))],
    )
    electric_range_km = models.PositiveIntegerField(null=True, blank=True)
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


class VehicleAssignment(models.Model):
    """Which vehicles a membership with scope `assigned` may see.

    Canonical per spec §3 (lives in the vehicles app, points at
    access.Membership). Mirrors the legacy `assigned_drivers` user M2M so old
    driver rows keep working until removed.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    membership = models.ForeignKey(
        'access.Membership',
        on_delete=models.CASCADE,
        related_name='vehicle_assignments',
    )
    vehicle = models.ForeignKey(
        Vehicle,
        on_delete=models.CASCADE,
        related_name='assignments',
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['membership', 'vehicle'], name='one_assignment_per_pair'
            )
        ]

    def __str__(self):
        return f'{self.membership} → {self.vehicle}'
