from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from vehicles.models import Vehicle


class DashboardSummaryTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username='dashboard-owner', password='test-pass-123'
        )
        self.vehicle = Vehicle.objects.create(
            owner=self.owner,
            name='Premio',
            license_plate='DASH1',
            odometer_km=42580,
        )
        self.client.force_authenticate(user=self.owner)

    def test_summary_returns_vehicle_and_empty_resource_totals(self):
        response = self.client.get(reverse('dashboard:summary'))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['vehicle']['odometer_km'], 42580)
        self.assertEqual(response.data['fuel']['record_count'], 0)
        self.assertEqual(response.data['maintenance']['record_count'], 0)
        self.assertEqual(response.data['trips']['today_count'], 0)

