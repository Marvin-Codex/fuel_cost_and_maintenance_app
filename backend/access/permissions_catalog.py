"""Every permission the code can enforce. This file is the single source of truth.

Rows in the Permission table are synced from here (see defaults.sync_permissions).
You cannot invent a permission in the admin: if code never checks it, it does nothing.
To add a feature: add its code here, check it in the view, run `migrate` (or seed_defaults).
"""

PERMISSIONS = {}

for _res, _noun in [
    ("vehicles", "vehicles"),
    ("fuel", "fuel records"),
    ("trips", "trips"),
    ("maintenance", "maintenance records"),
]:
    for _act in ("view", "add", "edit", "delete"):
        PERMISSIONS[f"{_res}.{_act}"] = (_noun.capitalize(), f"{_act.capitalize()} {_noun}")

PERMISSIONS.update(
    {
        "analytics.view": ("Analytics", "View dashboard and charts"),
        "analytics.export": ("Analytics", "Export reports"),
        "predictions.use": ("Intelligence", "Use fuel cost / consumption predictions"),
        "servicecentres.view": ("Service centres", "Find service centres"),
        "members.view": ("People", "See who is in the workspace"),
        "members.invite": ("People", "Invite people"),
        "members.manage": ("People", "Change roles and remove people"),
        "roles.manage": ("People", "Create custom roles in this workspace"),
        "workspace.manage": ("Workspace", "Rename and configure the workspace"),
        "billing.manage": ("Workspace", "See and change the package / billing"),
        "audit.view": ("Workspace", "View the activity log"),
    }
)

ALL_CODES = frozenset(PERMISSIONS)
