from django.db import models


class Vehicle(models.Model):
    """Stand-in for your real Vehicle. The one requirement: it belongs to a workspace, not a user."""

    workspace = models.ForeignKey("access.Workspace", on_delete=models.CASCADE, related_name="vehicles")
    name = models.CharField(max_length=80)
    archived = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class VehicleAssignment(models.Model):
    """Used by roles whose vehicle scope is 'assigned' (e.g. a driver sees only their own vehicle)."""

    membership = models.ForeignKey("access.Membership", on_delete=models.CASCADE, related_name="vehicle_assignments")
    vehicle = models.ForeignKey(Vehicle, on_delete=models.CASCADE, related_name="assignments")

    class Meta:
        constraints = [models.UniqueConstraint(fields=["membership", "vehicle"], name="one_assignment_per_pair")]
