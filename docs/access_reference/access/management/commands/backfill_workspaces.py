from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from access.services import create_personal_workspace


class Command(BaseCommand):
    help = "Give every existing user who has no workspace a personal one (owner, default plan)."

    def handle(self, *args, **options):
        User = get_user_model()
        made = 0
        for user in User.objects.filter(workspace_memberships__isnull=True):
            create_personal_workspace(user)
            made += 1
        self.stdout.write(f"Created {made} personal workspace(s).")
