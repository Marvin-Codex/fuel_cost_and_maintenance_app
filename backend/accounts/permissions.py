from django.utils import timezone
from rest_framework.exceptions import PermissionDenied

from .models import Membership, Subscription


# Permission names are intentionally domain-based so other resources can reuse them.
ROLE_PERMISSIONS = {
    Membership.OWNER: {
        'vehicle.view', 'vehicle.create', 'vehicle.update', 'vehicle.delete',
        'fuel.view', 'fuel.create', 'fuel.update', 'fuel.delete',
        'trip.view', 'trip.create', 'trip.update', 'trip.delete',
        'maintenance.view', 'maintenance.create', 'maintenance.update', 'maintenance.delete',
        'system.view', 'system.update', 'member.manage',
    },
    Membership.ADMIN: {
        'vehicle.view', 'vehicle.create', 'vehicle.update', 'vehicle.delete',
        'fuel.view', 'fuel.create', 'fuel.update', 'fuel.delete',
        'trip.view', 'trip.create', 'trip.update', 'trip.delete',
        'maintenance.view', 'maintenance.create', 'maintenance.update', 'maintenance.delete',
        'system.view', 'system.update', 'member.manage',
    },
    Membership.FLEET_MANAGER: {
        'vehicle.view', 'vehicle.create', 'vehicle.update', 'vehicle.delete',
        'fuel.view', 'fuel.create', 'fuel.update', 'fuel.delete',
        'trip.view', 'trip.create', 'trip.update', 'trip.delete',
        'maintenance.view', 'maintenance.create', 'maintenance.update', 'maintenance.delete',
        'system.view', 'system.update',
    },
    Membership.MAINTENANCE_MANAGER: {
        'vehicle.view', 'vehicle.update',
        'fuel.view', 'trip.view',
        'maintenance.view', 'maintenance.create', 'maintenance.update', 'maintenance.delete',
        'system.view',
    },
    Membership.DRIVER: {
        'vehicle.view', 'fuel.view', 'fuel.create',
        'trip.view', 'trip.create', 'maintenance.view', 'system.view',
    },
    Membership.VIEWER: {
        'vehicle.view', 'fuel.view', 'trip.view', 'maintenance.view', 'system.view',
    },
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


def active_subscription(organization):
    now = timezone.now()
    return (
        Subscription.objects.filter(
            organization=organization,
            is_active=True,
            plan__is_active=True,
            starts_at__lte=now,
            ends_at__gt=now,
        )
        .select_related('plan')
        .prefetch_related('plan__features')
        .first()
    )


def has_feature(organization, feature):
    subscription = active_subscription(organization)
    return bool(
        subscription
        and subscription.plan.features.filter(code=feature).exists()
    )


def has_permission(user, permission, organization=None):
    if user.is_superuser:
        return True
    membership = membership_for(user, getattr(organization, 'pk', organization))
    return bool(
        membership
        and permission in ROLE_PERMISSIONS.get(membership.role, set())
        and (not organization or has_feature(organization, permission))
    )


def organization_from_request(request):
    membership = tenant_membership(request)
    return membership.organization if membership else None
