from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied

from accounts.models import Membership
from accounts.permissions import has_permission, tenant_membership

from .models import Vehicle
from .serializers import VehicleSerializer


class VehicleViewSet(viewsets.ModelViewSet):
    serializer_class = VehicleSerializer

    def _membership(self):
        return tenant_membership(self.request)

    def _require_permission(self, permission):
        membership = self._membership()
        if membership and not has_permission(
            self.request.user, permission, membership.organization
        ):
            raise PermissionDenied(
                'Your organization role or package cannot perform this action.'
            )
        return membership

    def get_queryset(self):
        user = self.request.user
        membership = self._membership()
        if membership and not has_permission(
            user, 'vehicle.view', membership.organization
        ):
            raise PermissionDenied(
                'Your organization role or package cannot view vehicles.'
            )
        if membership:
            queryset = Vehicle.objects.filter(
                organization_id=membership.organization_id
            ).select_related('owner', 'organization').prefetch_related('assigned_drivers')
            if membership.role == Membership.DRIVER:
                queryset = queryset.filter(assigned_drivers=user)
            return queryset
        # No organization header means the personal workspace. This preserves
        # individual-user accounts and prevents accidental cross-tenant access.
        return Vehicle.objects.filter(
            owner=user, organization__isnull=True
        ).select_related('owner').prefetch_related('assigned_drivers')

    def perform_create(self, serializer):
        membership = self._require_permission('vehicle.create')
        if membership:
            serializer.save(owner=self.request.user, organization=membership.organization)
            return
        serializer.save(owner=self.request.user)

    def update(self, request, *args, **kwargs):
        membership = self._require_permission('vehicle.update')
        if not membership and self.get_object().owner_id != request.user.id:
            raise PermissionDenied('You do not own this vehicle.')
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        self._require_permission('vehicle.delete')
        return super().destroy(request, *args, **kwargs)
