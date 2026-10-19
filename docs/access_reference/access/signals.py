def seed_after_migrate(sender, **kwargs):
    from .defaults import seed_defaults

    seed_defaults()


def bootstrap_user(sender, instance, created, raw=False, **kwargs):
    """Every new user, superusers included, gets a personal workspace they own."""
    if created and not raw:
        from .services import create_personal_workspace

        create_personal_workspace(instance)
