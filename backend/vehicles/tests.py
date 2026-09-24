from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User

from .models import Vehicle


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
        self.assertEqual(res.data['owner'], self.owner.id)
        self.assertEqual(Vehicle.objects.filter(owner=self.owner).count(), 1)

    def test_ownership_scoped_list_and_retrieve(self):
        mine = Vehicle.objects.create(
            owner=self.owner, name='Mine', license_plate='AAA1'
        )
        Vehicle.objects.create(owner=self.stranger, name='Theirs', license_plate='BBB2')

        list_res = self.client.get(self._list_url())
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(list_res.data['count'], 1)
        self.assertEqual(list_res.data['results'][0]['id'], mine.id)

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
