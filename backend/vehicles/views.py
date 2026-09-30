from rest_framework import viewsets

from .models import Vehicle
from .serializers import VehicleSerializer


class VehicleViewSet(viewsets.ModelViewSet):
    """Full CRUD, always scoped to the authenticated user's own vehicles."""

    serializer_class = VehicleSerializer

    def get_queryset(self):
        # Ownership check lives here: a client can never reach or mutate another
        # user's vehicle (retrieval by id returns 404).
        return Vehicle.objects.filter(owner=self.request.user)

    def perform_create(self, serializer):
        # Owner is always the authenticated user — never a client-supplied id.
        serializer.save(owner=self.request.user)
