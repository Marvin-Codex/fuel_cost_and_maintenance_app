from datetime import date, timedelta
from decimal import Decimal
from django.db import IntegrityError, transaction
import uuid

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from vehicles.models import Vehicle

from trips.models import Trip

from .models import FuelRecord


class FuelRecordAPITests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username='fuel-owner', password='test-pass-123')
        self.other = User.objects.create_user(username='fuel-other', password='test-pass-123')
        self.vehicle = Vehicle.objects.create(
            owner=self.owner, name='Premio', license_plate='FUEL1',
            odometer_km=10000, tank_capacity_liters=60,
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
        self.vehicle.refresh_from_db()
        self.assertEqual(self.vehicle.odometer_km, 10100)

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

    def test_fuel_alias_accepts_purchase_timestamp_and_receipt_reference(self):
        purchased_at = timezone.now()
        response = self.client.post(
        reverse('fuel:fuel-list'),
        {
            'vehicle': str(self.vehicle.id),
            'purchased_at': purchased_at.isoformat(),
            'odometer_km': 10000,
            'quantity_liters': '12.500',
            'unit_price': '5200.00',
            'fuel_type': 'petrol',
            'station': 'Kampala Fuel',
            'receipt_reference': 'RCPT-101',
            'is_full_tank': True,
        },
        format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        purchase_local_date = timezone.localtime(purchased_at).date()
        self.assertEqual(response.data['date'], purchase_local_date.isoformat())
        self.assertEqual(response.data['receipt_reference'], 'RCPT-101')
        self.assertEqual(response.data['total_cost'], '65000.00')
        self.assertEqual(
            timezone.localtime(
                FuelRecord.objects.get().purchased_at
            ).date(),
            purchase_local_date,
        )

    def test_purchase_rejects_mismatched_date_and_timestamp(self):
        purchased_at = timezone.now()
        response = self.client.post(
        reverse('fuel:fuel-record-list'),
        {
            'vehicle': str(self.vehicle.id),
            'date': (purchased_at.date() - timedelta(days=1)).isoformat(),
            'purchased_at': purchased_at.isoformat(),
            'odometer_km': 10000,
            'quantity_liters': '10',
            'unit_price': '5000',
            'fuel_type': 'petrol',
        },
        format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('date', response.data)

    def test_summary_reports_daily_weekly_and_monthly_purchase_spend(self):
        today = timezone.localdate()
        FuelRecord.objects.create(
        owner=self.owner,
        vehicle=self.vehicle,
        date=today,
        odometer_km=10000,
        quantity_liters=10,
        unit_price=5000,
        )
        response = self.client.get(
        reverse('fuel:fuel-record-summary'),
        {'vehicle': str(self.vehicle.id)},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['expenditure']['today'], Decimal('50000.00'))
        self.assertEqual(response.data['expenditure']['this_week'], Decimal('50000.00'))
        self.assertEqual(response.data['expenditure']['this_month'], Decimal('50000.00'))
        self.assertEqual(
        response.data['purchases']['this_month']['total_liters'],
        Decimal('10.000'),
        )

    def test_efficiency_reports_trip_and_full_tank_records(self):
        first_refill = timezone.now() - timedelta(days=3)
        trip_start = first_refill + timedelta(hours=1)
        trip_end = trip_start + timedelta(hours=2)
        second_refill = trip_end + timedelta(hours=1)
        FuelRecord.objects.create(
        owner=self.owner,
        vehicle=self.vehicle,
        date=first_refill.date(),
        purchased_at=first_refill,
        odometer_km=10000,
        quantity_liters=40,
        unit_price=5000,
        is_full_tank=True,
        )
        FuelRecord.objects.create(
        owner=self.owner,
        vehicle=self.vehicle,
        date=second_refill.date(),
        purchased_at=second_refill,
        odometer_km=10100,
        quantity_liters=8,
        unit_price=5200,
        is_full_tank=True,
        )
        Trip.objects.create(
        owner=self.owner,
        vehicle=self.vehicle,
        start_location='Kampala',
        destination='Entebbe',
        started_at=trip_start,
        ended_at=trip_end,
        distance_km=Decimal('100'),
        start_odometer_km=10000,
        end_odometer_km=10100,
        fuel_consumed_liters=Decimal('8'),
        )
        self.vehicle.odometer_km = 10100
        self.vehicle.save(update_fields=['odometer_km'])

        response = self.client.get(
        reverse('fuel:fuel-efficiency'),
        {'vehicle': str(self.vehicle.id)},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['trip_efficiency']), 1)
        self.assertEqual(
        response.data['trip_efficiency'][0]['fuel_economy_l_per_100km'],
        8.0,
        )
        self.assertEqual(len(response.data['refill_efficiency']), 1)
        self.assertEqual(
        response.data['refill_efficiency'][0]['fuel_economy_l_per_100km'],
        Decimal('8.00'),
        )
        summary = self.client.get(
        reverse('fuel:fuel-summary'),
        {'vehicle': str(self.vehicle.id)},
        )
        self.assertTrue(summary.data['fuel_level']['available'])
        self.assertEqual(summary.data['fuel_level']['remaining_liters'], Decimal('60.00'))
        self.assertEqual(summary.data['fuel_level']['estimated_range_km'], 750)

    def test_summary_warns_when_estimated_fuel_is_low(self):
        full_refill = timezone.now() - timedelta(days=1)
        FuelRecord.objects.create(
            owner=self.owner,
            vehicle=self.vehicle,
            date=timezone.localtime(full_refill).date(),
            purchased_at=full_refill,
            odometer_km=10000,
            quantity_liters=40,
            unit_price=5000,
            is_full_tank=True,
        )
        Trip.objects.create(
            owner=self.owner,
            vehicle=self.vehicle,
            start_location='Kampala',
            destination='Jinja',
            started_at=full_refill + timedelta(hours=1),
            ended_at=full_refill + timedelta(hours=3),
            distance_km=Decimal('500'),
            start_odometer_km=10000,
            end_odometer_km=10500,
            fuel_consumed_liters=Decimal('52'),
        )
        self.vehicle.odometer_km = 10500
        self.vehicle.save(update_fields=['odometer_km'])

        response = self.client.get(
            reverse('fuel:fuel-summary'),
            {'vehicle': str(self.vehicle.id)},
        )

        self.assertTrue(response.data['fuel_level']['available'])
        self.assertEqual(response.data['fuel_level']['percentage'], Decimal('13.3'))
        self.assertEqual(response.data['fuel_level']['estimated_range_km'], 76)
        self.assertIn(
            'low_fuel',
            [alert['code'] for alert in response.data['alerts']],
        )

    def test_summary_flags_an_unusual_trip_consumption_increase(self):
        full_refill = timezone.now() - timedelta(days=2)
        FuelRecord.objects.create(
            owner=self.owner,
            vehicle=self.vehicle,
            date=timezone.localtime(full_refill).date(),
            purchased_at=full_refill,
            odometer_km=10000,
            quantity_liters=40,
            unit_price=5000,
            is_full_tank=True,
        )
        for index, liters in enumerate((5, 5, 7)):
            started_at = full_refill + timedelta(hours=1 + index)
            Trip.objects.create(
                owner=self.owner,
                vehicle=self.vehicle,
                start_location='Kampala',
                destination='Entebbe',
                started_at=started_at,
                ended_at=started_at + timedelta(minutes=30),
                distance_km=Decimal('100'),
                start_odometer_km=10000 + index * 100,
                end_odometer_km=10100 + index * 100,
                fuel_consumed_liters=Decimal(str(liters)),
            )
        self.vehicle.odometer_km = 10300
        self.vehicle.save(update_fields=['odometer_km'])

        response = self.client.get(
            reverse('fuel:fuel-summary'),
            {'vehicle': str(self.vehicle.id)},
        )
        efficiency = self.client.get(
            reverse('fuel:fuel-efficiency'),
            {'vehicle': str(self.vehicle.id)},
        )

        self.assertIn(
            'high_fuel_consumption',
            [alert['code'] for alert in response.data['alerts']],
        )
        self.assertIn(
            'unexpected_efficiency_drop',
            [alert['code'] for alert in efficiency.data['alerts']],
        )
