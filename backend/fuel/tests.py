"""Fuel record tests on the workspace model."""
from datetime import date
from decimal import Decimal
from django.db import IntegrityError, transaction
import uuid

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from access.models import Workspace
from access.services import add_member
from accounts.models import User
from vehicles.test_helpers import make_vehicle

from .models import FuelRecord


class FuelRecordAPITests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username='fuel-owner', password='pw-123456')
        self.other = User.objects.create_user(username='fuel-other', password='pw-123456')
        self.vehicle = make_vehicle(
            self.owner, name='Premio', license_plate='FUEL1', odometer_km=10000
        )
        self.other_vehicle = make_vehicle(
            self.other, name='Hilux', license_plate='FUEL2', odometer_km=12000
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

    def test_fuel_record_cannot_reference_other_workspace_vehicle(self):
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

    def test_list_and_summary_are_workspace_scoped(self):
        FuelRecord.objects.create(
            owner=self.owner, vehicle=self.vehicle, date=date.today(),
            odometer_km=10100, quantity_liters=10, unit_price=5000, fuel_type='petrol',
        )
        FuelRecord.objects.create(
            owner=self.other, vehicle=self.other_vehicle, date=date.today(),
            odometer_km=12100, quantity_liters=30, unit_price=5000, fuel_type='diesel',
        )
        response = self.client.get(reverse('fuel:fuel-record-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data['count'], 1)

    def test_viewer_cannot_add_fuel(self):
        from access.models import Plan, Role
        from access.models import Membership as WsMembership

        plan = Plan.objects.get(key='enterprise')
        ws = Workspace.objects.create(name='Org', kind='organization', plan=plan)
        viewer = User.objects.create_user(username='fuel-viewer', password='pw-123456')
        add_member(ws, self.owner, 'owner')
        add_member(ws, viewer, 'viewer')
        from vehicles.models import Vehicle

        vehicle = Vehicle.objects.create(
            workspace=ws, owner=self.owner, name='Org car', license_plate='FORG1'
        )
        self.client.force_authenticate(user=viewer)
        response = self.client.post(
            reverse('fuel:fuel-record-list'),
            {
                'vehicle': str(vehicle.id),
                'date': date.today().isoformat(),
                'odometer_km': 100,
                'quantity_liters': '10',
                'unit_price': '5000',
                'fuel_type': 'petrol',
            },
            format='json',
            HTTP_X_WORKSPACE=str(ws.pk),
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_client_id_is_unique_per_owner(self):
        client_id = uuid.uuid4()
        FuelRecord.objects.create(
            owner=self.owner, vehicle=self.vehicle, date=date.today(),
            odometer_km=10100, quantity_liters=10, unit_price=5000,
            fuel_type='petrol', client_id=client_id,
        )
        with self.assertRaises(IntegrityError), transaction.atomic():
            FuelRecord.objects.create(
                owner=self.owner, vehicle=self.vehicle, date=date.today(),
                odometer_km=10200, quantity_liters=10, unit_price=5000,
                fuel_type='petrol', client_id=client_id,
            )
