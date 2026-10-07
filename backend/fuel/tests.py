from datetime import date
from decimal import Decimal
from django.db import IntegrityError, transaction
import uuid

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from vehicles.models import Vehicle

from .models import FuelRecord


class FuelRecordAPITests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username='fuel-owner', password='test-pass-123')
        self.other = User.objects.create_user(username='fuel-other', password='test-pass-123')
        self.vehicle = Vehicle.objects.create(
            owner=self.owner, name='Premio', license_plate='FUEL1', odometer_km=10000
        )
        self.other_vehicle = Vehicle.objects.create(
            owner=self.other, name='Hilux', license_plate='FUEL2', odometer_km=12000
        )
        self.client.force_authenticate(user=self.owner)

    def test_create_calculates_total_cost_on_server(self):
        response = self.client.post(
            reverse('fuel:fuel-record-list'),
            {
                'vehicle': str(self.vehicle.id),
                'date': date.today().isoformat(),
                'odometer_km': 10100,
                'quantity_liters': '20.500',
                'unit_price': '5200.00',
                'total_cost': '1.00',
                'fuel_type': 'petrol',
                'is_full_tank': True,
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data['total_cost'], '106600.00')
        record = FuelRecord.objects.get()
        self.assertEqual(record.owner, self.owner)
        self.assertEqual(record.total_cost, Decimal('106600.00'))

    def test_fuel_record_cannot_reference_another_users_vehicle(self):
        response = self.client.post(
            reverse('fuel:fuel-record-list'),
            {
                'vehicle': str(self.other_vehicle.id),
                'date': date.today().isoformat(),
                'odometer_km': 12100,
                'quantity_liters': '10',
                'unit_price': '5000',
                'fuel_type': 'petrol',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(FuelRecord.objects.exists())

    def test_odometer_cannot_precede_vehicle_odometer(self):
        response = self.client.post(
            reverse('fuel:fuel-record-list'),
            {
                'vehicle': str(self.vehicle.id),
                'date': date.today().isoformat(),
                'odometer_km': 9999,
                'quantity_liters': '10',
                'unit_price': '5000',
                'fuel_type': 'petrol',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('odometer_km', response.data)

    def test_list_and_summary_are_vehicle_scoped(self):
        FuelRecord.objects.create(
            owner=self.owner,
            vehicle=self.vehicle,
            date=date.today(),
            odometer_km=10100,
            quantity_liters=10,
            unit_price=5000,
            fuel_type='petrol',
        )
        FuelRecord.objects.create(
            owner=self.other,
            vehicle=self.other_vehicle,
            date=date.today(),
            odometer_km=12100,
            quantity_liters=30,
            unit_price=5000,
            fuel_type='diesel',
        )
        response = self.client.get(reverse('fuel:fuel-record-list'))
        summary = self.client.get(reverse('fuel:fuel-record-summary'))
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(summary.status_code, status.HTTP_200_OK)
        self.assertEqual(summary.data['record_count'], 1)
        self.assertEqual(summary.data['total_cost'], Decimal('50000.00'))

    def test_empty_summary_returns_zero_costs(self):
        summary = self.client.get(reverse('fuel:fuel-record-summary'))
        self.assertEqual(summary.status_code, status.HTTP_200_OK)
        self.assertEqual(summary.data['total_cost'], Decimal('0.00'))
        self.assertEqual(summary.data['this_month_cost'], Decimal('0.00'))

    def test_create_requires_authentication(self):
        self.client.force_authenticate(user=None)
        response = self.client.get(reverse('fuel:fuel-record-list'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_client_id_is_unique_per_owner(self):
        client_id = uuid.uuid4()
        FuelRecord.objects.create(
            owner=self.owner,
            vehicle=self.vehicle,
            date=date.today(),
            odometer_km=10100,
            quantity_liters=10,
            unit_price=5000,
            fuel_type='petrol',
            client_id=client_id,
        )
        with self.assertRaises(IntegrityError), transaction.atomic():
            FuelRecord.objects.create(
                owner=self.owner,
                vehicle=self.vehicle,
                date=date.today(),
                odometer_km=10200,
                quantity_liters=10,
                unit_price=5000,
                fuel_type='petrol',
                client_id=client_id,
            )
