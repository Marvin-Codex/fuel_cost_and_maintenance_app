"""Run: python manage.py test access

Each class is one situation from the product plan (docs/ACCESS_CONTROL_SPEC.md).
If these pass, the rules hold: the plan is a ceiling, roles do the rest, and
nobody is ever silently downgraded to "viewer".
"""

from django.contrib.auth import get_user_model
from django.core.management import call_command
from django.test import TestCase
from rest_framework.test import APIClient

from vehicles.models import Vehicle, VehicleAssignment

from .defaults import seed_defaults
from .models import Membership, Permission, Plan, Role, VehiclePreset, Workspace
from .services import (
    AccessDenied,
    LimitExceeded,
    access_snapshot,
    add_member,
    check_limit,
    get_active_workspace,
    get_limit,
    resolve_access,
)

User = get_user_model()

VEHICLES_URL = '/api/v1/vehicles/'
ME_ACCESS_URL = '/api/me/access/'
_plate = iter(range(1, 100000))


def perm(code):
    return Permission.objects.get(code=code)


def mkuser(name):
    return User.objects.create_user(name, password='x')


def personal(user):
    return Workspace.objects.get(kind='personal', memberships__user=user)


def mkws(plan_key, owner, name='WS'):
    plan = Plan.objects.get(key=plan_key)
    ws = Workspace.objects.create(name=name, kind=plan.kind, plan=plan)
    Membership.objects.create(
        user=owner, workspace=ws, role=Role.objects.get(workspace=None, key='owner')
    )
    return ws


def client(user, ws=None):
    c = APIClient()
    c.force_authenticate(user)
    if ws is not None:
        c.credentials(HTTP_X_WORKSPACE=str(ws.pk))
    return c


def mkvehicle(ws, owner, name):
    """Create a vehicle directly, bypassing the API, with a unique plate."""
    return Vehicle.objects.create(
        workspace=ws, owner=owner, name=name,
        license_plate='DIRECT-%s' % next(_plate),
    )


def names(resp):
    """Sorted vehicle names from a (paginated) vehicle list response."""
    body = resp.json()
    rows = body['results'] if isinstance(body, dict) else body
    return sorted(v['name'] for v in rows)


def post(c, name='Car'):
    return c.post(
        VEHICLES_URL,
        {'name': name, 'license_plate': 'PLATE-%s' % next(_plate)},
        format='json',
    )


class SignupAndFreeTier(TestCase):
    def test_new_user_gets_a_personal_workspace_as_owner_on_the_default_plan(self):
        u = mkuser('amos')
        ws = personal(u)
        self.assertEqual(ws.plan.key, 'personal-free')
        self.assertEqual(Membership.objects.get(user=u, workspace=ws).role.key, 'owner')

    def test_free_user_adds_one_vehicle_and_the_second_is_blocked(self):
        c = client(mkuser('amos'))
        self.assertEqual(c.get(VEHICLES_URL).status_code, 200)
        self.assertEqual(post(c, 'Corolla').status_code, 201)
        r = post(c, 'Boda')
        self.assertEqual(r.status_code, 403)
        body = r.json()
        self.assertEqual((body['code'], body['limit'], body['used']), ('limit_exceeded', 1, 1))

    def test_the_plan_is_a_ceiling_even_for_the_owner(self):
        u = mkuser('amos')
        ws = personal(u)
        self.assertTrue(resolve_access(u, ws).can('vehicles.add'))
        self.assertTrue(resolve_access(u, ws).can('billing.manage'))  # free users must reach upgrade
        self.assertFalse(resolve_access(u, ws).can('predictions.use'))
        ws.plan = Plan.objects.get(key='personal-pro')
        ws.save()
        self.assertTrue(resolve_access(u, ws).can('predictions.use'))


