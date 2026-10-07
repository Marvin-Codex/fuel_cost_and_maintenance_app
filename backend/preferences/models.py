from django.conf import settings
from django.db import models


def default_alert_settings():
    return {
        'low_fuel': True,
        'engine_overheating': True,
        'low_battery': True,
        'service_due': True,
        'fault_codes': True,
        'overspeed': True,
        'high_fuel_consumption': True,
    }


def default_thresholds():
    return {
        'low_fuel_percent': 20,
        'engine_temperature_c': 105,
        'overspeed_kmh': 100,
    }


class UserPreference(models.Model):
    UNIT_CHOICES = [('metric', 'Metric'), ('imperial', 'Imperial')]
    id = models.BigAutoField(primary_key=True)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='preferences'
    )
    alert_settings = models.JSONField(default=default_alert_settings)
    thresholds = models.JSONField(default=default_thresholds)
    units = models.CharField(max_length=10, choices=UNIT_CHOICES, default='metric')
    currency = models.CharField(max_length=3, default='UGX')
    language = models.CharField(max_length=10, default='en')
    notifications_enabled = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=['updated_at'], name='pref_updated_idx')]

    def __str__(self):
        return f'Preferences for {self.user}'
