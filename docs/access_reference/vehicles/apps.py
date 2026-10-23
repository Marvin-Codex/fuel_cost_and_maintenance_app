from django.apps import AppConfig


class VehiclesConfig(AppConfig):
    name = "vehicles"
    default_auto_field = "django.db.models.BigAutoField"

    def ready(self):
        from access.services import register_usage

        # Tell the limit checker how to count this resource.
        register_usage("vehicles", lambda ws: ws.vehicles.filter(archived=False).count())
