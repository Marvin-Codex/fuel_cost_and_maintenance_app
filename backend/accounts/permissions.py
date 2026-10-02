from rest_framework.exceptions import PermissionDenied

from .models import Membership


# Permission names are intentionally domain-based so other resources can reuse them.
ROLE_PERMISSIONS = {
    Membership.OWNER: {'vehicle.view', 'vehicle.create', 'vehicle.update', 'vehicle.delete', 'member.manage'},
    Membership.ADMIN: {'vehicle.view', 'vehicle.create', 'vehicle.update', 'vehicle.delete', 'member.manage'},
    Membership.FLEET_MANAGER: {'vehicle.view', 'vehicle.create', 'vehicle.update', 'vehicle.delete'},
    Membership.MAINTENANCE_MANAGER: {'vehicle.view', 'vehicle.update'},
    Membership.DRIVER: {'vehicle.view'},
    Membership.VIEWER: {'vehicle.view'},
}


def membership_for(user, organization_id=None):
    memberships = user.memberships.filter(is_active=True).select_related('organization')
    if organization_id:
        return memberships.filter(organization_id=organization_id).first()
    candidates = list(memberships[:2])
    return candidates[0] if len(candidates) == 1 else None


def tenant_membership(request):
    """Resolve the authenticated request to exactly one tenant context."""
    organization_id = request.headers.get('X-Organization-ID')
    if not organization_id:
        return None
    membership = membership_for(request.user, organization_id)
    if membership is None:
        raise PermissionDenied('Invalid or inaccessible organization.')
    return membership


def has_permission(user, permission, organization=None):
    if user.is_superuser:
        return True
    membership = membership_for(user, getattr(organization, 'pk', organization))
    return bool(membership and permission in ROLE_PERMISSIONS.get(membership.role, set()))


def organization_from_request(request):
    membership = tenant_membership(request)
    return membership.organization if membership else None
