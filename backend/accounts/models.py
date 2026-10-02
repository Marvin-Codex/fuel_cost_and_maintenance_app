import uuid

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Application user; tenancy is represented by memberships, not user roles."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)


class Organization(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=160, unique=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='created_organizations',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Membership(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    OWNER = 'owner'
    ADMIN = 'admin'
    FLEET_MANAGER = 'fleet_manager'
    MAINTENANCE_MANAGER = 'maintenance_manager'
    DRIVER = 'driver'
    VIEWER = 'viewer'
    ROLE_CHOICES = [
        (OWNER, 'Owner'),
        (ADMIN, 'Admin'),
        (FLEET_MANAGER, 'Fleet manager'),
        (MAINTENANCE_MANAGER, 'Maintenance manager'),
        (DRIVER, 'Driver'),
        (VIEWER, 'Viewer'),
    ]

    organization = models.ForeignKey(
        Organization, on_delete=models.CASCADE, related_name='memberships'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='memberships',
        related_query_name='membership',
    )
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default=VIEWER)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['organization', 'user'], name='unique_organization_member'
            )
        ]

    def __str__(self):
        return f'{self.user} — {self.organization} ({self.role})'