class PlatformSuperuser(TestCase):
    def test_superuser_is_not_a_viewer_and_ignores_the_plan_ceiling(self):
        su = User.objects.create_superuser('root', password='x')
        acc = resolve_access(su, personal(su))
        self.assertTrue(acc.can('predictions.use') and acc.can('members.manage'))
        self.assertEqual(post(client(su)).status_code, 201)

    def test_superuser_can_enter_any_workspace_without_being_a_member(self):
        su = User.objects.create_superuser('root', password='x')
        org = mkws('enterprise', mkuser('boss'))
        mkvehicle(org, su, 'Truck')
        r = client(su, org).get(VEHICLES_URL)
        self.assertEqual((r.status_code, names(r)), (200, ['Truck']))

    def test_superuser_can_load_platform_overview(self):
        su = User.objects.create_superuser('root', password='x')
        owner = mkuser('owner')
        org = mkws('enterprise', owner, name='FleetOps')
        response = client(su).get('/api/v1/access/superadmin/overview/')
        self.assertEqual(response.status_code, 200)
        # personal workspace of the superuser + personal workspace of the owner + the org
        self.assertEqual(response.data['metrics']['active_workspaces'], 3)
        # distinct users with an active membership: the superuser and the owner
        self.assertEqual(response.data['metrics']['active_members'], 2)
        self.assertTrue(any(row['name'] == org.name for row in response.data['workspaces']))

    def test_platform_overview_is_not_available_to_regular_users(self):
        response = client(mkuser('regular')).get('/api/v1/access/superadmin/overview/')
        self.assertEqual(response.status_code, 403)


class NonMembers(TestCase):
    def test_a_foreign_workspace_is_refused_not_downgraded_to_viewer(self):
        a, b = mkuser('a'), mkuser('b')
        r = client(a, personal(b)).get(VEHICLES_URL)
        self.assertEqual((r.status_code, r.json()['code']), (403, 'not_a_member'))

    def test_resolver_itself_never_invents_a_viewer(self):
        # Second line of defence: even if a caller skips get_active_workspace,
        # no membership = denied.
        a, b = mkuser('a'), mkuser('b')
        with self.assertRaises(AccessDenied) as cm:
            resolve_access(a, personal(b))
        self.assertEqual(cm.exception.code, 'not_a_member')
        m = Membership.objects.get(user=a)
        m.is_active = False
        m.save()
        with self.assertRaises(AccessDenied):
            resolve_access(a, personal(a))  # a deactivated seat is also "not a member"

    def test_another_workspaces_vehicle_does_not_exist_for_you(self):
        a, b = mkuser('a'), mkuser('b')
        v = mkvehicle(personal(b), b, 'b-car')
        self.assertEqual(client(a).get(f'{VEHICLES_URL}{v.pk}/').status_code, 404)

    def test_a_user_with_no_workspace_gets_a_clear_error(self):
        u = mkuser('x')
        Membership.objects.filter(user=u).delete()
        r = client(u).get(VEHICLES_URL)
        self.assertEqual((r.status_code, r.json()['code']), (403, 'no_workspace'))

    def test_a_bad_workspace_header_is_rejected(self):
        c = client(mkuser('x'))
        c.credentials(HTTP_X_WORKSPACE='not-a-uuid')
        self.assertEqual(c.get(VEHICLES_URL).json()['code'], 'invalid_workspace')

    def test_an_unmapped_action_is_denied(self):
        r = client(mkuser('x')).options(VEHICLES_URL)
        self.assertEqual((r.status_code, r.json()['code']), (403, 'permission_denied'))


class Group(TestCase):
    def test_members_share_vehicles_and_the_member_cap_applies(self):
        a, b, c, d = (mkuser(n) for n in 'abcd')
        g = mkws('group', a)
        add_member(g, b, 'member')
        add_member(g, c, 'viewer')
        self.assertEqual(post(client(a, g), 'Prado').status_code, 201)
        self.assertEqual(names(client(b, g).get(VEHICLES_URL)), ['Prado'])
        self.assertEqual(names(client(c, g).get(VEHICLES_URL)), ['Prado'])
        self.assertEqual(post(client(c, g), 'Nope').status_code, 403)  # viewer cannot write
        self.assertEqual(post(client(b, g), 'Boda').status_code, 201)
        with self.assertRaises(LimitExceeded):
            add_member(g, d, 'member')  # group plan allows 3 people


