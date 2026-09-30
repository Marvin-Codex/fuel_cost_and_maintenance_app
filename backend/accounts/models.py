from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """Custom user model.

    Kept deliberately thin for v1 so the auth backend can be extended later
    (e.g. phone, avatar, preferences) without further migration surgery. """

    pass
