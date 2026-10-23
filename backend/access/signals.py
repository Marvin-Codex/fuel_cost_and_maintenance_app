def seed_after_migrate(sender, **kwargs):
    from .defaults import seed_defaults

    seed_defaults()


def bootstrap_user(sender, instance, created, raw=False, **kwargs):
    """Every new user, superusers included, gets a personal workspace they own."""
    if created and not raw:
        from django.db import connection
        from django.db.utils import OperationalError, ProgrammingError

        from .services import create_personal_workspace

        try:
            # Skip while migrations are still building tables: the test
            # runner emits post_save for users before all apps are migrated,
            # and legacy SQLite rebuilds leave half-built tables behind.
            tables = set(connection.introspection.table_names())
            needed = {
                'access_plan', 'access_workspace', 'access_role', 'access_membership',
                'access_permission',
            }
            if not needed.issubset(tables):
                return
            create_personal_workspace(instance)
        except (OperationalError, ProgrammingError):
            return


def bootstrap_user_lazy(sender, instance, **kwargs):
    """Sender-agnostic hook: only reacts to the real user model saves."""
    from django.contrib.auth import get_user_model

    try:
        user_model = get_user_model()
    except Exception:
        return
    if sender is not user_model:
        return
    bootstrap_user(sender, instance, **kwargs)
