"""Workspace queryset helpers (import-safe: no view/serializer imports)."""
from .models import Vehicle


def vehicles_for(access):
    """Only this workspace; `assigned` scope sees only assigned vehicles
    (new VehicleAssignment rows + legacy assigned_drivers M2M)."""
    qs = Vehicle.objects.filter(workspace=access.workspace).select_related(
        'owner', 'workspace', 'organization',
    ).prefetch_related('assigned_drivers')
    if access.vehicle_scope == 'all':
        return qs
    membership = access.membership
    if membership is None:
        return qs
    from django.db import models

    return qs.filter(
        models.Q(assignments__membership=membership)
        | models.Q(assigned_drivers=membership.user)
    ).distinct()