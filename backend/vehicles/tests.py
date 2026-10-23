from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import Plan, PlanFeature, Subscription, User

from .models import Vehicle
from accounts.models import Membership, Organization



class VehicleAPITests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username='owner', password='owner-pass-123'
        )
        self.stranger = User.objects.create_user(
            username='stranger', password='stranger-pass-123'
        )
        self.client.force_authenticate(user=self.owner)

    def _list_url(self):
        return reverse('vehicles:vehicle-list')

    def _detail_url(self, pk):
        return reverse('vehicles:vehicle-detail', args=[pk])

    def _enable_vehicle_view(self, organization):
        plan = Plan.objects.create(name='Test plan', slug=f'test-{organization.slug}')
        PlanFeature.objects.create(plan=plan, code='vehicle.view')
        now = timezone.now()
        Subscription.objects.create(
            organization=organization,
            plan=plan,
            starts_at=now - timedelta(days=1),
            ends_at=now + timedelta(days=1),
        )

    def test_create_vehicle_happy_path(self):
        res = self.client.post(
            self._list_url(),
            {
                'name': 'Toyota Land Cruiser',
                'make': 'Toyota',
                'model': 'Land Cruiser Prado',
                'year': 2020,
                'license_plate': 'KDB 123A',
                'fuel_type': 'diesel',
                'odometer_km': 12000,
            },
            format='json',
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(str(res.data['owner']), str(self.owner.id))
        self.assertEqual(Vehicle.objects.filter(owner=self.owner).count(), 1)

    def test_create_vehicle_with_full_specifications(self):
        response = self.client.post(
            self._list_url(),
            {
                'make': 'Toyota',
                'model': 'Premio',
                'year': 2018,
                'license_plate': 'uba 123a',
                'engine_capacity_cc': 1800,
                'fuel_type': 'petrol',
                'transmission': 'automatic',
                'tank_capacity_liters': '60',
                'odometer_km': 42580,
                'status': 'simulation',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data['name'], 'Toyota Premio')
        self.assertEqual(response.data['license_plate'], 'UBA 123A')
        self.assertEqual(response.data['engine_capacity_cc'], 1800)
        self.assertEqual(response.data['transmission'], 'automatic')
        self.assertEqual(response.data['tank_capacity_liters'], '60.00')
        self.assertEqual(response.data['status'], 'simulation')

    def test_duplicate_registration_is_case_insensitive(self):
        Vehicle.objects.create(owner=self.owner, name='Mine', license_plate='ABC123')

        response = self.client.post(
            self._list_url(),
            {'name': 'Another', 'license_plate': 'abc123'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('license_plate', response.data)

    def test_status_and_legacy_active_flag_stay_consistent(self):
        vehicle = Vehicle.objects.create(
            owner=self.owner, name='Mine', license_plate='STATUS1'
        )

        response = self.client.patch(
            self._detail_url(vehicle.id), {'status': 'inactive'}, format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_active'])
        self.assertEqual(response.data['status'], 'inactive')
    def test_ownership_scoped_list_and_retrieve(self):
        mine = Vehicle.objects.create(
            owner=self.owner, name='Mine', license_plate='AAA1'
        )
        Vehicle.objects.create(owner=self.stranger, name='Theirs', license_plate='BBB2')

        list_res = self.client.get(self._list_url())
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(list_res.data['count'], 1)
        self.assertEqual(list_res.data['results'][0]['id'], str(mine.id))

        detail = self.client.get(self._detail_url(mine.id))
        self.assertEqual(detail.status_code, status.HTTP_200_OK)

    def test_cannot_access_another_users_vehicle(self):
        theirs = Vehicle.objects.create(
            owner=self.stranger, name='Theirs', license_plate='CCC3'
        )
        res = self.client.get(self._detail_url(theirs.id))
        # Ownership scoping: another user's vehicle must not be reachable.
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_is_rejected(self):
        self.client.force_authenticate(user=None)
        res = self.client.get(self._list_url())
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_own_vehicle(self):
        v = Vehicle.objects.create(owner=self.owner, name='Mine', license_plate='DDD4')
        res = self.client.patch(
            self._detail_url(v.id), {'odometer_km': 15000}, format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        v.refresh_from_db()
        self.assertEqual(v.odometer_km, 15000)

    def test_odometer_cannot_be_reduced(self):
        vehicle = Vehicle.objects.create(
            owner=self.owner, name='Mine', license_plate='ODO1', odometer_km=15000
        )

        response = self.client.patch(
            self._detail_url(vehicle.id), {'odometer_km': 14999}, format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('odometer_km', response.data)

    def test_activate_vehicle_is_persisted_and_returned_in_list(self):
        vehicle = Vehicle.objects.create(
            owner=self.owner, name='Mine', license_plate='SEL1'
        )

        response = self.client.post(
            reverse('vehicles:vehicle-activate', args=[vehicle.id])
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['is_selected'])
        listed = self.client.get(self._list_url())
        self.assertTrue(listed.data['results'][0]['is_selected'])

    def test_cannot_delete_vehicle_with_trip_history(self):
        from trips.models import Trip

        started_at = timezone.now() - timedelta(hours=1)
        vehicle = Vehicle.objects.create(
            owner=self.owner, name='Mine', license_plate='KEEP1'
        )
        Trip.objects.create(
            owner=self.owner,
            vehicle=vehicle,
            start_location='Kampala',
            destination='Entebbe',
            started_at=started_at,
            ended_at=started_at + timedelta(minutes=30),
            distance_km=25,
        )

        response = self.client.delete(self._detail_url(vehicle.id))

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertTrue(Vehicle.objects.filter(pk=vehicle.id).exists())

    def test_organization_scope_excludes_personal_and_other_tenant_vehicles(self):
        organization = Organization.objects.create(
            name='Fleet One', slug='fleet-one', created_by=self.owner
        )
        Membership.objects.create(
            organization=organization, user=self.owner, role=Membership.OWNER
        )
        self._enable_vehicle_view(organization)
        organization_vehicle = Vehicle.objects.create(
            owner=self.owner,
            organization=organization,
            name='Fleet vehicle',
            license_plate='ORG1',
        )
        Vehicle.objects.create(owner=self.owner, name='Personal', license_plate='PER1')

        response = self.client.get(
            self._list_url(), HTTP_X_ORGANIZATION_ID=str(organization.id)
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], str(organization_vehicle.id))

    def test_driver_sees_only_assigned_organization_vehicles(self):
        organization = Organization.objects.create(
            name='Fleet Two', slug='fleet-two', created_by=self.owner
        )
        driver = User.objects.create_user(username='driver', password='driver-pass-123')
        Membership.objects.create(
            organization=organization, user=driver, role=Membership.DRIVER
        )
        self._enable_vehicle_view(organization)
        assigned = Vehicle.objects.create(
            owner=self.owner,
            organization=organization,
            name='Assigned',
            license_plate='DRV1',
        )
        unassigned = Vehicle.objects.create(
            owner=self.owner,
            organization=organization,
            name='Unassigned',
            license_plate='DRV2',
        )
        assigned.assigned_drivers.add(driver)
        self.client.force_authenticate(user=driver)

        response = self.client.get(
            self._list_url(), HTTP_X_ORGANIZATION_ID=str(organization.id)
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], str(assigned.id))
        self.assertNotIn(str(unassigned.id), [item['id'] for item in response.data['results']])

    def test_viewer_cannot_create_organization_vehicle(self):
        organization = Organization.objects.create(
            name='Fleet Three', slug='fleet-three', created_by=self.owner
        )
        viewer = User.objects.create_user(username='viewer', password='viewer-pass-123')
        Membership.objects.create(
            organization=organization, user=viewer, role=Membership.VIEWER
        )
        self.client.force_authenticate(user=viewer)

        response = self.client.post(
            self._list_url(),
            {'name': 'Blocked', 'license_plate': 'VIEW1'},
            format='json',
            HTTP_X_ORGANIZATION_ID=str(organization.id),
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Vehicle.objects.filter(license_plate='VIEW1').exists())
