from django.apps import AppConfig
from django.conf import settings
from django.db.models.signals import post_migrate, post_save


class AccessConfig(AppConfig):
    name = "access"
    default_auto_field = "django.db.models.BigAutoField"

    def ready(self):
        from . import signals

        post_migrate.connect(signals.seed_after_migrate, sender=self)
        post_save.connect(signals.bootstrap_user, sender=settings.AUTH_USER_MODEL)
