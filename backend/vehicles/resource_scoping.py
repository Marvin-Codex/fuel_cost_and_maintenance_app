from accounts.models import Membership
from accounts.permissions import has_permission, tenant_membership

from .models import Vehicle


def vehicles_visible_to_request(request, permission=None):
    """Resolve the personal or organization vehicle scope for a request."""
    membership = tenant_membership(request)
    if membership:
        if permission and not has_permission(
            request.user, permission, membership.organization
        ):
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                'Your organization role or package cannot perform this action.'
            )
        queryset = Vehicle.objects.filter(organization=membership.organization)
        if membership.role == Membership.DRIVER:
            queryset = queryset.filter(assigned_drivers=request.user)
        return membership, queryset.distinct()

    queryset = Vehicle.objects.filter(owner=request.user, organization__isnull=True)
    return None, queryset
