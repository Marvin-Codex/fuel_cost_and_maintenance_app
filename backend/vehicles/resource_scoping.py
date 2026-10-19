from django.db import models

from access.drf import canonical_code

from .scoping import vehicles_for


def vehicles_visible_to_request(request, permission=None):
    """Resolve the workspace vehicle scope for a request.

    `permission` accepts old codes (vehicle.view) or catalog codes
    (vehicles.view); enforcement already happened in WorkspacePermission,
    so this only scopes the queryset. Returns (access.membership, queryset)
    for callers that still expect the old (membership, vehicles) tuple.
    """
    access = getattr(request, 'access', None)
    if access is None:
        raise ValueError('vehicles_visible_to_request requires request.access (WorkspacePermission).')
    return access.membership, vehicles_for(access)


def check_vehicle_permission(request, permission):
    """Explicit per-action check for non-ViewSet views (dashboard, export)."""
    access = getattr(request, 'access', None)
    if access is None:
        from access.services import AccessDenied

        raise AccessDenied('not_a_member', 'Workspace access was not resolved.')
    if not access.can(canonical_code(permission)):
        from rest_framework.exceptions import PermissionDenied

        raise PermissionDenied('Your role or package cannot perform this action.')
    return access
