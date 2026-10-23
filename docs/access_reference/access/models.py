import uuid

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q


class Permission(models.Model):
    """Catalog row, synced from permissions_catalog.py. Read-only in the admin."""

    code = models.CharField(max_length=64, unique=True)
    group = models.CharField(max_length=40)
    label = models.CharField(max_length=120)

    class Meta:
        ordering = ["group", "code"]

    def __str__(self):
        return self.code


class Plan(models.Model):
    """A package. `key` is the stable id used by code and seeds; `name` is what people see
    and is freely editable. Custom packages are just more rows (is_public=False)."""

    class Kind(models.TextChoices):
        PERSONAL = "personal", "Personal"
        GROUP = "group", "Group"
        ORGANIZATION = "organization", "Organization"

    key = models.SlugField(unique=True)
    name = models.CharField(max_length=80)
    kind = models.CharField(max_length=20, choices=Kind.choices, default=Kind.PERSONAL)
    description = models.TextField(blank=True)
    is_public = models.BooleanField(default=True, help_text="Off = custom package for specific customers")
    is_default = models.BooleanField(default=False, help_text="Given to every new signup. Only one.")
    is_system = models.BooleanField(default=False, help_text="Seeded default. Editable, not deletable.")
    is_active = models.BooleanField(default=True)
    # {"vehicles": 1, "members": 1}. null = unlimited. A key that is missing = 0 (deny by default).
    limits = models.JSONField(default=dict, blank=True)
    # The feature CEILING of the package: nobody on this plan can ever exceed it.
    entitlements = models.ManyToManyField(Permission, blank=True, related_name="plans")
    # Reserved for billing later, e.g. {"base": 0, "per_vehicle": 5000, "included_vehicles": 1}
    price_config = models.JSONField(default=dict, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["is_default"], condition=Q(is_default=True), name="one_default_plan")
        ]

    def save(self, *args, **kwargs):
        if self.is_default:
            Plan.objects.exclude(pk=self.pk).filter(is_default=True).update(is_default=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Workspace(models.Model):
    """The tenant. Personal accounts, groups and organizations are all Workspaces.
    `kind` is only a label for the UI; behaviour comes from the plan, limits and roles."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=120)
    kind = models.CharField(max_length=20, choices=Plan.Kind.choices, default=Plan.Kind.PERSONAL)
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name="workspaces")
    # Per-customer exceptions on top of the plan (this is how a "custom package" is tuned):
    limit_overrides = models.JSONField(default=dict, blank=True)
    entitlement_grants = models.ManyToManyField(Permission, blank=True, related_name="+")
    entitlement_revokes = models.ManyToManyField(Permission, blank=True, related_name="+")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.plan.name})"


class Role(models.Model):
    """workspace=None  -> platform template, shared by every workspace (edit once, applies everywhere).
    workspace=<ws>    -> custom role that exists only in that workspace."""

    class Scope(models.TextChoices):
        ALL = "all", "All vehicles"
        ASSIGNED = "assigned", "Only assigned vehicles"

    workspace = models.ForeignKey(Workspace, null=True, blank=True, on_delete=models.CASCADE, related_name="custom_roles")
    key = models.SlugField()
    name = models.CharField(max_length=80)
    permissions = models.ManyToManyField(Permission, blank=True, related_name="roles")
    default_vehicle_scope = models.CharField(max_length=10, choices=Scope.choices, default=Scope.ALL)
    is_system = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["workspace", "key"], name="uniq_role_key_per_workspace"),
            models.UniqueConstraint(fields=["key"], condition=Q(workspace__isnull=True), name="uniq_template_role_key"),
        ]

    def __str__(self):
        return self.name if self.workspace_id is None else f"{self.name} [{self.workspace.name}]"


class Membership(models.Model):
    """A user's seat in a workspace. One user can have many (personal + group + org)."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="workspace_memberships")
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name="memberships")
    role = models.ForeignKey(Role, on_delete=models.PROTECT, related_name="memberships")
    # blank = inherit from the role
    vehicle_scope = models.CharField(max_length=10, choices=Role.Scope.choices, blank=True, default="")
    # Per-user tweaks. Grants are still capped by the plan ceiling; denies always win.
    grants = models.ManyToManyField(Permission, blank=True, related_name="+")
    denies = models.ManyToManyField(Permission, blank=True, related_name="+")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "workspace"], name="one_membership_per_user_workspace")]

    @property
    def effective_vehicle_scope(self):
        return self.vehicle_scope or self.role.default_vehicle_scope

    def clean(self):
        if self.role.workspace_id not in (None, self.workspace_id):
            raise ValidationError("That role belongs to a different workspace.")

    def __str__(self):
        return f"{self.user} @ {self.workspace.name} as {self.role.name}"
