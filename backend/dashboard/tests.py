from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from access.services import access_snapshot
from accounts.models import User
from vehicles.test_helpers import make_vehicle


class DashboardSummaryTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username='dashboard-owner', password='test-pass-123'
        )
        self.vehicle = make_vehicle(
            self.owner, name='Premio', license_plate='DASH1', odometer_km=42580,
        )
        self.client.force_authenticate(user=self.owner)

    def test_summary_returns_vehicle_and_empty_resource_totals(self):
        response = self.client.get(reverse('dashboard:summary'))

        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data['vehicle']['odometer_km'], 42580)
        self.assertEqual(response.data['fuel']['record_count'], 0)
        self.assertEqual(response.data['maintenance']['record_count'], 0)
        self.assertEqual(response.data['trips']['today_count'], 0)

    def test_summary_uses_selected_vehicle_when_no_filter_is_given(self):
        from preferences.models import UserPreference

        selected = make_vehicle(
            self.owner, name='Hilux', license_plate='DASH2', odometer_km=1000,
        )
        UserPreference.objects.create(user=self.owner, active_vehicle=selected)

        response = self.client.get(reverse('dashboard:summary'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['vehicle']['id'], str(selected.id))

    def test_summary_accepts_a_vehicle_filter(self):
        response = self.client.get(
            reverse('dashboard:summary'), {'vehicle': str(self.vehicle.id)}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['vehicle']['id'], str(self.vehicle.id))
    def test_snapshot_reports_personal_workspace(self):
        snapshot = access_snapshot(self.owner)
        self.assertEqual(len(snapshot), 1)
        self.assertEqual(snapshot[0]['limits']['vehicles']['limit'], 1)
        self.assertIn('analytics.view', snapshot[0]['permissions'])
