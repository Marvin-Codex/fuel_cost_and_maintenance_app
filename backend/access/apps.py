from django.apps import AppConfig


class AccessConfig(AppConfig):
    name = "access"
    default_auto_field = "django.db.models.BigAutoField"

    def ready(self):
        from django.db.models.signals import post_migrate, post_save

        from . import signals
        from .services import register_usage

        post_migrate.connect(signals.seed_after_migrate, sender=self)
        # Connect lazily: AUTH_USER_MODEL (accounts.User) may not be loaded
        # yet when this app is ready (app order), so resolve the sender at
        # signal time instead of connect time. weak=False keeps the receiver
        # alive across test DB flushes.
        post_save.connect(
            signals.bootstrap_user_lazy, sender=None, weak=False,
            dispatch_uid='access.bootstrap_user',
        )

        # Vehicle head-count for the "vehicles" limit key.
        def _vehicle_count(workspace):
            from vehicles.models import Vehicle

            return Vehicle.objects.filter(workspace=workspace).count()

        register_usage("vehicles", _vehicle_count)
