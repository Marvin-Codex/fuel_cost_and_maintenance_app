"""All access decisions live here. Views never look at roles or plans directly."""

import hashlib
import json
import uuid
from dataclasses import dataclass
from typing import Optional

from django.db import models, transaction
from django.db.models import Q

from .models import Membership, Plan, Role, Workspace
from .permissions_catalog import ALL_CODES


class AccessDenied(Exception):
    """Carries a machine-readable `code` the clients can act on."""

    def __init__(self, code, detail=""):
        super().__init__(detail or code)
        self.code = code
        self.extra = {}


class LimitExceeded(AccessDenied):
    def __init__(self, key, limit, used):
        super().__init__("limit_exceeded", f"Package limit reached for '{key}' ({used}/{limit}).")
        self.extra = {"limit_key": key, "limit": limit, "used": used}


@dataclass(frozen=True)
class Access:
    workspace: Workspace
    membership: Optional[Membership]  # None only for a platform superuser who is not a member
    permissions: frozenset
    is_platform_admin: bool

    def can(self, code):
        return self.is_platform_admin or code in self.permissions

    @property
    def vehicle_scope(self):
        if self.is_platform_admin or self.membership is None:
            return "all"
        return self.membership.effective_vehicle_scope


def _codes(qs):
    return set(qs.values_list("code", flat=True))


def plan_ceiling(workspace):
    """What the package includes for this workspace (plan + per-customer grants - revokes)."""
    base = _codes(workspace.plan.entitlements.all()) | _codes(workspace.entitlement_grants.all())
    return base - _codes(workspace.entitlement_revokes.all())


def resolve_access(user, workspace):
    """
    ceiling   = (plan.entitlements + workspace.grants) - workspace.revokes
    effective = ((role.permissions + membership.grants) & ceiling) - membership.denies
    Platform superuser: everything. No membership and not superuser: AccessDenied. Never 'viewer'.
    """
    if not workspace.is_active:
        raise AccessDenied("workspace_inactive", "This workspace is switched off.")
    membership = (
        Membership.objects.select_related("role")
        .filter(user=user, workspace=workspace, is_active=True)
        .first()
    )
    if user.is_superuser:
        return Access(workspace, membership, frozenset(ALL_CODES), True)
    if membership is None:
        raise AccessDenied("not_a_member", "You are not a member of this workspace.")
    allowed = _codes(membership.role.permissions.all()) | _codes(membership.grants.all())
    effective = (allowed & plan_ceiling(workspace)) - _codes(membership.denies.all())
    return Access(workspace, membership, frozenset(effective), False)


def get_active_workspace(user, requested=None):
    """Header X-Workspace picks one. Without it: the user's personal workspace, else their first."""
    mine = Workspace.objects.filter(
        is_active=True, memberships__user=user, memberships__is_active=True
    ).select_related("plan")
    if requested:
        try:
            wid = uuid.UUID(str(requested))
        except ValueError:
            raise AccessDenied("invalid_workspace", "X-Workspace must be a workspace id.")
        ws = mine.filter(pk=wid).first()
        if ws is None and user.is_superuser:
            ws = Workspace.objects.filter(pk=wid, is_active=True).select_related("plan").first()
        if ws is None:
            raise AccessDenied("not_a_member", "You are not a member of this workspace.")
        return ws
    ws = mine.order_by(models.Case(models.When(kind="personal", then=0), default=1), "created_at").first()
    if ws is None:
        raise AccessDenied("no_workspace", "This account has no workspace yet.")
    return ws


# ---- limits ---------------------------------------------------------------------------------

USAGE = {}  # key -> fn(workspace) -> int. Apps register what they count.


def register_usage(key, fn):
    USAGE[key] = fn


register_usage("members", lambda ws: ws.memberships.filter(is_active=True).count())


def get_limit(workspace, key):
    """None = unlimited. Missing everywhere = 0, so a new limit never silently becomes free."""
    if key in workspace.limit_overrides:
        return workspace.limit_overrides[key]
    return workspace.plan.limits.get(key, 0)


def get_usage(workspace, key):
    return USAGE.get(key, lambda ws: 0)(workspace)


def check_limit(workspace, key, adding=1):
    limit = get_limit(workspace, key)
    if limit is None:
        return
    used = get_usage(workspace, key)
    if used + adding > limit:
        raise LimitExceeded(key, limit, used)


# ---- lifecycle ------------------------------------------------------------------------------

@transaction.atomic
def create_personal_workspace(user):
    existing = Workspace.objects.filter(memberships__user=user, kind="personal").first()
    if existing:
        return existing
    plan = Plan.objects.filter(is_default=True).first()
    if plan is None:
        # Seed data may not exist yet (e.g. mid-migration signals) — skip
        # quietly; the backfill command covers users created in that window.
        if Plan.objects.exists() and Role.objects.filter(workspace=None, key="owner").exists():
            raise RuntimeError("No default plan. Run migrate (seeds it) or mark a plan as default.")
        return None
    try:
        owner_role = Role.objects.get(workspace=None, key="owner")
    except Role.DoesNotExist:
        if Plan.objects.exists():
            raise RuntimeError("No owner role template. Run migrate to seed roles.")
        return None
    username = getattr(user, "username", None) or getattr(user, "get_username", lambda: str(user.pk))()
    ws = Workspace.objects.create(name=f"{username}'s account", kind="personal", plan=plan)
    Membership.objects.create(user=user, workspace=ws, role=owner_role)
    return ws


@transaction.atomic
def add_member(workspace, user, role_key, **extra):
    Workspace.objects.select_for_update().get(pk=workspace.pk)
    candidates = Role.objects.filter(Q(workspace=workspace) | Q(workspace__isnull=True), key=role_key)
    role = sorted(candidates, key=lambda r: r.workspace_id is None)[0] if candidates else None
    if role is None:
        raise ValueError(f"Unknown role '{role_key}' for this workspace.")
    existing = Membership.objects.filter(user=user, workspace=workspace).first()
    if existing and existing.is_active:
        raise ValueError("Already a member.")
    check_limit(workspace, "members")
    if existing:
        existing.role, existing.is_active = role, True
        existing.save()
        return existing
    return Membership.objects.create(user=user, workspace=workspace, role=role, **extra)


# ---- what offline clients cache -------------------------------------------------------------

def access_snapshot(user):
    """One entry per workspace the user belongs to. `version` changes only when rights or limit
    values change (not when usage changes), so a client can cheaply tell if its cache is stale."""
    out = []
    memberships = Membership.objects.filter(
        user=user, is_active=True, workspace__is_active=True
    ).select_related("workspace__plan", "role")
    for m in memberships:
        ws = m.workspace
        acc = resolve_access(user, ws)
        keys = sorted(set(ws.plan.limits) | set(ws.limit_overrides))
        limits = {k: {"limit": get_limit(ws, k), "used": get_usage(ws, k)} for k in keys}
        stable = {
            "plan": ws.plan.key,
            "role": m.role.key,
            "permissions": sorted(acc.permissions),
            "vehicle_scope": acc.vehicle_scope,
            "limits": {k: v["limit"] for k, v in limits.items()},
        }
        version = hashlib.sha1(json.dumps(stable, sort_keys=True).encode()).hexdigest()[:12]
        out.append({
            "workspace": {"id": str(ws.pk), "name": ws.name, "kind": ws.kind},
            "plan": {"key": ws.plan.key, "name": ws.plan.name},
            "role": {"key": m.role.key, "name": m.role.name},
            "permissions": stable["permissions"],
            "vehicle_scope": stable["vehicle_scope"],
            "limits": limits,
            "version": version,
        })
    return out
