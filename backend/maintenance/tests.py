from decimal import Decimal

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from vehicles.models import Vehicle

from .models import MaintenanceRecord, MaintenanceReminder


class MaintenanceAPITests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username='service-owner', password='test-pass-123')
        self.other = User.objects.create_user(username='service-other', password='test-pass-123')
        self.vehicle = Vehicle.objects.create(
            owner=self.owner, name='Premio', license_plate='SERV1', odometer_km=42000
        )
        self.other_vehicle = Vehicle.objects.create(
            owner=self.other, name='Hilux', license_plate='SERV2', odometer_km=30000
        )
        self.client.force_authenticate(user=self.owner)

    def test_create_service_record(self):
        response = self.client.post(
            reverse('maintenance:maintenance-record-list'),
            {
                'vehicle': str(self.vehicle.id),
                'service_type': 'Oil & Filter Change',
                'service_date': timezone.localdate().isoformat(),
                'odometer_km': 42100,
                'cost': '180000.00',
                'parts_replaced': ['Oil filter', '5W-30 oil'],
                'technician': 'A. Mechanic',
                'notes': 'Routine service',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data['parts_replaced'], ['Oil filter', '5W-30 oil'])
        self.assertEqual(MaintenanceRecord.objects.get().owner, self.owner)

    def test_create_reminder_returns_computed_due_status(self):
        response = self.client.post(
            reverse('maintenance:maintenance-reminder-list'),
            {
                'vehicle': str(self.vehicle.id),
                'service_type': 'Oil Change',
                'due_odometer_km': 42500,
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data['km_remaining'], 500)
        self.assertEqual(response.data['computed_status'], 'due_soon')

    def test_reminder_requires_date_or_odometer(self):
        response = self.client.post(
            reverse('maintenance:maintenance-reminder-list'),
            {'vehicle': str(self.vehicle.id), 'service_type': 'Oil Change'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_complete_reminder_updates_status(self):
        reminder = MaintenanceReminder.objects.create(
            owner=self.owner,
            vehicle=self.vehicle,
            service_type='Oil Change',
            due_odometer_km=42500,
        )
        response = self.client.post(
            reverse('maintenance:maintenance-reminder-complete', args=[reminder.id])
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        reminder.refresh_from_db()
        self.assertEqual(reminder.status, MaintenanceReminder.COMPLETED)
        self.assertIsNotNone(reminder.completed_at)

    def test_service_records_are_vehicle_scoped(self):
        MaintenanceRecord.objects.create(
            owner=self.other,
            vehicle=self.other_vehicle,
            service_type='Oil Change',
            service_date=timezone.localdate(),
            odometer_km=30100,
            cost=Decimal('50000'),
        )
        response = self.client.get(reverse('maintenance:maintenance-record-list'))
        self.assertEqual(response.data['count'], 0)

    def test_service_summary(self):
        MaintenanceRecord.objects.create(
            owner=self.owner,
            vehicle=self.vehicle,
            service_type='Oil Change',
            service_date=timezone.localdate(),
            odometer_km=42100,
            cost=Decimal('180000.00'),
        )
        response = self.client.get(reverse('maintenance:maintenance-record-summary'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['record_count'], 1)
        self.assertEqual(response.data['this_month_cost'], Decimal('180000.00'))