class Organization(TestCase):
    def setUp(self):
        self.owner = mkuser('owner')
        self.org = mkws('enterprise', self.owner, name='Acme')
        self.v1 = Vehicle.objects.create(
            workspace=self.org, owner=self.owner, name='v1', license_plate='V1-001',
        )
        Vehicle.objects.create(
            workspace=self.org, owner=self.owner, name='v2', license_plate='V2-001',
        )
        self.admin, self.viewer, self.driver = mkuser('admin'), mkuser('viewer'), mkuser('driver')
        add_member(self.org, self.admin, 'admin')
        add_member(self.org, self.viewer, 'viewer')
        m = add_member(self.org, self.driver, 'staff')
        VehicleAssignment.objects.create(membership=m, vehicle=self.v1)

    def test_each_role_sees_what_it_should(self):
        self.assertEqual(names(client(self.admin, self.org).get(VEHICLES_URL)), ['v1', 'v2'])
        self.assertEqual(names(client(self.viewer, self.org).get(VEHICLES_URL)), ['v1', 'v2'])
        self.assertEqual(names(client(self.driver, self.org).get(VEHICLES_URL)), ['v1'])

    def test_viewer_and_driver_cannot_add_vehicles(self):
        for u in (self.viewer, self.driver):
            r = post(client(u, self.org))
            self.assertEqual((r.status_code, r.json()['code']), (403, 'permission_denied'))
        self.assertEqual(post(client(self.admin, self.org)).status_code, 201)

    def test_enterprise_vehicle_limit_is_unlimited(self):
        for i in range(30):
            Vehicle.objects.create(
                workspace=self.org, owner=self.owner,
                name=f'x{i}', license_plate=f'X-{i:03d}',
            )
        check_limit(self.org, 'vehicles')  # does not raise


class Customisation(TestCase):
    def test_per_user_grant_and_deny(self):
        org = mkws('enterprise', mkuser('o'))
        v = mkuser('v')
        m = add_member(org, v, 'viewer')
        self.assertFalse(resolve_access(v, org).can('vehicles.add'))
        m.grants.add(perm('vehicles.add'))
        self.assertTrue(resolve_access(v, org).can('vehicles.add'))
        m.denies.add(perm('vehicles.view'))
        self.assertFalse(resolve_access(v, org).can('vehicles.view'))

    def test_a_user_grant_cannot_exceed_the_package(self):
        u = mkuser('u')
        Membership.objects.get(user=u).grants.add(perm('predictions.use'))
        self.assertFalse(resolve_access(u, personal(u)).can('predictions.use'))

    def test_per_workspace_entitlements_make_a_custom_package(self):
        u = mkuser('u')
        ws = personal(u)
        ws.entitlement_grants.add(perm('predictions.use'))
        ws.entitlement_revokes.add(perm('trips.add'))
        acc = resolve_access(u, ws)
        self.assertTrue(acc.can('predictions.use'))
        self.assertFalse(acc.can('trips.add'))

    def test_moving_a_permission_between_roles_is_platform_wide(self):
        o1 = mkws('enterprise', mkuser('o1'), '1')
        o2 = mkws('enterprise', mkuser('o2'), '2')
        m1, m2 = mkuser('m1'), mkuser('m2')
        add_member(o1, m1, 'manager')
        add_member(o2, m2, 'manager')
        self.assertTrue(
            resolve_access(m1, o1).can('vehicles.delete')
            and resolve_access(m2, o2).can('vehicles.delete')
        )
        Role.objects.get(workspace=None, key='manager').permissions.remove(perm('vehicles.delete'))
        self.assertFalse(
            resolve_access(m1, o1).can('vehicles.delete')
            or resolve_access(m2, o2).can('vehicles.delete')
        )

    def test_a_custom_role_exists_in_one_workspace_only(self):
        o1 = mkws('enterprise', mkuser('o1'), '1')
        o2 = mkws('enterprise', mkuser('o2'), '2')
        role = Role.objects.create(workspace=o1, key='mechanic', name='Mechanic')
        role.permissions.add(perm('maintenance.view'), perm('maintenance.add'))
        u = mkuser('u')
        add_member(o1, u, 'mechanic')
        acc = resolve_access(u, o1)
        self.assertTrue(acc.can('maintenance.add'))
        self.assertFalse(acc.can('vehicles.view'))
        with self.assertRaises(ValueError):
            add_member(o2, mkuser('u2'), 'mechanic')

    def test_limit_overrides_and_unknown_limits(self):
        ws = personal(mkuser('u'))
        self.assertEqual(get_limit(ws, 'vehicles'), 1)
        ws.limit_overrides = {'vehicles': 3}
        ws.save()
        self.assertEqual(get_limit(ws, 'vehicles'), 3)  # e.g. they paid for 3 vehicles
        ws.limit_overrides = {'vehicles': None}
        ws.save()
        check_limit(ws, 'vehicles')  # unlimited, does not raise
        self.assertEqual(get_limit(ws, 'gps_exports'), 0)  # undefined limit = denied
        with self.assertRaises(LimitExceeded):
            check_limit(ws, 'gps_exports')


