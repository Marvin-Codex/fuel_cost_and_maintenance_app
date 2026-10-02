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


class Plan(models.Model):
    """A package of features that can be assigned to an organization."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class PlanFeature(models.Model):
    """A domain feature granted by a plan, such as ``vehicle.view``."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name='features')
    code = models.CharField(max_length=100)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['plan', 'code'], name='unique_plan_feature')
        ]
        indexes = [models.Index(fields=['plan', 'code'], name='plan_feature_lookup_idx')]

    def __str__(self):
        return f'{self.plan.slug}: {self.code}'


class Subscription(models.Model):
    """The time window in which an organization can use a plan."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    organization = models.ForeignKey(
        'Organization', on_delete=models.CASCADE, related_name='subscriptions'
    )
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name='subscriptions')
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-starts_at']
        indexes = [
            models.Index(
                fields=['organization', 'is_active', 'starts_at', 'ends_at'],
                name='subscription_org_window_idx',
            )
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(ends_at__gt=models.F('starts_at')),
                name='subscription_end_after_start',
            )
        ]

    def __str__(self):
        return f'{self.organization} — {self.plan}'


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
        indexes = [
            models.Index(fields=['user', 'is_active'], name='membership_user_active_idx'),
            models.Index(fields=['organization', 'is_active'], name='membership_org_active_idx'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['organization', 'user'], name='unique_organization_member'
            )
        ]

    def __str__(self):
        return f'{self.user} — {self.organization} ({self.role})'
