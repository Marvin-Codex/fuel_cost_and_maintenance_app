const SUPER_ADMIN_PERMISSIONS = new Set([
  'vehicle.view', 'vehicle.create', 'vehicle.update', 'vehicle.delete',
  'fuel.view', 'fuel.create', 'fuel.update', 'fuel.delete',
  'trip.view', 'trip.create', 'trip.update', 'trip.delete',
  'maintenance.view', 'maintenance.create', 'maintenance.update', 'maintenance.delete',
  'system.view', 'system.update', 'member.manage',
])

export function normalizeRoleKey(role) {
  const raw = String(role ?? 'viewer').trim()
  const normalized = raw.toLowerCase().replace(/[_\s-]+/g, '_')
  if (normalized === 'super_admin' || normalized === 'superadmin' || normalized === 'super admin') {
    return 'super_admin'
  }
  return normalized
}

export function resolveEffectiveRole({ user, organization, fallback = 'viewer' }) {
  if (user?.is_superuser === true) return 'super_admin'

  const orgRole = organization?.role ? normalizeRoleKey(organization.role) : null
  if (orgRole) return orgRole

  if (user) return 'owner'
  return normalizeRoleKey(fallback)
}

export const ROLE_PERMISSIONS = {
  owner: SUPER_ADMIN_PERMISSIONS,
  admin: SUPER_ADMIN_PERMISSIONS,
  super_admin: SUPER_ADMIN_PERMISSIONS,
  superadmin: SUPER_ADMIN_PERMISSIONS,
  fleet_manager: new Set([
    'vehicle.view', 'vehicle.create', 'vehicle.update', 'vehicle.delete',
    'fuel.view', 'fuel.create', 'fuel.update', 'fuel.delete',
    'trip.view', 'trip.create', 'trip.update', 'trip.delete',
    'maintenance.view', 'maintenance.create', 'maintenance.update', 'maintenance.delete',
    'system.view', 'system.update',
  ]),
  maintenance_manager: new Set([
    'vehicle.view', 'vehicle.update',
    'fuel.view', 'trip.view',
    'maintenance.view', 'maintenance.create', 'maintenance.update', 'maintenance.delete',
    'system.view',
  ]),
  driver: new Set([
    'vehicle.view', 'fuel.view', 'fuel.create',
    'trip.view', 'trip.create', 'maintenance.view', 'system.view',
  ]),
  viewer: new Set([
    'vehicle.view', 'fuel.view', 'trip.view', 'maintenance.view', 'system.view',
  ]),
}

export const ROLE_LABELS = {
  owner: 'Owner',
  admin: 'Admin',
  super_admin: 'Super Admin',
  superadmin: 'Super Admin',
  fleet_manager: 'Fleet Manager',
  maintenance_manager: 'Maintenance Manager',
  driver: 'Driver',
  viewer: 'Viewer',
}

export function normalizePlanFeatures(planFeatures) {
  if (!Array.isArray(planFeatures)) return new Set()
  return new Set(planFeatures.map((feature) => String(feature).trim()).filter(Boolean))
}

export function hasRolePermission(role, permission) {
  const normalizedRole = normalizeRoleKey(role)
  return ROLE_PERMISSIONS[normalizedRole]?.has(permission) ?? false
}

export function hasPlanFeature(permission, planFeatures) {
  return normalizePlanFeatures(planFeatures).has(permission)
}

export function hasDashboardPermission({ role, permission, planFeatures = [], allowNoPackageAccess = false }) {
  const normalizedRole = normalizeRoleKey(role)
  if (normalizedRole === 'super_admin') return true
  if (allowNoPackageAccess && ['owner', 'admin'].includes(normalizedRole)) return true

  const roleAllowed = hasRolePermission(role, permission)
  const featureAllowed = hasPlanFeature(permission, planFeatures)

  if (normalizedRole === 'owner' || normalizedRole === 'admin') {
    return roleAllowed || featureAllowed || allowNoPackageAccess
  }

  return roleAllowed && featureAllowed
}

export function getDashboardAccess({ role, planFeatures = [], allowNoPackageAccess = false }) {
  const permissions = {
    vehicleView: hasDashboardPermission({ role, permission: 'vehicle.view', planFeatures, allowNoPackageAccess }),
    fuelView: hasDashboardPermission({ role, permission: 'fuel.view', planFeatures, allowNoPackageAccess }),
    fuelCreate: hasDashboardPermission({ role, permission: 'fuel.create', planFeatures, allowNoPackageAccess }),
    tripView: hasDashboardPermission({ role, permission: 'trip.view', planFeatures, allowNoPackageAccess }),
    tripCreate: hasDashboardPermission({ role, permission: 'trip.create', planFeatures, allowNoPackageAccess }),
    maintenanceView: hasDashboardPermission({ role, permission: 'maintenance.view', planFeatures, allowNoPackageAccess }),
    maintenanceCreate: hasDashboardPermission({ role, permission: 'maintenance.create', planFeatures, allowNoPackageAccess }),
    maintenanceUpdate: hasDashboardPermission({ role, permission: 'maintenance.update', planFeatures, allowNoPackageAccess }),
    systemView: hasDashboardPermission({ role, permission: 'system.view', planFeatures, allowNoPackageAccess }),
    memberManage: hasDashboardPermission({ role, permission: 'member.manage', planFeatures, allowNoPackageAccess }),
  }

  return {
    ...permissions,
    canViewAny: Object.values(permissions).some(Boolean),
    tabs: {
      overview: permissions.systemView || permissions.fuelView || permissions.tripView || permissions.maintenanceView,
      telemetry: permissions.systemView,
      fuel: permissions.fuelView,
      services: permissions.maintenanceView,
      trips: permissions.tripView,
      system: permissions.systemView,
    },
  }
}
