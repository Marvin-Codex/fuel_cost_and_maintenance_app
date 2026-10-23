/// Permissions the backend catalog defines (`backend/access/permissions_catalog.py`).
/// The API stays the only authority; this exists so the UI can hide an action
/// instead of offering a tap that is guaranteed to fail.
class Permission {
  const Permission(this.code, this.label);

  final String code;
  final String label;

  static const view = Permission('vehicles.view', 'View vehicles');
  static const add = Permission('vehicles.add', 'Add vehicles');
  static const edit = Permission('vehicles.edit', 'Edit vehicles');
  static const delete = Permission('vehicles.delete', 'Delete vehicles');
  static const assign = Permission('vehicles.assign', 'Assign vehicles');
  static const fuelView = Permission('fuel.view', 'View fuel records');
  static const fuelAdd = Permission('fuel.add', 'Log fuel purchases');
  static const maintenanceView =
      Permission('maintenance.view', 'View service records');
  static const maintenanceAdd = Permission('maintenance.add', 'Log service');
  static const maintenanceEdit =
      Permission('maintenance.edit', 'Edit service records');
  static const tripsView = Permission('trips.view', 'View trips');
  static const tripsAdd = Permission('trips.add', 'Record trips');
  static const membersManage =
      Permission('members.manage', 'Invite and remove members');
  static const workspaceManage =
      Permission('workspace.manage', 'Manage workspace settings');
  static const billingManage = Permission('billing.manage', 'Manage billing');
}

/// A seeded role. Keys match `backend/access/defaults.py`. Workspaces may add
/// their own custom roles on top of these.
class RolePreset {
  const RolePreset(this.key, this.name, this.permissions);

  final String key;
  final String name;
  final List<Permission> permissions;

  bool has(String code) => permissions.any((p) => p.code == code);
}

const _viewerRole = RolePreset('viewer', 'Viewer', [
  Permission.view,
  Permission.fuelView,
  Permission.maintenanceView,
  Permission.tripsView,
]);

const _staffRole = RolePreset('staff', 'Driver / Operator', [
  Permission.view,
  Permission.fuelView,
  Permission.tripsView,
]);

const _memberRole = RolePreset('member', 'Member', [
  Permission.view,
  Permission.add,
  Permission.edit,
  Permission.fuelView,
  Permission.fuelAdd,
  Permission.maintenanceView,
  Permission.maintenanceAdd,
  Permission.tripsView,
  Permission.tripsAdd,
]);

const _adminPermissions = <Permission>[
  Permission.view,
  Permission.add,
  Permission.edit,
  Permission.delete,
  Permission.assign,
  Permission.fuelView,
  Permission.fuelAdd,
  Permission.maintenanceView,
  Permission.maintenanceAdd,
  Permission.maintenanceEdit,
  Permission.tripsView,
  Permission.tripsAdd,
  Permission.membersManage,
];

const _adminRole = RolePreset('admin', 'Administrator', _adminPermissions);

const _ownerRole = RolePreset('owner', 'Owner', [
  ..._adminPermissions,
  Permission.workspaceManage,
  Permission.billingManage,
]);

/// Platform roles, seeded once at install.
const List<RolePreset> rolePresets = [
  _ownerRole,
  _adminRole,
  _memberRole,
  _staffRole,
  _viewerRole,
];

/// The rights this user holds in the workspace they are working in.
///
/// Built from the server's snapshot (`GET /api/v1/auth/me/access/`), never
/// guessed from a role name: roles can be edited per workspace and a user may
/// hold one-off grants or denies.
class Access {
  const Access._({
    required this.workspaceName,
    required this.roleLabel,
    required this.planName,
    required this.permissions,
    required this.isSuperuser,
    this.vehicleScope = 'all',
    this.assignedVehicleIds = const [],
  });

  /// Before the snapshot arrives. `can` is false everywhere so nothing is
  /// offered that the user may not be allowed to do.
  const Access.unknown()
      : workspaceName = null,
        roleLabel = null,
        planName = null,
        permissions = const {},
        isSuperuser = false,
        vehicleScope = 'none',
        assignedVehicleIds = const [];

  final String? workspaceName;
  final String? roleLabel;
  final String? planName;
  final Set<String> permissions;

  /// A Django superuser ignores the plan ceiling and workspace membership — the
  /// same rule the backend applies.
  final bool isSuperuser;

  /// 'all' (every vehicle in the workspace), 'assigned' (only the vehicles this
  /// user was given) or 'none' (nothing yet).
  final String vehicleScope;
  final List<String> assignedVehicleIds;

  bool can(Permission permission) =>
      isSuperuser || permissions.contains(permission.code);

  bool get canAddVehicle => can(Permission.add);
  bool get canLogFuel => can(Permission.fuelAdd);
  bool get canLogMaintenance => can(Permission.maintenanceAdd);
  bool get canRecordTrip => can(Permission.tripsAdd);
  bool get isRestrictedToAssigned =>
      !isSuperuser && vehicleScope == 'assigned';

  /// Which of the workspace's vehicles this user may open.
  List<String> visibleVehicleIds(Iterable<String> workspaceVehicleIds) {
    if (isSuperuser || vehicleScope == 'all') return workspaceVehicleIds.toList();
    if (vehicleScope == 'assigned') {
      final allowed = assignedVehicleIds.toSet();
      return workspaceVehicleIds.where(allowed.contains).toList();
    }
    return const [];
  }

  factory Access.fromSnapshot(Map<String, dynamic> entry) {
    final codes = (entry['permissions'] as List?)?.cast<String>() ?? const [];
    return Access._(
      workspaceName: _string(entry, 'workspace', 'name'),
      roleLabel: _string(entry, 'role', 'name'),
      planName: _string(entry, 'plan', 'name'),
      permissions: codes.toSet(),
      isSuperuser: entry['is_superuser'] == true,
      vehicleScope: entry['vehicle_scope'] as String? ?? 'all',
      assignedVehicleIds:
          (entry['assigned_vehicle_ids'] as List?)?.cast<String>() ?? const [],
    );
  }

  static String? _string(
    Map<String, dynamic> entry,
    String key,
    String field,
  ) =>
      (entry[key] as Map<String, dynamic>?)?[field] as String?;
}

/// Wording for a blocked action. Codes match the API's 403 body so the message
/// is the same one the server gave.
String accessDeniedMessage(String? code) => switch (code) {
      'limit_exceeded' =>
        'Your plan does not cover any more of these. Upgrade to continue.',
      'not_a_member' => 'You are not a member of this workspace.',
      'no_workspace' => 'This account has no workspace yet.',
      'invalid_workspace' => 'That workspace does not exist.',
      _ => 'Your role does not allow this action.',
    };

