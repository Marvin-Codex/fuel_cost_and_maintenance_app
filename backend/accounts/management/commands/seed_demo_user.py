from getpass import getpass

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.management.base import BaseCommand, CommandError

User = get_user_model()


class Command(BaseCommand):
    """Create (or reset the password of) the local demo user."""

    help = (
        'Create or update the local demo user for development. '
        'The password is entered through a hidden interactive prompt.'
    )

    def add_arguments(self, parser):
        parser.add_argument('--username', default='demo', help='Demo username.')

    def handle(self, *args, **options):
        username = options['username']
        user = User.objects.filter(username=username).first() or User(username=username)
        password = getpass('Password: ')
        confirmation = getpass('Password (again): ')
        if not password:
            raise CommandError('Password cannot be empty.')
        if password != confirmation:
            raise CommandError('The two passwords did not match.')
        try:
            validate_password(password, user)
        except ValidationError as exc:
            raise CommandError('; '.join(exc.messages)) from exc

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
                f"'{username}'. Active: {user.is_active}"
            )
        )