class Switching(TestCase):
    def test_one_login_many_workspaces_with_different_rights(self):
        u = mkuser('u')
        org = mkws('enterprise', mkuser('boss'), 'Acme')
        add_member(org, u, 'admin')
        self.assertEqual(get_active_workspace(u).kind, 'personal')  # default
        self.assertEqual(get_active_workspace(u, org.pk), org)  # switch
        self.assertFalse(resolve_access(u, personal(u)).can('predictions.use'))
        self.assertTrue(resolve_access(u, org).can('predictions.use'))
        self.assertEqual(len(access_snapshot(u)), 2)

    def test_snapshot_version_tracks_rights_not_usage(self):
        u = mkuser('u')
        org = mkws('enterprise', mkuser('boss'))
        add_member(org, u, 'admin')

        def version():
            return next(
                s['version']
                for s in access_snapshot(u)
                if s['workspace']['id'] == str(org.pk)
            )

        v1 = version()
        mkvehicle(org, mkuser('t'), 'new')
        self.assertEqual(version(), v1)  # usage changed, rights did not
        Role.objects.get(workspace=None, key='admin').permissions.remove(perm('trips.delete'))
        self.assertNotEqual(version(), v1)  # rights changed -> clients must refresh

    def test_me_access_endpoint(self):
        body = client(mkuser('u')).get(ME_ACCESS_URL).json()
        self.assertEqual(
            (body['active_workspace'], body['is_superuser'], len(body['workspaces'])),
            (body['workspaces'][0]['workspace']['id'], False, 1),
        )
        self.assertEqual(body['workspaces'][0]['limits']['vehicles'], {'limit': 1, 'used': 0})

    def test_me_access_honours_the_workspace_header(self):
        u = mkuser('u')
        org = mkws('enterprise', mkuser('boss'))
        add_member(org, u, 'admin')
        active = client(u, org).get(ME_ACCESS_URL).json()['active_workspace']
        self.assertEqual(active, str(org.pk))



class SeedsAndBackfill(TestCase):
    def test_seeding_never_overwrites_edits(self):
        p = Plan.objects.get(key='personal-free')
        p.name, p.limits = 'Starter', {'vehicles': 2, 'members': 1}
        p.save()
        Role.objects.get(workspace=None, key='viewer').permissions.remove(perm('analytics.view'))
        seed_defaults()
        p.refresh_from_db()
        self.assertEqual((p.name, p.limits['vehicles']), ('Starter', 2))
        self.assertNotIn(
            'analytics.view',
            Role.objects.get(workspace=None, key='viewer').permissions.values_list(
                'code', flat=True
            ),
        )

    def test_only_one_default_plan_and_signups_follow_it(self):
        pro = Plan.objects.get(key='personal-pro')
        pro.is_default = True
        pro.save()
        self.assertEqual(list(Plan.objects.filter(is_default=True)), [pro])
        self.assertEqual(personal(mkuser('late')).plan.key, 'personal-pro')

    def test_backfill_gives_existing_users_a_workspace(self):
        u = mkuser('old')
        Workspace.objects.filter(memberships__user=u).delete()
        self.assertFalse(Membership.objects.filter(user=u).exists())
        call_command('backfill_workspaces', verbosity=0)
        self.assertTrue(Membership.objects.filter(user=u, role__key='owner').exists())

    def test_system_check_passes_with_admin(self):
        call_command('check')


PRESETS_URL = '/api/v1/access/vehicle-presets/'


