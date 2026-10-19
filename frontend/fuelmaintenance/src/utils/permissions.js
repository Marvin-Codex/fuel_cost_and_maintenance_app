/**
 * Permission helpers for the web dashboard.
 *
 * There is no role table here on purpose: role templates, packages and
 * per-user grants all live in the backend (see docs/ACCESS_CONTROL_SPEC.md).
 * The client receives a flat list of permission codes for the active
 * workspace and asks plain questions of it. Anything not in that list is
 * denied — an unknown user is never silently treated as an owner.
 *
 * The server re-checks every request; these helpers only decide what to show.
 */

/** Permission code required for each dashboard section. */
export const TAB_PERMISSIONS = {
  overview: ['analytics.view'],
  telemetry: ['analytics.view'],
  fuel: ['fuel.view'],
  services: ['maintenance.view'],
  trips: ['trips.view'],
  system: ['workspace.manage'],
}

/** Permission code required for each write action in the UI. */
export const ACTION_PERMISSIONS = {
  addVehicle: 'vehicles.add',
  editVehicle: 'vehicles.edit',
  deleteVehicle: 'vehicles.delete',
  addFuel: 'fuel.add',
  editFuel: 'fuel.edit',
  deleteFuel: 'fuel.delete',
  addTrip: 'trips.add',
  editTrip: 'trips.edit',
  deleteTrip: 'trips.delete',
  addMaintenance: 'maintenance.add',
  editMaintenance: 'maintenance.edit',
  deleteMaintenance: 'maintenance.delete',
  exportReport: 'analytics.export',
  usePredictions: 'predictions.use',
  findServiceCentres: 'servicecentres.view',
  manageMembers: 'members.manage',
  manageRoles: 'roles.manage',
  manageWorkspace: 'workspace.manage',
  manageBilling: 'billing.manage',
  viewAuditLog: 'audit.view',
}

export const ROLE_LABELS = {
  owner: 'Owner',
  admin: 'Admin',
  manager: 'Manager',
  staff: 'Staff',
  viewer: 'Viewer',
  super_admin: 'Platform admin',
}

export function normalizeRoleKey(role) {
  const raw = String(role ?? '').trim()
  const normalized = raw.toLowerCase().replace(/[\s-]+/g, '_')
  if (normalized === 'superadmin' || normalized === 'super admin') return 'super_admin'
  return normalized
}

export function roleLabel(roleKey) {
  const key = normalizeRoleKey(roleKey)
  if (!key) return 'No role'
  return ROLE_LABELS[key] ?? key.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
}

/** Build the question-asker for one workspace entry of the snapshot. */
export function accessFromSnapshot(entry) {
  const permissions = new Set(entry?.permissions ?? [])
  const limits = entry?.limits ?? {}
  return {
    entry,
    workspace: entry?.workspace ?? null,
    plan: entry?.plan ?? null,
    role: entry?.role ?? null,
    version: entry?.version ?? null,
    vehicleScope: entry?.vehicle_scope ?? 'assigned',
    can: (code) => permissions.has(code),
    canAny: (codes) => codes.some((code) => permissions.has(code)),
    /** limit === null means unlimited. */
    limit: (key) => limits[key]?.limit ?? 0,
    used: (key) => limits[key]?.used ?? 0,
    remaining: (key) => {
      const limit = limits[key]?.limit
      if (limit === null || limit === undefined) return null
      return Math.max(0, limit - (limits[key]?.used ?? 0))
    },
    /** True when creating one more would be refused by the server. */
    atLimit: (key) => {
      const remaining = limits[key]?.limit
      if (remaining === null || remaining === undefined) return false
      return (limits[key]?.used ?? 0) >= remaining
    },
    tabs: Object.fromEntries(
      Object.entries(TAB_PERMISSIONS).map(([tab, codes]) => [
        tab,
        codes.some((code) => permissions.has(code)),
      ]),
    ),
  }
}

/**
 * Pick the workspace to show: the remembered one when it is still in the
 * snapshot, otherwise the personal workspace, otherwise the first one.
 */
export function selectWorkspace(entries, rememberedId) {
  if (!entries?.length) return null
  if (rememberedId) {
    const remembered = entries.find((e) => e.workspace?.id === rememberedId)
    if (remembered) return remembered
  }
  return (
    entries.find((e) => e.workspace?.kind === 'personal') ??
    entries[0]
  )
}
