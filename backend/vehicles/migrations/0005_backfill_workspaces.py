"""Backfill access workspaces from legacy org data + attach vehicles.

1. Every user without a workspace gets a personal workspace (owner, default plan).
2. Every legacy Organization becomes a Workspace with the SAME UUID
   (so old X-Organization-ID headers keep working as X-Workspace ids),
   on the enterprise plan; legacy memberships map to catalog role keys.
3. Every vehicle gets workspace set (org vehicle -> org workspace, else the
   owner's personal workspace); legacy assigned_drivers mirror to
   VehicleAssignment rows on the driver's membership.
"""

import uuid

from django.db import migrations


LEGACY_ROLE_TO_KEY = {
    'owner': 'owner',
    'admin': 'admin',
    'fleet_manager': 'manager',
    'maintenance_manager': 'manager',
    'driver': 'staff',
    'viewer': 'viewer',
}


def forwards(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    LegacyOrg = apps.get_model('accounts', 'Organization')
    LegacyMembership = apps.get_model('accounts', 'Membership')
    Permission = apps.get_model('access', 'Permission')
    Plan = apps.get_model('access', 'Plan')
    Workspace = apps.get_model('access', 'Workspace')
    Role = apps.get_model('access', 'Role')
    AccessMembership = apps.get_model('access', 'Membership')
    Vehicle = apps.get_model('vehicles', 'Vehicle')
    VehicleAssignment = apps.get_model('vehicles', 'VehicleAssignment')

    # seed_defaults is idempotent (creates only what is missing) — safe here.
    from access.defaults import seed_defaults

    seed_defaults()

    default_plan = Plan.objects.filter(is_default=True).first()
    enterprise_plan = Plan.objects.filter(key='enterprise').first() or default_plan
    roles = {r.key: r for r in Role.objects.filter(workspace=None)}
    owner_role = roles.get('owner')
    if default_plan is None or owner_role is None:
        return

    # 1. Personal workspaces for users with none.
    for user in User.objects.filter(workspace_memberships__isnull=True):
        username = getattr(user, 'username', None) or str(user.pk)
        ws = Workspace.objects.create(
            name=f"{username}'s account", kind='personal', plan=default_plan,
        )
        AccessMembership.objects.create(user=user, workspace=ws, role=owner_role)

    # 2. Legacy organizations -> workspaces (same UUID for header compat).
    for org in LegacyOrg.objects.all():
        ws, created = Workspace.objects.get_or_create(
            pk=org.pk,
            defaults={'name': org.name, 'kind': 'organization', 'plan': enterprise_plan},
        )
        if created:
            ws.save()
        else:
            ws.name = ws.name or org.name
            ws.kind = 'organization'
            if ws.plan_id is None:
                ws.plan = enterprise_plan
            ws.save()
        for legacy in LegacyMembership.objects.filter(organization=org, is_active=True):
            key = LEGACY_ROLE_TO_KEY.get(legacy.role, 'viewer')
            role = roles.get(key) or owner_role
            AccessMembership.objects.get_or_create(
                user_id=legacy.user_id, workspace=ws,
                defaults={'role': role},
            )

    # 3. Vehicles -> workspace + assignment mirror.
    personal_cache = {}

    def personal_ws(user_id):
        if user_id not in personal_cache:
            personal_cache[user_id] = Workspace.objects.filter(
                kind='personal', memberships__user_id=user_id,
            ).first()
        return personal_cache[user_id]

    for vehicle in Vehicle.objects.filter(workspace__isnull=True):
        target = None
        if vehicle.organization_id:
            target = Workspace.objects.filter(pk=vehicle.organization_id).first()
        if target is None:
            target = personal_ws(vehicle.owner_id)
        if target is None:
            continue
        vehicle.workspace = target
        vehicle.save(update_fields=['workspace'])

    # Mirror legacy driver M2M into VehicleAssignment rows.
    through = Vehicle.assigned_drivers.through
    for row in through.objects.all():
        vehicle_id = row.vehicle_id
        user_id = row.user_id if hasattr(row, 'user_id') else getattr(row, 'accountsuser_id', None)
        if user_id is None:
            continue
        vehicle = Vehicle.objects.filter(pk=vehicle_id).first()
        if vehicle is None or vehicle.workspace_id is None:
            continue
        membership = AccessMembership.objects.filter(
            user_id=user_id, workspace_id=vehicle.workspace_id, is_active=True,
        ).first()
        if membership is None:
            continue
        VehicleAssignment.objects.get_or_create(membership=membership, vehicle=vehicle)


def backwards(apps, schema_editor):
    # Data migration only; schema reversal handled by unapplying 0004.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('access', '0001_initial'),
        ('vehicles', '0004_vehicle_assigned_memberships_vehicle_workspace_and_more'),
    ]

    operations = [migrations.RunPython(forwards, backwards)]