class VehiclePresets(TestCase):
    """Superadmins manage presets; every signed-in user can browse the active ones."""

    def setUp(self):
        self.admin = User.objects.create_superuser('root', password='x')
        self.person = mkuser('preset_person')
        self.active = VehiclePreset.objects.create(
            name='Toyota Premio', make='Toyota', model='Premio', year=2018,
        )
        self.retired = VehiclePreset.objects.create(
            name='Old Fiesta', make='Ford', model='Fiesta', is_active=False,
        )

    @staticmethod
    def ids(body):
        rows = body['results'] if isinstance(body, dict) else body
        return {row['id'] for row in rows}

    def test_regular_user_sees_only_active_presets(self):
        ids = self.ids(client(self.person).get(PRESETS_URL).json())
        self.assertIn(str(self.active.pk), ids)
        self.assertNotIn(str(self.retired.pk), ids)

    def test_superuser_sees_all_presets(self):
        ids = self.ids(client(self.admin).get(PRESETS_URL).json())
        self.assertIn(str(self.active.pk), ids)
        self.assertIn(str(self.retired.pk), ids)

    def test_regular_user_cannot_create_a_preset(self):
        response = client(self.person).post(PRESETS_URL, {'name': 'X', 'make': 'Y', 'model': 'Z'}, format='json')
        self.assertEqual(response.status_code, 403)

    def test_superuser_can_create_and_deactivate_presets(self):
        c = client(self.admin)
        created = c.post(PRESETS_URL, {'name': 'Nissan Note', 'make': 'Nissan', 'model': 'Note'}, format='json')
        self.assertEqual(created.status_code, 201, created.content)
        response = c.delete(f"{PRESETS_URL}{created.json()['id']}/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(VehiclePreset.objects.get(pk=created.json()['id']).is_active)


class SuperadminConsole(TestCase):
    """Full-field admin APIs: workspaces with overrides, the permission catalog, role list."""

    def setUp(self):
        self.admin = User.objects.create_superuser('root', password='x')
        self.person = mkuser('console_person')

    def test_workspace_admin_crud_with_overrides(self):
        c = client(self.admin)
        plan = Plan.objects.get(key='personal-pro')
        created = c.post(
            '/api/v1/access/super-workspaces/',
            {'name': 'FleetOps', 'kind': 'organization', 'plan': plan.pk,
             'limit_overrides': {'vehicles': 20}, 'entitlement_grants': ['predictions.use']},
            format='json',
        )
        self.assertEqual(created.status_code, 201, created.content)
        body = created.json()
        self.assertEqual(body['plan'], plan.pk)
        self.assertEqual(body['plan_name'], plan.name)
        self.assertEqual(body['limit_overrides'], {'vehicles': 20})
        self.assertEqual(body['entitlement_grants'], ['predictions.use'])
        wid = body['id']

        patched = c.patch(
            f'/api/v1/access/super-workspaces/{wid}/',
            {'entitlement_revokes': ['analytics.export']}, format='json',
        )
        self.assertEqual(patched.status_code, 200, patched.content)
        self.assertEqual(patched.json()['entitlement_revokes'], ['analytics.export'])

        self.assertEqual(c.delete(f'/api/v1/access/super-workspaces/{wid}/').status_code, 204)
        self.assertFalse(Workspace.objects.get(pk=wid).is_active)

    def test_workspace_admin_rejects_regular_users(self):
        response = client(self.person).get('/api/v1/access/super-workspaces/')
        self.assertEqual(response.status_code, 403)

    def test_permission_catalog_lists_codes_by_group(self):
        body = client(self.admin).get('/api/v1/access/superadmin/permissions/').json()
        codes = {row['code'] for row in body}
        self.assertIn('predictions.use', codes)
        self.assertTrue(all({'code', 'group', 'label'} <= set(row) for row in body))
        self.assertEqual(client(self.person).get('/api/v1/access/superadmin/permissions/').status_code, 403)

    def test_super_role_list_is_read_only_reference(self):
        c = client(self.admin)
        body = c.get('/api/v1/access/super-roles/').json()
        rows = body['results'] if isinstance(body, dict) else body
        self.assertTrue(any(row['workspace'] is None for row in rows))
        self.assertEqual(c.post('/api/v1/access/super-roles/', {'key': 'x', 'name': 'X'}, format='json').status_code, 405)
        self.assertEqual(client(self.person).get('/api/v1/access/super-roles/').status_code, 403)

    def test_plan_admin_updates_full_package(self):
        c = client(self.admin)
        plan = Plan.objects.get(key='personal-free')
        response = c.patch(
            f'/api/v1/access/plans/{plan.pk}/',
            {'description': 'Edited', 'is_public': False,
             'limits': {'vehicles': 2, 'members': 1},
             'entitlements': ['vehicles.view', 'fuel.view']},
            format='json',
        )
        self.assertEqual(response.status_code, 200, response.content)
        plan.refresh_from_db()
        self.assertEqual(plan.description, 'Edited')
        self.assertFalse(plan.is_public)
        self.assertEqual(plan.limits, {'vehicles': 2, 'members': 1})
        self.assertEqual(
            set(plan.entitlements.values_list('code', flat=True)), {'vehicles.view', 'fuel.view'},
        )
