import csv
import io

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from vehicles.models import Vehicle


class PreferencesAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='prefs-user', password='test-pass-123')
        self.other = User.objects.create_user(username='prefs-other', password='test-pass-123')
        Vehicle.objects.create(owner=self.user, name='Mine', license_plate='PREF1')
        Vehicle.objects.create(owner=self.other, name='Theirs', license_plate='PREF2')
        self.client.force_authenticate(user=self.user)

    def test_preferences_defaults_and_update(self):
        url = reverse('preferences:preferences')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['dark_mode'])
        self.assertEqual(response.data['thresholds']['low_fuel_percent'], 20)

        updated = self.client.patch(
            url,
            {
                'currency': 'USD',
                'units': 'imperial',
                'thresholds': {'low_fuel_percent': 15},
                'alert_settings': {'overspeed': False},
            },
            format='json',
        )
        self.assertEqual(updated.status_code, status.HTTP_200_OK, updated.data)
        self.assertEqual(updated.data['currency'], 'USD')
        self.assertEqual(updated.data['thresholds']['low_fuel_percent'], 15)
        self.assertFalse(updated.data['alert_settings']['overspeed'])

    def test_invalid_threshold_is_rejected(self):
        response = self.client.patch(
            reverse('preferences:preferences'),
            {'thresholds': {'low_fuel_percent': 101}},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_preferences_require_authentication(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(reverse('preferences:preferences'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_export_is_csv_and_only_contains_accessible_vehicle_records(self):
        response = self.client.get(reverse('preferences:data-export'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        rows = list(csv.reader(io.StringIO(response.content.decode('utf-8'))))
        self.assertEqual(rows[0][0], 'record_type')
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[1][0], 'vehicle')
        self.assertIn('text/csv', response['Content-Type'])

    def test_export_escapes_spreadsheet_formula_cells(self):
        vehicle = Vehicle.objects.get(owner=self.user)
        vehicle.name = '=HYPERLINK("https://example.invalid")'
        vehicle.save(update_fields=['name'])

        response = self.client.get(reverse('preferences:data-export'))
        rows = list(csv.reader(io.StringIO(response.content.decode('utf-8'))))

        self.assertEqual(rows[1][3], '\'=HYPERLINK("https://example.invalid")')
