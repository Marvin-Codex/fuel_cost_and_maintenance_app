from datetime import timedelta
from decimal import Decimal

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from vehicles.test_helpers import make_vehicle

from .models import Trip


class TripAPITests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(username='trip-owner', password='test-pass-123')
        self.other = User.objects.create_user(username='trip-other', password='test-pass-123')
        self.vehicle = make_vehicle(
            self.owner, name='Premio', license_plate='TRIP1', odometer_km=10000
        )
        self.other_vehicle = make_vehicle(
            self.other, name='Hilux', license_plate='TRIP2', odometer_km=20000
        )
        self.client.force_authenticate(user=self.owner)

    def test_create_calculates_duration_speed_and_fuel_cost(self):
        started_at = timezone.now() - timedelta(hours=1)
        response = self.client.post(
            reverse('trips:trip-list'),
            {
                'vehicle': str(self.vehicle.id),
                'start_location': 'Kampala',
                'destination': 'Entebbe',
                'started_at': started_at.isoformat(),
                'ended_at': (started_at + timedelta(minutes=48)).isoformat(),
                'distance_km': '32.00',
                'start_odometer_km': 10000,
                'end_odometer_km': 10032,
                'fuel_consumed_liters': '2.700',
                'fuel_price_per_liter': '5200.00',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data['duration_seconds'], 2880)
        self.assertEqual(response.data['average_speed_kmh'], 40.0)
        self.assertEqual(response.data['fuel_cost'], '14040.00')
        self.vehicle.refresh_from_db()
        self.assertEqual(self.vehicle.odometer_km, 10032)

    def test_manual_distance_without_end_reading_does_not_change_vehicle_odometer(self):
        started_at = timezone.now() - timedelta(hours=1)
        response = self.client.post(
            reverse('trips:trip-list'),
            {
                'vehicle': str(self.vehicle.id),
                'start_location': 'Kampala',
                'destination': 'Entebbe',
                'started_at': started_at.isoformat(),
                'ended_at': (started_at + timedelta(minutes=48)).isoformat(),
                'distance_km': '32.40',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.vehicle.refresh_from_db()
        self.assertEqual(self.vehicle.odometer_km, 10000)

    def test_start_and_complete_trip_derive_distance_from_odometer(self):
        response = self.client.post(
            reverse('trips:trip-list'),
            {
                'vehicle': str(self.vehicle.id),
                'start_location': 'Kampala',
                'destination': 'Entebbe',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertIsNone(response.data['ended_at'])
        self.assertIsNone(response.data['distance_km'])
        self.assertEqual(response.data['start_odometer_km'], 10000)

        completion = self.client.patch(
            reverse('trips:trip-detail', args=[response.data['id']]),
            {'end_odometer_km': 10038},
            format='json',
        )
        self.assertEqual(completion.status_code, status.HTTP_200_OK, completion.data)
        self.assertEqual(completion.data['distance_km'], '38.00')
        self.assertEqual(completion.data['end_odometer_km'], 10038)
        self.vehicle.refresh_from_db()
        self.assertEqual(self.vehicle.odometer_km, 10038)

    def test_trip_rejects_distance_conflicting_with_odometer_difference(self):
        started_at = timezone.now() - timedelta(hours=1)
        response = self.client.post(
            reverse('trips:trip-list'),
            {
                'vehicle': str(self.vehicle.id),
                'start_location': 'Kampala',
                'destination': 'Entebbe',
                'started_at': started_at.isoformat(),
                'ended_at': (started_at + timedelta(minutes=48)).isoformat(),
                'start_odometer_km': 10000,
                'end_odometer_km': 10038,
                'distance_km': '32.40',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('distance_km', response.data)
        self.assertFalse(Trip.objects.exists())

    def test_completed_trip_cannot_lower_vehicle_odometer(self):
        started = self.client.post(
            reverse('trips:trip-list'),
            {
                'vehicle': str(self.vehicle.id),
                'start_location': 'Kampala',
                'destination': 'Entebbe',
            },
            format='json',
        )
        self.assertEqual(started.status_code, status.HTTP_201_CREATED, started.data)
        self.vehicle.odometer_km = 10050
        self.vehicle.save(update_fields=['odometer_km'])
        response = self.client.patch(
            reverse('trips:trip-detail', args=[started.data['id']]),
            {'end_odometer_km': 10040},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIsNone(Trip.objects.get(pk=started.data['id']).ended_at)

    def test_trip_cannot_reference_another_users_vehicle(self):
        now = timezone.now()
        response = self.client.post(
            reverse('trips:trip-list'),
            {
                'vehicle': str(self.other_vehicle.id),
                'start_location': 'Kampala',
                'destination': 'Jinja',
                'started_at': now.isoformat(),
                'ended_at': (now + timedelta(hours=1)).isoformat(),
                'distance_km': '80',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Trip.objects.exists())

    def test_trip_end_must_be_after_start(self):
        now = timezone.now()
        response = self.client.post(
            reverse('trips:trip-list'),
            {
                'vehicle': str(self.vehicle.id),
                'start_location': 'Kampala',
                'destination': 'Jinja',
                'started_at': now.isoformat(),
                'ended_at': (now - timedelta(minutes=1)).isoformat(),
                'distance_km': '80',
            },
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('ended_at', response.data)

    def test_summary_aggregates_trip_stats(self):
        started_at = timezone.now() - timedelta(hours=1)
        Trip.objects.create(
            owner=self.owner,
            vehicle=self.vehicle,
            start_location='Kampala',
            destination='Entebbe',
            started_at=started_at,
            ended_at=started_at + timedelta(minutes=48),
            distance_km=Decimal('32.40'),
            fuel_consumed_liters=Decimal('2.700'),
            fuel_price_per_liter=Decimal('5200'),
        )
        Trip.objects.create(
            owner=self.owner,
            vehicle=self.vehicle,
            start_location='Entebbe',
            started_at=timezone.now(),
            start_odometer_km=10032,
        )
        response = self.client.get(reverse('trips:trip-summary'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['today']['trip_count'], 1)
        self.assertEqual(response.data['today']['duration_seconds'], 2880)
        self.assertEqual(response.data['today']['fuel_cost'], Decimal('14040.00'))
        self.assertEqual(response.data['this_week']['trip_count'], 1)
        self.assertEqual(response.data['totals']['average_distance_km'], Decimal('32.40'))
        self.assertEqual(response.data['most_fuel_used']['fuel_consumed_liters'], '2.700')

    def test_trip_list_filters_by_vehicle_and_date(self):
        today = timezone.localdate()
        Trip.objects.create(
            owner=self.owner,
            vehicle=self.vehicle,
            start_location='Kampala',
            destination='Entebbe',
            started_at=timezone.now(),
            ended_at=timezone.now() + timedelta(minutes=30),
            distance_km=Decimal('30'),
        )
        Trip.objects.create(
            owner=self.owner,
            vehicle=self.vehicle,
            start_location='Kampala',
            destination='Jinja',
            started_at=timezone.now() - timedelta(days=2),
            ended_at=timezone.now() - timedelta(days=2) + timedelta(hours=1),
            distance_km=Decimal('80'),
        )
        response = self.client.get(
            reverse('trips:trip-list'),
            {
                'vehicle': str(self.vehicle.id),
                'date_from': today.isoformat(),
                'date_to': today.isoformat(),
            },
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['destination'], 'Entebbe')

    def test_trip_cost_handles_integer_model_inputs(self):
        started_at = timezone.now()
        trip = Trip.objects.create(
            owner=self.owner,
            vehicle=self.vehicle,
            start_location='Kampala',
            destination='Entebbe',
            started_at=started_at,
            ended_at=started_at + timedelta(minutes=30),
            distance_km=30,
            fuel_consumed_liters=3,
            fuel_price_per_liter=5200,
        )
        self.assertEqual(trip.fuel_cost, Decimal('15600.00'))

    def test_trip_list_is_owner_scoped(self):
        now = timezone.now()
        Trip.objects.create(
            owner=self.other,
            vehicle=self.other_vehicle,
            start_location='Entebbe',
            destination='Kampala',
            started_at=now,
            ended_at=now + timedelta(minutes=40),
            distance_km=Decimal('30'),
        )
        response = self.client.get(reverse('trips:trip-list'))
        self.assertEqual(response.data['count'], 0)
