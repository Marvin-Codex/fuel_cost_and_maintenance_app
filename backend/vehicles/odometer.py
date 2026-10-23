from .models import Vehicle
from django.utils import timezone


def advance_odometer(vehicle, reading):
    if reading is None:
        return
    Vehicle.objects.filter(
        pk=vehicle.pk,
        odometer_km__lt=reading,
    ).update(odometer_km=reading, updated_at=timezone.now())
