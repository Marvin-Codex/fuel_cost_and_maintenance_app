# access_reference

Tested reference implementation of workspaces, packages (plans), roles and permissions.
Design and integration steps are in ACCESS_CONTROL_SPEC.md.

    pip install -r requirements.txt
    python manage.py test access        # 28 tests

Copy `access/` into your backend. `vehicles/` and `proj/` are stand-ins that show how a real app
plugs in (workspace FK, WorkspacePermission, permission_map, check_limit, register_usage).
Regenerate migrations in your own project (`makemigrations access`); do not reuse these.
Tested on Django 6.1 / DRF 3.18 only.
