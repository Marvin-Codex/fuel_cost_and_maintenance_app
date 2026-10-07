import uuid
from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from accounts.models import Organization
from vehicles.models import Vehicle


class MaintenanceRecord(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='maintenance_records',
    )
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, null=True, blank=True,
        related_name='maintenance_records',
    )
    vehicle = models.ForeignKey(
        Vehicle, on_delete=models.PROTECT, related_name='maintenance_records'
    )
    service_type = models.CharField(max_length=120)
    service_date = models.DateField()
    odometer_km = models.PositiveIntegerField()
    cost = models.DecimalField(
        max_digits=14, decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
    )
    parts_replaced = models.JSONField(default=list, blank=True)
    technician = models.CharField(max_length=150, blank=True)
    service_center = models.CharField(max_length=180, blank=True)
    notes = models.TextField(blank=True)
    client_id = models.UUIDField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-service_date', '-created_at']
        indexes = [
            models.Index(fields=['vehicle', '-service_date'], name='service_vehicle_date_idx'),
            models.Index(fields=['owner', '-service_date'], name='service_owner_date_idx'),
            models.Index(fields=['organization', '-service_date'], name='service_org_date_idx'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['owner', 'client_id'],
                condition=models.Q(client_id__isnull=False),
                name='service_owner_client_id_unique',
            ),
        ]

    def __str__(self):
        return f'{self.service_type} for {self.vehicle} on {self.service_date}'


class MaintenanceReminder(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    OPEN = 'open'
    COMPLETED = 'completed'
    DISMISSED = 'dismissed'
    STATUS_CHOICES = [
        (OPEN, 'Open'),
        (COMPLETED, 'Completed'),
        (DISMISSED, 'Dismissed'),
    ]
    STATUS_CHOICES_DICT = dict(STATUS_CHOICES)

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='maintenance_reminders',
    )
    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, null=True, blank=True,
        related_name='maintenance_reminders',
    )
    vehicle = models.ForeignKey(
        Vehicle, on_delete=models.CASCADE, related_name='maintenance_reminders'
    )
    service_type = models.CharField(max_length=120)
    due_date = models.DateField(null=True, blank=True)
    due_odometer_km = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default=OPEN)
    notes = models.TextField(blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['status', 'due_date', 'due_odometer_km']
        indexes = [
            models.Index(fields=['vehicle', 'status', 'due_date'], name='reminder_vehicle_status_idx'),
            models.Index(fields=['owner', 'status'], name='reminder_owner_status_idx'),
            models.Index(fields=['organization', 'status'], name='reminder_org_status_idx'),
        ]

    def __str__(self):
        return f'{self.service_type} reminder for {self.vehicle}'
