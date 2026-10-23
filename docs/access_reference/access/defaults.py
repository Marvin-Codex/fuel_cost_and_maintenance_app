"""Editable defaults. seed_defaults() only CREATES what is missing. It never overwrites a plan,
role, limit or name you have edited, so it is safe to run on every migrate."""

from django.db import transaction

from .models import Permission, Plan, Role
from .permissions_catalog import ALL_CODES, PERMISSIONS


def _crud(*resources):
    return [f"{r}.{a}" for r in resources for a in ("view", "add", "edit", "delete")]


_FOUR = ("vehicles", "fuel", "trips", "maintenance")
CORE = _crud(*_FOUR) + ["analytics.view", "servicecentres.view", "workspace.manage", "billing.manage"]
PRO = CORE + ["predictions.use", "analytics.export"]
GROUP = PRO + ["members.view", "members.invite", "members.manage"]
ALL = sorted(ALL_CODES)

PLANS = [
    dict(key="personal-free", name="Personal", kind="personal", is_default=True,
         limits={"vehicles": 1, "members": 1}, entitlements=CORE,
         description="Free. One person, one vehicle."),
    dict(key="personal-pro", name="Personal Pro", kind="personal",
         limits={"vehicles": 5, "members": 1}, entitlements=PRO,
         price_config={"base": 0, "per_vehicle": 0, "included_vehicles": 1},
         description="One person, more vehicles. Price grows with vehicle count (billing later)."),
    dict(key="group", name="Group", kind="group",
         limits={"vehicles": 5, "members": 3}, entitlements=GROUP,
         description="A family or small group sharing the same vehicles and statistics."),
    dict(key="enterprise", name="Enterprise", kind="organization",
         limits={"vehicles": None, "members": None}, entitlements=ALL,
         description="Registered organization with roles. Limits are set per customer."),
]

_VIEW = ["vehicles.view", "fuel.view", "trips.view", "maintenance.view", "analytics.view", "servicecentres.view"]
ROLES = [
    dict(key="owner", name="Owner", permissions=ALL),
    dict(key="admin", name="Administrator", permissions=[c for c in ALL if c != "billing.manage"]),
    dict(key="manager", name="Manager",
         permissions=_crud(*_FOUR) + ["analytics.view", "analytics.export", "predictions.use",
                                      "servicecentres.view", "members.view"]),
    dict(key="member", name="Member",
         permissions=[f"{r}.{a}" for r in _FOUR for a in ("view", "add", "edit")]
         + ["analytics.view", "predictions.use", "servicecentres.view", "members.view"]),
    dict(key="staff", name="Staff / Driver", default_vehicle_scope="assigned",
         permissions=["vehicles.view", "fuel.view", "fuel.add", "trips.view", "trips.add",
                      "maintenance.view", "maintenance.add", "servicecentres.view"]),
    dict(key="viewer", name="Viewer", permissions=_VIEW),
]


def sync_permissions():
    for code, (group, label) in PERMISSIONS.items():
        Permission.objects.update_or_create(code=code, defaults={"group": group, "label": label})


@transaction.atomic
def seed_defaults():
    sync_permissions()
    perms = {p.code: p for p in Permission.objects.all()}
    made = {"plans": 0, "roles": 0}

    for spec in PLANS:
        spec = dict(spec)
        codes = spec.pop("entitlements")
        if spec.get("is_default") and Plan.objects.filter(is_default=True).exists():
            spec["is_default"] = False
        plan, created = Plan.objects.get_or_create(key=spec.pop("key"), defaults={**spec, "is_system": True})
        if created:
            plan.entitlements.set([perms[c] for c in codes])
            made["plans"] += 1

    for spec in ROLES:
        spec = dict(spec)
        codes = spec.pop("permissions")
        role, created = Role.objects.get_or_create(
            workspace=None, key=spec.pop("key"), defaults={**spec, "is_system": True}
        )
        if created:
            role.permissions.set([perms[c] for c in codes])
            made["roles"] += 1
    return made
