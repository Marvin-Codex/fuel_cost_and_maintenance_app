"""Shared test helpers for workspace-bound fixtures."""
from access.models import Workspace
from vehicles.models import Vehicle


def personal_workspace(user):
    return Workspace.objects.get(kind='personal', memberships__user=user)


def make_vehicle(owner, **kwargs):
    """Create a vehicle inside the owner's personal workspace."""
    defaults = {'name': 'V', 'license_plate': 'T-%s' % Vehicle.objects.count()}
    defaults.update(kwargs)
    return Vehicle.objects.create(
        workspace=personal_workspace(owner), owner=owner, **defaults
    )