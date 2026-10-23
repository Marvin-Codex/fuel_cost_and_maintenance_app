"""Vehicle API tests on the workspace model (spec section 8, step 3)."""
from datetime import timedelta

from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from access.models import Membership as WsMembership
from access.models import Role, Workspace
from access.services import add_member
from accounts.models import User
from vehicles.models import Vehicle, VehicleAssignment


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

    def _personal_ws(self, user):
        return Workspace.objects.get(kind='personal', memberships__user=user)

    def _vehicle_in(self, workspace, owner, **kwargs):
        defaults = {'name': 'V', 'license_plate': 'P-%s' % Vehicle.objects.count()}
        defaults.update(kwargs)
        return Vehicle.objects.create(workspace=workspace, owner=owner, **defaults)

    def _make_org_workspace(self, name, owner, role_key='owner'):
        from access.models import Plan

        plan = Plan.objects.get(key='enterprise')
        ws = Workspace.objects.create(name=name, kind='organization', plan=plan)
        role = Role.objects.get(workspace=None, key=role_key)
        WsMembership.objects.create(user=owner, workspace=ws, role=role)
        return ws

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
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertEqual(str(res.data['owner']), str(self.owner.id))

        vehicle = Vehicle.objects.get(owner=self.owner)
        self.assertEqual(vehicle.workspace, self._personal_ws(self.owner))

    def test_free_personal_limit_blocks_second_vehicle(self):
        self.client.post(
            self._list_url(), {'name': 'One', 'license_plate': 'L1'}, format='json'
        )
        res = self.client.post(
            self._list_url(), {'name': 'Two', 'license_plate': 'L2'}, format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res.data['code'], 'limit_exceeded')

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
        vehicle = self._vehicle_in(
            self._personal_ws(self.owner), self.owner,
            name='Mine', license_plate='STATUS1',
        )

        response = self.client.patch(
            self._detail_url(vehicle.id), {'status': 'inactive'}, format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['is_active'])
        self.assertEqual(response.data['status'], 'inactive')
    def test_ownership_scoped_list_and_retrieve(self):
        mine = self._vehicle_in(
            self._personal_ws(self.owner), self.owner, name='Mine', license_plate='AAA1'
        )
        self._vehicle_in(
            self._personal_ws(self.stranger), self.stranger,
            name='Theirs', license_plate='BBB2',
        )
        list_res = self.client.get(self._list_url())
        self.assertEqual(list_res.status_code, status.HTTP_200_OK, list_res.data)
        self.assertEqual(list_res.data['count'], 1)
        self.assertEqual(list_res.data['results'][0]['id'], str(mine.id))
        detail = self.client.get(self._detail_url(mine.id))
        self.assertEqual(detail.status_code, status.HTTP_200_OK)

    def test_cannot_access_another_users_vehicle(self):
        theirs = self._vehicle_in(
            self._personal_ws(self.stranger), self.stranger,
            name='Theirs', license_plate='CCC3',
        )
        res = self.client.get(self._detail_url(theirs.id))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_is_rejected(self):
        self.client.force_authenticate(user=None)
        res = self.client.get(self._list_url())
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_own_vehicle(self):
        ws = self._personal_ws(self.owner)
        v = self._vehicle_in(ws, self.owner, name='Mine', license_plate='DDD4')
        res = self.client.patch(
            self._detail_url(v.id), {'odometer_km': 15000}, format='json'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        v.refresh_from_db()
        self.assertEqual(v.odometer_km, 15000)

    def test_odometer_cannot_be_reduced(self):
        vehicle = self._vehicle_in(
            self._personal_ws(self.owner), self.owner,
            name='Mine', license_plate='ODO1', odometer_km=15000,
        )

        response = self.client.patch(
            self._detail_url(vehicle.id), {'odometer_km': 14999}, format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('odometer_km', response.data)

    def test_activate_vehicle_is_persisted_and_returned_in_list(self):
        vehicle = self._vehicle_in(
            self._personal_ws(self.owner), self.owner,
            name='Mine', license_plate='SEL1',
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
        vehicle = self._vehicle_in(
            self._personal_ws(self.owner), self.owner,
            name='Mine', license_plate='KEEP1',
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

    def test_workspace_switch_excludes_other_tenant_vehicles(self):
        org_ws = self._make_org_workspace('Fleet One', self.owner)
        org_vehicle = self._vehicle_in(
            org_ws, self.owner, name='Fleet vehicle', license_plate='ORG1'
        )
        self._vehicle_in(
            self._personal_ws(self.owner), self.owner,
            name='Personal', license_plate='PER1',
        )
        response = self.client.get(self._list_url(), HTTP_X_WORKSPACE=str(org_ws.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], str(org_vehicle.id))

    def test_staff_sees_only_assigned_workspace_vehicles(self):
        org_ws = self._make_org_workspace('Fleet Two', self.owner)
        driver = User.objects.create_user(username='driver', password='driver-pass-123')
        add_member(org_ws, driver, 'staff')
        assigned = self._vehicle_in(
            org_ws, self.owner, name='Assigned', license_plate='DRV1'
        )
        unassigned = self._vehicle_in(
            org_ws, self.owner, name='Unassigned', license_plate='DRV2'
        )
        membership = WsMembership.objects.get(user=driver, workspace=org_ws)
        VehicleAssignment.objects.create(membership=membership, vehicle=assigned)
        self.client.force_authenticate(user=driver)
        response = self.client.get(self._list_url(), HTTP_X_WORKSPACE=str(org_ws.pk))
        self.assertEqual(response.status_code, status.HTTP_200_OK, response.data)
        self.assertEqual(response.data['count'], 1)
        self.assertEqual(response.data['results'][0]['id'], str(assigned.id))
        self.assertNotIn(
            str(unassigned.id), [item['id'] for item in response.data['results']]
        )

    def test_viewer_cannot_create_workspace_vehicle(self):
        org_ws = self._make_org_workspace('Fleet Three', self.owner)
        viewer = User.objects.create_user(username='viewer', password='viewer-pass-123')
        add_member(org_ws, viewer, 'viewer')
        self.client.force_authenticate(user=viewer)
        response = self.client.post(
            self._list_url(),
            {'name': 'Blocked', 'license_plate': 'VIEW1'},
            format='json',
            HTTP_X_WORKSPACE=str(org_ws.pk),
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(Vehicle.objects.filter(license_plate='VIEW1').exists())

    def test_access_snapshot_lists_workspaces(self):
        res = self.client.get('/api/v1/auth/me/access/')
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        entry = res.data['workspaces'][0]
        self.assertIn('vehicles.add', entry['permissions'])
        self.assertEqual(entry['limits']['vehicles']['limit'], 1)