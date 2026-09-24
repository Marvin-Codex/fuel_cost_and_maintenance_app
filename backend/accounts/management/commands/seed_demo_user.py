from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

User = get_user_model()


class Command(BaseCommand):
    """Create (or reset the password of) the local demo user."""

    help = (
        'Create or update the local demo user for development. '
        'Usage: python manage.py seed_demo_user [--username demo] [--password demo12345]'
    )

    def add_arguments(self, parser):
        parser.add_argument('--username', default='demo', help='Demo username.')
        parser.add_argument('--password', default='demo12345', help='Demo password.')

    def handle(self, *args, **options):
        username = options['username']
        password = options['password']

        user, created = User.objects.get_or_create(
            username=username,
            defaults={'is_active': True},
        )
        user.is_active = True
        user.set_password(password)
        user.save()

        self.stdout.write(
            self.style.SUCCESS(
                f"{'Created' if created else 'Updated'} demo user "
                f"'{username}' (password: {password}). Active: {user.is_active}"
            )
        )
