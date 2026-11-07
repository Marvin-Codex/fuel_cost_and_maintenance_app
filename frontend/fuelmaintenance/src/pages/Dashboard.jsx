import { useCallback, useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import DashboardHeader from '../components/DashboardHeader'
import { useNavigate } from 'react-router-dom'
import * as auth from '../api/auth'
import {
  fetchSuperadminOverview,
  forgetAccessCache,
  listVehiclePresets,
} from '../api/access'
import {
  createVehicle,
  activateVehicle,
  fetchDashboardSummary,
  listMaintenanceReminders,
  listTrips,
  listVehicles,
} from '../api/resources'
import { useAccess } from '../hooks/useAccess'
import { TAB_PERMISSIONS } from '../utils/permissions'
import { useSyncStatus } from '../hooks/useSyncStatus'
import Fuel from './Fuel'
import Services from './Services'
import System from './System'
import Telemetry from './Telemetry'
import Trips from './Trips'
import './Dashboard.css'

function Icon({ children, size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

function Metric({ icon, label, value, detail, accent = '' }) {
  return (
    <article className="metric-card">
      <div className="metric-heading"><span>{icon}</span><small>{label}</small></div>
      <strong className={accent}>{value}</strong>
      <p>{detail}</p>
    </article>
  )
}

function formatNumber(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  return number.toLocaleString('en-UG', { maximumFractionDigits: 1 })
}

function formatUgxShort(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  if (Math.abs(number) >= 1000000) return `${(number / 1000000).toFixed(1)}M`
  if (Math.abs(number) >= 1000) return `${Math.round(number / 1000)}K`
  return String(Math.round(number))
}

function tripConsumption(trip) {
  const liters = Number(trip.fuel_consumed_liters)
  const km = Number(trip.distance_km)
  if (Number.isFinite(liters) && Number.isFinite(km) && km > 0) return (liters / km) * 100
  return null
}

/** Build an SVG path from trip consumption points (oldest → newest). */
function consumptionChart(trips) {
  const points = trips
    .map((trip) => ({ at: trip.started_at || trip.created_at, value: tripConsumption(trip) }))
    .filter((point) => Number.isFinite(point.value))
    .sort((a, b) => String(a.at).localeCompare(String(b.at)))
    .slice(-8)
  if (points.length < 2) return null
  const values = points.map((point) => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const width = 600
  const height = 230
  const path = values.map((value, index) => {
    const x = values.length === 1 ? 0 : (index * width) / (values.length - 1)
    const y = 20 + (1 - (value - min) / span) * (height - 60)
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
  }).join(' ')
  const last = values.length - 1
  const lastX = values.length === 1 ? 0 : (last * width) / (values.length - 1)
  const lastY = 20 + (1 - (values[last] - min) / span) * (height - 60)
  return { d: path, min, max, lastX, lastY, count: values.length }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const hasSession = auth.hasSession()

  useEffect(() => {
    if (!hasSession) navigate('/login', { replace: true })
  }, [hasSession, navigate])

  if (!hasSession) return null
  return <DashboardContent />
}

function DashboardContent() {
  const navigate = useNavigate()
  const { state: accessState, error: accessError, refresh, workspaces: workspaceOptions, active, access, switchWorkspace, roleLabel } = useAccess()
  
  // Fetch and manage vehicles for this workspace
  const [vehicles, setVehicles] = useState([])
  const [vehicleLoading, setVehicleLoading] = useState(false)
  const [vehicleError, setVehicleError] = useState(null)
  
  useEffect(() => {
    async function loadVehicles() {
      setVehicleLoading(true)
      try {
        const result = await listVehicles()
        setVehicles(result)
        setVehicleError(null)
      } catch (err) {
        setVehicleError(err.message)
      } finally {
        setVehicleLoading(false)
      }
    }
    loadVehicles()
  }, [access, listVehicles])

  const [activeTab, setActiveTab] = useState(() => {
    try {
      return localStorage.getItem('fuelmaintenance.activeTab') || 'overview'
    } catch {
      return 'overview'
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem('fuelmaintenance.activeTab', activeTab)
    } catch {
      /* storage unavailable — ignore */
    }
  }, [activeTab])

  const organization = active ? { name: active.workspace?.name, role: active.role?.key } : null
  const [vehiclesLoading, setVehiclesLoading] = useState(true)
  const [vehiclesError, setVehiclesError] = useState(null)
  const [vehicleSelectionError, setVehicleSelectionError] = useState(null)
  const [selectedVehicleId, setSelectedVehicleId] = useState(() => {
    try { return localStorage.getItem('fuelmaintenance.selectedVehicleId') } catch { return null }
  })
  const [isVehiclePickerOpen, setIsVehiclePickerOpen] = useState(false)
  const [presetVehicles, setPresetVehicles] = useState([])
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [summaryError, setSummaryError] = useState(null)
  const [monthTrips, setMonthTrips] = useState([])
  const [reminders, setReminders] = useState([])
  const [showAddVehicle, setShowAddVehicle] = useState(false)
  const [vehicleForm, setVehicleForm] = useState({ name: '', make: '', model: '', year: '', license_plate: '', fuel_type: 'petrol', odometer_km: '' })
  const [vehicleFormError, setVehicleFormError] = useState(null)
  const [vehicleSaving, setVehicleSaving] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem('fm.sidebar.collapsed') === '1'
    } catch {
      return false
    }
  })
  const [superAdminSection, setSuperAdminSection] = useState('sa-overview')

  useEffect(() => {
    try {
      if (selectedVehicleId === null) localStorage.removeItem('fuelmaintenance.selectedVehicleId')
      else localStorage.setItem('fuelmaintenance.selectedVehicleId', String(selectedVehicleId))
    } catch { /* ignore */ }
  }, [selectedVehicleId])

  useEffect(() => {
    try {
      window.localStorage.setItem('fm.sidebar.collapsed', sidebarCollapsed ? '1' : '0')
    } catch {
      /* storage unavailable; collapse state just won't persist */
    }
  }, [sidebarCollapsed])
  // `vehicles` is the state above (real API rows); presets stay in presetVehicles.
  const ownedVehicles = vehicles.filter((vehicle) => !vehicle.isPreset)
  const selectedVehicle = vehicles.find((vehicle) => String(vehicle.id) === String(selectedVehicleId)) ?? null
  const consumption = consumptionChart(monthTrips)
  const consumptionAvg = (() => {
    const values = monthTrips.map(tripConsumption).filter(Number.isFinite)
    if (!values.length) return null
    return values.reduce((total, value) => total + value, 0) / values.length
  })()
  const monthlyDistance = Number(summary?.trips?.month_distance_km ?? 0)
  const monthlyFuel = Number(summary?.trips?.month_fuel_liters ?? 0)
  const efficiency = monthlyDistance > 0 && monthlyFuel > 0
    ? (monthlyFuel / monthlyDistance * 100).toFixed(1)
    : '—'
  const nextReminder = reminders[0] ?? null
  const reminderDueLabel = nextReminder
    ? (nextReminder.km_remaining !== null && nextReminder.km_remaining !== undefined
        ? `${formatNumber(nextReminder.km_remaining)} KM`
        : nextReminder.days_remaining !== null && nextReminder.days_remaining !== undefined
          ? `${nextReminder.days_remaining} DAYS`
          : nextReminder.due_date ? String(nextReminder.due_date) : 'DUE')
    : 'NONE'
  // Most-repeated route this month, used by the prediction panel.
  const frequentTrip = (() => {
    if (!monthTrips.length) return null
    const counts = {}
    for (const trip of monthTrips) {
      const key = `${trip.start_location || '?'} \u2192 ${trip.destination || '?'}`
      counts[key] = (counts[key] || 0) + 1
    }
    const [key, count] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
    if (count < 2) return null
    const legs = monthTrips.filter((trip) => `${trip.start_location || '?'} \u2192 ${trip.destination || '?'}` === key)
    const average = (field) => {
      const values = legs.map((trip) => Number(trip[field])).filter(Number.isFinite)
      return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null
    }
    const [start, destination] = key.split(' \u2192 ')
    return {
      start,
      destination,
      count,
      avgKm: average('distance_km'),
      avgLiters: average('fuel_consumed_liters'),
      avgCost: average('fuel_cost'),
    }
  })()

  // Vehicle presets are platform-managed definitions people pick from when adding a vehicle.
  useEffect(() => {
    if (!isVehiclePickerOpen || presetVehicles.length) return undefined
    let mounted = true
    listVehiclePresets()
      .then((presets) => {
        if (!mounted) return
        setPresetVehicles(presets.map((preset) => ({
          id: `preset-${preset.id}`,
          isPreset: true,
          make: preset.make,
          model: preset.model,
          year: preset.year ?? '—',
          registration: preset.name,
          engine: preset.engine || '—',
          transmission: preset.transmission || '—',
          odometer: '0',
          tankReserve: 0,
          obdHealth: 100,
          efficiency: '—',
          fuelCost: '0',
          distance: '0',
        })))
      })
      .catch(() => { /* presets are optional; the picker still works with owned vehicles */ })
    return () => { mounted = false }
  }, [isVehiclePickerOpen, presetVehicles.length])

  /* Real vehicles for the active workspace. Reselect when the list or the
     workspace changes so the picker never points at a vanished vehicle. */
  const loadVehicles = useCallback(async () => {
    if (!access?.can('vehicles.view')) {
      setVehicles([])
      setVehiclesError('Your role cannot view vehicles in this workspace.')
      setVehiclesLoading(false)
      return []
    }
    setVehiclesLoading(true)
    setVehiclesError(null)
    try {
      const rows = await listVehicles()
      const owned = rows.map((row) => ({
        ...row,
        id: String(row.id),
        rawId: row.id,
        name: row.name,
        make: row.make,
        model: row.model,
        year: row.year ?? '—',
        registration: row.license_plate || '—',
        engine: row.fuel_type || '—',
        transmission: '—',
        odometer: row.odometer_km ?? '—',
        is_selected: Boolean(row.is_selected),
      }))
      let currentId = null
      try {
        currentId = localStorage.getItem('fuelmaintenance.selectedVehicleId')
      } catch {
        // Vehicle selection still falls back to the server preference.
      }
      const initialSelection = owned.find((row) => row.is_selected)
        ?? owned.find((row) => String(row.id) === String(currentId))
        ?? owned[0]
        ?? null
      if (initialSelection && !initialSelection.is_selected) {
        try {
          await activateVehicle(initialSelection.rawId)
          initialSelection.is_selected = true
          for (const row of owned) {
            if (row.id !== initialSelection.id) row.is_selected = false
          }
          setVehicleSelectionError(null)
        } catch (err) {
          setVehicleSelectionError(err.message)
        }
      }
      setVehicles(owned)
      setSelectedVehicleId(initialSelection?.id ?? null)
      setVehiclesLoading(false)
      return owned
    } catch (err) {
      setVehiclesError(err.message)
      setVehiclesLoading(false)
      return []
    }
  }, [access])

  useEffect(() => {
    if (accessState !== 'ready') return undefined
    loadVehicles()
  }, [accessState, loadVehicles, active?.workspace?.id])

  /* Live per-vehicle aggregates for the overview cards. */
  useEffect(() => {
    let cancelled = false
    async function loadOverview() {
      if (!selectedVehicleId || !access?.can('analytics.view')) {
        setSummary(null)
        setSummaryError(selectedVehicleId && access && !access.can('analytics.view') ? 'Your role cannot view analytics in this workspace.' : null)
        setMonthTrips([])
        setReminders([])
        return
      }
      setSummaryLoading(true)
      setSummaryError(null)
      try {
        const data = await fetchDashboardSummary(selectedVehicleId)
        if (!cancelled) {
          setSummary(data?.vehicle ? data : null)
          setSummaryLoading(false)
        }
      } catch (err) {
        if (cancelled) return
        setSummary(null)
        setSummaryError(err.message)
        setSummaryLoading(false)
      }
      if (access?.can('trips.view')) {
        listTrips({ vehicle: selectedVehicleId }).then((rows) => {
          if (!cancelled) setMonthTrips(rows.slice(0, 8))
        }).catch(() => { if (!cancelled) setMonthTrips([]) })
      } else {
        setMonthTrips([])
      }
      if (access?.can('maintenance.view')) {
        listMaintenanceReminders({ vehicle: selectedVehicleId }).then((rows) => {
          if (!cancelled) setReminders(rows.filter((row) => (row.computed_status || row.status) !== 'done').slice(0, 4))
        }).catch(() => { if (!cancelled) setReminders([]) })
      } else {
        setReminders([])
      }
    }
    loadOverview()
    return () => { cancelled = true }
  }, [selectedVehicleId, access, active?.workspace?.id])

  const refreshOverview = useCallback(async () => {
    setSummaryError(null)
    setVehiclesError(null)
    try {
      await loadVehicles()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (message.includes('session expired') || message.includes('401')) {
        const refreshed = await auth.refresh()
        if (refreshed) {
          setSummaryError(null)
          setVehiclesError(null)
          await loadVehicles()
          return
        }
        auth.logout()
        navigate('/login', { replace: true })
        return
      }
      throw err
    }
  }, [loadVehicles, navigate])

  async function submitVehicle(event) {
    event.preventDefault()
    setVehicleFormError(null)
    if (!String(vehicleForm.name ?? '').trim()) {
      setVehicleFormError('Give the vehicle a name.')
      return
    }
    setVehicleSaving(true)
    try {
      const payload = { name: vehicleForm.name.trim() }
      for (const key of ['make', 'model', 'license_plate', 'fuel_type']) {
        if (String(vehicleForm[key] ?? '').trim()) payload[key] = String(vehicleForm[key]).trim()
      }
      if (String(vehicleForm.year ?? '').trim()) payload.year = Number(vehicleForm.year)
      if (String(vehicleForm.odometer_km ?? '').trim()) payload.odometer_km = Number(vehicleForm.odometer_km)
      const created = await createVehicle(payload)
      try {
        await activateVehicle(created.id)
        setVehicleSelectionError(null)
      } catch (err) {
        setVehicleSelectionError(err.message)
      }
      await loadVehicles()
      setSelectedVehicleId(String(created.id))
      setShowAddVehicle(false)
      setVehicleForm({ name: '', make: '', model: '', year: '', license_plate: '', fuel_type: 'petrol', odometer_km: '' })
      refresh()
    } catch (err) {
      setVehicleFormError(err.message)
    } finally {
      setVehicleSaving(false)
    }
  }
  const { pending, state: syncState } = useSyncStatus()

  const user = auth.getStoredUser()
  const isPlatformSuperUser = Boolean(user?.is_superuser)
  const [superAdminOverview, setSuperAdminOverview] = useState(null)
  const [superAdminLoading, setSuperAdminLoading] = useState(true)
  const [superAdminError, setSuperAdminError] = useState(null)

  useEffect(() => {
    if (!isPlatformSuperUser) return
    let mounted = true
    fetchSuperadminOverview()
      .then((data) => {
        if (mounted) {
          setSuperAdminOverview(data)
          setSuperAdminError(null)
        }
      })
      .catch((error) => {
        if (mounted) setSuperAdminError(error.message)
      })
      .finally(() => {
        if (mounted) setSuperAdminLoading(false)
      })
    return () => {
      mounted = false
    }
  }, [isPlatformSuperUser])

  const dashboardNavItems = [
    { id: 'overview', label: 'OVERVIEW', allowed: access.tabs.overview, icon: <Icon><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></Icon> },
    { id: 'telemetry', label: 'TELEMETRY', allowed: access.tabs.telemetry, icon: <Icon><path d="M4 16a8 8 0 1 1 8 4" /><path d="m12 12 4-4" /></Icon> },
    { id: 'fuel', label: 'FUEL', allowed: access.tabs.fuel, icon: <Icon><path d="M6 4v16M18 4v16M6 7h8M6 12h12M6 17h8" /><path d="M18 9l2 2v5" /></Icon> },
    { id: 'services', label: 'SERVICE', allowed: access.tabs.services, icon: <Icon><path d="m14 6 4 4M13 7l4-4 4 4-4 4M4 20l6-6" /></Icon> },
    { id: 'trips', label: 'TRIPS', allowed: access.tabs.trips, icon: <Icon><path d="M6 4v16M18 4v16M6 7c5 0 7 3 12 3M6 17c5 0 7-3 12-3" /></Icon> },
    { id: 'system', label: 'SYSTEM', allowed: access.tabs.system, icon: <Icon><path d="M4 6h16M4 12h16M4 18h16M8 4v4M15 10v4M11 16v4" /></Icon> },
  ]

  // A tab the current permissions don't allow must never stay selected. Deriving
  // it (rather than correcting in an effect) means the redirect happens in the
  // same render as the snapshot arriving.
  const permittedTab = Object.entries(access.tabs).find(([, allowed]) => allowed)?.[0] ?? 'overview'
  const visibleTab = activeTab === 'overview' || access.tabs[activeTab] ? activeTab : permittedTab

  function signOut() {
    auth.logout()
    forgetAccessCache()
    navigate('/login')
  }

  async function selectVehicle(vehicle) {
    setVehicleSelectionError(null)
    try {
      await activateVehicle(vehicle.rawId ?? vehicle.id)
      setSelectedVehicleId(String(vehicle.id))
      setIsVehiclePickerOpen(false)
      setVehicles((current) => current.map((item) => ({
        ...item,
        is_selected: String(item.id) === String(vehicle.id),
      })))
    } catch (err) {
      setVehicleSelectionError(err.message)
    }
  }

  // The platform console is for Django superusers only. Workspace-level powers
  // such as `members.manage` belong to an organization owner, not the platform.
  const isSuperAdmin = isPlatformSuperUser

  const superAdminNavItems = [
    { id: 'sa-overview', label: 'OVERVIEW', allowed: true, icon: <Icon><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></Icon> },
    { id: 'sa-workspaces', label: 'WORKSPACES', allowed: true, icon: <Icon><path d="M3 21h18M6 21V3h12v18M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01" /></Icon> },
    { id: 'sa-plans', label: 'PLANS', allowed: true, icon: <Icon><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></Icon> },
    { id: 'sa-users', label: 'USERS', allowed: true, icon: <Icon><circle cx="9" cy="8" r="3" /><path d="M3 20c.5-3.4 2.5-5 6-5s5.5 1.6 6 5M16 5c2.5.5 3.5 2 3.5 4M17 15c2.5.5 3.5 2 4 5" /></Icon> },
    { id: 'sa-memberships', label: 'MEMBERSHIPS', allowed: true, icon: <Icon><path d="M4 5h16v14H4zM8 9h8M8 13h5" /></Icon> },
    { id: 'sa-roles', label: 'ROLES', allowed: true, icon: <Icon><path d="M12 3l7 4v5c0 4-3 7-7 9-4-2-7-5-7-9V7z" /></Icon> },
    { id: 'sa-vehicle-presets', label: 'VEHICLE PRESETS', allowed: true, icon: <Icon><path d="M3 16v-3l2-5h14l2 5v3M5 16v2M19 16v2M6 13h12" /><circle cx="6" cy="16" r="1.5" /><circle cx="18" cy="16" r="1.5" /></Icon> },
  ]

  const handleSuperAdminNav = (id) => {
    const route = ({
      'sa-workspaces': '/super-admin/workspaces',
      'sa-plans': '/super-admin/plans',
      'sa-users': '/super-admin/users',
      'sa-memberships': '/super-admin/memberships',
      'sa-roles': '/super-admin/roles',
      'sa-vehicle-presets': '/super-admin/vehicle-presets',
    })[id]
    if (route) {
      navigate(route)
      return
    }
    setSuperAdminSection(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (isSuperAdmin) {
    return (
      <main className={`dashboard-shell super-admin-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <DashboardHeader
          subtitle="SUPER ADMIN"
          syncState={syncState}
          pending={pending}
          profileName={organization?.name ?? 'Platform Admin'}
          roleLabel={roleLabel}
          profilePath="/super-admin"
          onSignOut={signOut}
        />

        <Sidebar
          items={superAdminNavItems}
          activeTab={superAdminSection}
          onTabChange={handleSuperAdminNav}
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          title="PLATFORM"
          subtitle="Super Admin"
          ariaLabel="Platform sections"
          footer={<div className="sidebar-footer-copy"><small>ACCESS LEVEL</small><strong>{roleLabel}</strong></div>}
        />

        <section className="dashboard-content super-admin-content">
          <div className="super-admin-hero" id="sa-overview">
            <div>
              <p className="eyebrow">SUPER ADMIN CONSOLE</p>
              <h1>Platform control center</h1>
            </div>
            <span className="live-pill"><i /> ALL SYSTEMS ONLINE</span>
          </div>

          {superAdminError && (
            <div className="dashboard-notice" role="alert">
              {superAdminError}
              <button type="button" onClick={() => {
                setSuperAdminError(null)
                setSuperAdminLoading(true)
                fetchSuperadminOverview()
                  .then(setSuperAdminOverview)
                  .catch((error) => setSuperAdminError(error.message))
                  .finally(() => setSuperAdminLoading(false))
              }}>Retry</button>
            </div>
          )}

          <div className="super-admin-stat-grid" aria-busy={superAdminLoading}>
            <article className="metric-card super-admin-metric">
              <small>ACTIVE ORGANIZATIONS</small>
              <strong>{superAdminOverview?.metrics?.active_workspaces ?? '—'}</strong>
              <p>Active workspaces</p>
            </article>
            <article className="metric-card super-admin-metric">
              <small>SUBSCRIPTIONS</small>
              <strong>{superAdminOverview?.metrics?.active_subscriptions ?? '—'}</strong>
              <p>Workspace subscriptions</p>
            </article>
            <article className="metric-card super-admin-metric">
              <small>MEMBERS</small>
              <strong>{superAdminOverview?.metrics?.active_members ?? '—'}</strong>
              <p>Unique active members</p>
            </article>
            <article className="metric-card super-admin-metric">
              <small>ACTIVE PLANS</small>
              <strong>{superAdminOverview?.metrics?.active_plans ?? '—'}</strong>
              <p>Available platform plans</p>
            </article>
          </div>

          <div className="super-admin-grid">
            <section className="panel super-admin-panel" id="sa-workspaces-overview">
              <div className="panel-title"><h2>Workspace overview</h2><b>LIVE</b></div>
              <div className="super-admin-list">
                {superAdminOverview?.workspaces?.length ? superAdminOverview.workspaces.map((workspace) => (
                  <div key={workspace.id}><span>{workspace.name}</span><strong>{workspace.plan} · {workspace.members} members</strong></div>
                )) : <p className="super-admin-empty">{superAdminLoading ? 'Loading workspaces…' : 'No active workspaces.'}</p>}
              </div>
            </section>

            <section className="panel super-admin-panel" id="sa-plans">
              <div className="panel-title"><h2>Plan access</h2><b>FEATURES</b></div>
              <div className="super-admin-list">
                {superAdminOverview?.plans?.length ? superAdminOverview.plans.map((plan) => (
                  <div key={plan.id}><span>{plan.name}{plan.is_default ? ' (default)' : ''}</span><strong>{plan.workspaces} workspaces</strong></div>
                )) : <p className="super-admin-empty">{superAdminLoading ? 'Loading plans…' : 'No active plans.'}</p>}
              </div>
            </section>

            <section className="panel super-admin-panel wide" id="sa-actions">
              <div className="panel-title"><h2>Platform actions</h2><b>CONTROL</b></div>
              <p className="super-admin-section-description">Full editors with every field live on their own pages.</p>
              <div className="super-admin-actions">
                <button type="button" onClick={() => handleSuperAdminNav('sa-workspaces')}>Manage workspaces</button>
                <button type="button" onClick={() => handleSuperAdminNav('sa-plans')}>Manage plans</button>
                <button type="button" onClick={() => handleSuperAdminNav('sa-users')}>Manage users</button>
                <button type="button" onClick={() => handleSuperAdminNav('sa-memberships')}>Manage memberships</button>
                <button type="button" onClick={() => handleSuperAdminNav('sa-roles')}>View roles</button>
                <button type="button" onClick={() => handleSuperAdminNav('sa-vehicle-presets')}>Manage vehicle presets</button>
              </div>
            </section>
          </div>
        </section>
      </main>
    )
  }

  if (accessState === 'loading') {
    return (
      <main className="dashboard-shell dashboard-denied-shell">
        <DashboardHeader subtitle="DASHBOARD" showProfile={false} />
        <section className="dashboard-content dashboard-denied">
          <div className="denied-card">
            <p className="eyebrow">CHECKING ACCESS</p>
            <h1>Checking your permissions…</h1>
          </div>
        </section>
      </main>
    )
  }

  // The server refused (403 not_a_member / no_workspace) or we could not reach
  // it and have no cached snapshot. Say so — do not fall back to "viewer".
  if (accessState === 'error' || !access.canAny(Object.values(TAB_PERMISSIONS).flat())) {
    return (
      <main className="dashboard-shell dashboard-denied-shell">
        <DashboardHeader
          subtitle="DASHBOARD"
          syncState={syncState}
          pending={pending}
          profileName={organization?.name ?? 'Fleet User'}
          roleLabel={roleLabel}
          profilePath="/dashboard"
          onSignOut={signOut}
        />

        <section className="dashboard-content dashboard-denied">
          <div className="denied-card">
            <p className="eyebrow">ACCESS RESTRICTED</p>
            <h1>Dashboard access is unavailable</h1>
            <p>
              {accessError
                ?? `Your role (${roleLabel}) does not currently have access to this workspace's active plan features.`}
              {' '}Ask an administrator to grant the required permissions or upgrade the plan.
            </p>
            <button type="button" className="denied-button" onClick={refresh}>Try again</button>
            <button type="button" className="denied-button" onClick={signOut}>Back to login</button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className={`dashboard-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <DashboardHeader
        subtitle="DASHBOARD"
        syncState={syncState}
        pending={pending}
        vehicle={selectedVehicle}
        profileName={organization?.name ?? 'Fleet User'}
        roleLabel={roleLabel}
        workspaceOptions={workspaceOptions}
        activeWorkspaceId={active?.workspace?.id}
        onSwitchWorkspace={(id) => {
          switchWorkspace(id)
          setActiveTab('overview')
        }}
        profilePath="/dashboard"
        onSignOut={signOut}
      />

      <section className="dashboard-content">
        <div className="eyebrow">DIAGNOSTICS PANEL</div>
        <div className="dashboard-heading"><h1>VEHICLE SMART PERFORMANCE</h1><span className="live-pill"><i /> {selectedVehicle?.status?.replace('_', ' ').toUpperCase() ?? 'NO VEHICLE'}</span></div>

        <section className="package-status" aria-live="polite">
          <div><small>{active?.workspace?.kind === 'personal' ? 'PERSONAL PLAN' : 'WORKSPACE PLAN'}</small><strong>{active?.plan?.name ?? 'NO ACTIVE PLAN'}</strong></div>
          <span>{roleLabel} · {active?.role?.name ?? 'No role'}</span>
        </section>

        <section className="vehicle-card">
          {vehiclesLoading ? (
            <div className="vehicle-summary"><div className="vehicle-card-copy"><h2>Loading vehicles…</h2><p>Fetching your workspace vehicles.</p></div></div>
          ) : vehiclesError ? (
            <div className="vehicle-summary"><div className="vehicle-card-copy"><h2>No vehicle data</h2><p>{vehiclesError}</p></div><div className="vehicle-switcher"><button className="switch-label" type="button" onClick={() => refreshOverview()}>Try again</button><button className="switch-label" type="button" onClick={() => setShowAddVehicle(true)}>+ ADD VEHICLE</button></div></div>
          ) : !selectedVehicle ? (
            <div className="vehicle-summary"><span className="car-badge"><Icon size={27}><path d="M3 16v-3l2-5h14l2 5v3M5 16v2M19 16v2M6 13h12" /><circle cx="6" cy="16" r="1.5" /><circle cx="18" cy="16" r="1.5" /></Icon></span><div className="vehicle-card-copy"><h2>No vehicles yet</h2><p>Add your first vehicle to start tracking fuel, trips, and service.</p></div>{access?.can('vehicles.add') && <div className="vehicle-switcher"><button className="switch-label" type="button" onClick={() => setShowAddVehicle(true)}>+ ADD VEHICLE</button></div>}</div>
          ) : (
          <><div className="vehicle-summary"><span className="car-badge"><Icon size={27}><path d="M3 16v-3l2-5h14l2 5v3M5 16v2M19 16v2M6 13h12" /><circle cx="6" cy="16" r="1.5" /><circle cx="18" cy="16" r="1.5" /></Icon></span><div className="vehicle-card-copy"><h2>{selectedVehicle.name ?? (`${selectedVehicle.make ?? ''} ${selectedVehicle.model ?? ''}`.trim() || 'Vehicle')} <em>{selectedVehicle.registration}</em></h2><p>{[selectedVehicle.engine, selectedVehicle.year].filter((part) => part && part !== '—').join(' • ') || '—'}</p></div>
          <div className="vehicle-switcher"><button className="switch-label" type="button" aria-expanded={isVehiclePickerOpen} aria-haspopup="listbox" onClick={() => setIsVehiclePickerOpen((open) => !open)}>⇄ SWITCH</button>{access?.can('vehicles.add') && <button className="switch-label" type="button" onClick={() => setShowAddVehicle(true)}>+ ADD</button>}{isVehiclePickerOpen &&
            <div className="vehicle-picker" role="listbox" aria-label="Select a vehicle">{ownedVehicles.map((vehicle) => <button className={String(vehicle.id) === String(selectedVehicleId) ? 'current' : ''} type="button" role="option" aria-selected={String(vehicle.id) === String(selectedVehicleId)} key={vehicle.id} onClick={() => selectVehicle(vehicle)}><strong>{vehicle.name ?? `${vehicle.make ?? ''} ${vehicle.model ?? ''}`.trim()}</strong><span>{vehicle.registration} · {vehicle.year}</span></button>)}{presetVehicles.length > 0 && <><small className="vehicle-picker-heading">ADD FROM A PRESET</small>{presetVehicles.map((vehicle) => <button type="button" key={vehicle.id} onClick={() => { setVehicleForm({ name: vehicle.name || (vehicle.registration && vehicle.registration !== vehicle.make ? vehicle.registration : `${vehicle.make} ${vehicle.model}`), make: vehicle.make === '—' ? '' : vehicle.make || '', model: vehicle.model === '—' ? '' : vehicle.model || '', year: vehicle.year === '—' ? '' : vehicle.year || '', license_plate: '', fuel_type: vehicle.fuel_type || 'petrol', transmission: vehicle.transmission || 'automatic', drive_type: vehicle.drive_type || '', body_type: vehicle.body_type || '', color: vehicle.color || '', doors: vehicle.doors || '', seats: vehicle.seats || '', engine_capacity_cc: vehicle.engine_capacity_cc || '', cylinders: vehicle.cylinders || '', power_hp: vehicle.power_hp || '', power_kw: vehicle.power_kw || '', torque_nm: vehicle.torque_nm || '', top_speed_kmh: vehicle.top_speed_kmh || '', curb_weight_kg: vehicle.curb_weight_kg || '', tank_capacity_liters: vehicle.tank_capacity_liters || vehicle.tank_capacity_l || '', combined_fuel_consumption_l_100km: vehicle.combined_fuel_consumption_l_100km || '', city_fuel_consumption_l_100km: vehicle.city_fuel_consumption_l_100km || '', highway_fuel_consumption_l_100km: vehicle.highway_fuel_consumption_l_100km || '', battery_capacity_kwh: vehicle.battery_capacity_kwh || '', electric_range_km: vehicle.electric_range_km || '', odometer_km: '' }); setShowAddVehicle(true); setIsVehiclePickerOpen(false) }}><strong>{vehicle.make} {vehicle.model}</strong><span>{[vehicle.year, vehicle.engine_capacity_cc ? `${vehicle.engine_capacity_cc}cc` : vehicle.engine].filter(Boolean).join(' · ')}</span></button>)}</>}</div>}</div></div>
          <div className="health-bars masonry"><div><span>ODOMETER <b>{formatNumber(selectedVehicle.odometer)} KM</b></span><div className="bar"><i style={{ width: '100%' }} /></div><small>Current reading</small></div><div><span>MONTH FUEL <b>{summary ? `${formatNumber(summary.fuel.this_month_liters)} L` : '—'}</b></span><div className="bar green"><i style={{ width: summary && Number(summary.fuel.this_month_liters) > 0 ? '100%' : '0%' }} /></div><small>{summary ? `${summary.fuel.record_count} fill-ups logged` : 'No summary yet'}</small></div></div></>
          )}
        </section>
        {vehicleSelectionError && <p className="vehicle-api-error" role="alert">{vehicleSelectionError}</p>}

        {showAddVehicle && (
          <section className="panel" aria-labelledby="add-vehicle-title">
            <div className="panel-title"><h2 id="add-vehicle-title">Add vehicle</h2><b>NEW</b></div>
            {access?.atLimit('vehicles') && <p className="dashboard-notice" role="alert">Your {active?.plan?.name ?? 'package'} allows {access.limit('vehicles')} vehicle(s) and they are all used. Upgrade the package to add more.</p>}
            <form className="super-admin-form" onSubmit={submitVehicle}>
              <input required placeholder="Name (e.g. My Premio)" value={vehicleForm.name} onChange={(event) => setVehicleForm({ ...vehicleForm, name: event.target.value })} />
              <input placeholder="Make (e.g. Toyota)" value={vehicleForm.make} onChange={(event) => setVehicleForm({ ...vehicleForm, make: event.target.value })} />
              <input placeholder="Model (e.g. Premio)" value={vehicleForm.model} onChange={(event) => setVehicleForm({ ...vehicleForm, model: event.target.value })} />
              <input placeholder="License plate (e.g. UBA 123A)" value={vehicleForm.license_plate} onChange={(event) => setVehicleForm({ ...vehicleForm, license_plate: event.target.value })} />
              <input placeholder="VIN" value={vehicleForm.vin || ''} onChange={(event) => setVehicleForm({ ...vehicleForm, vin: event.target.value })} />
              <input type="number" min="1900" max="2100" placeholder="Year" value={vehicleForm.year} onChange={(event) => setVehicleForm({ ...vehicleForm, year: event.target.value })} />
              <input placeholder="Color" value={vehicleForm.color || ''} onChange={(event) => setVehicleForm({ ...vehicleForm, color: event.target.value })} />
              <select value={vehicleForm.body_type || ''} onChange={(event) => setVehicleForm({ ...vehicleForm, body_type: event.target.value })}>
                <option value="">Body type</option>
                {['sedan', 'hatchback', 'suv', 'crossover', 'wagon', 'pickup', 'van', 'coupe', 'convertible', 'bus', 'other'].map((value) => (
                  <option key={value} value={value}>{value.replace(/_/g, ' ').toUpperCase()}</option>
                ))}
              </select>
              <input type="number" min="1" placeholder="Doors" value={vehicleForm.doors || ''} onChange={(event) => setVehicleForm({ ...vehicleForm, doors: event.target.value })} />
              <input type="number" min="1" placeholder="Seats" value={vehicleForm.seats || ''} onChange={(event) => setVehicleForm({ ...vehicleForm, seats: event.target.value })} />
              <select value={vehicleForm.fuel_type} onChange={(event) => setVehicleForm({ ...vehicleForm, fuel_type: event.target.value })}><option value="petrol">Petrol</option><option value="diesel">Diesel</option><option value="electric">Electric</option><option value="hybrid">Hybrid</option><option value="lpg">LPG</option><option value="cng">CNG</option><option value="other">Other</option></select>
              <input type="number" min="1" placeholder="Engine (cc)" value={vehicleForm.engine_capacity_cc || ''} onChange={(event) => setVehicleForm({ ...vehicleForm, engine_capacity_cc: event.target.value })} />
              <input type="number" min="1" placeholder="Cylinders" value={vehicleForm.cylinders || ''} onChange={(event) => setVehicleForm({ ...vehicleForm, cylinders: event.target.value })} />
              <select value={vehicleForm.transmission || 'automatic'} onChange={(event) => setVehicleForm({ ...vehicleForm, transmission: event.target.value })}><option value="manual">Manual</option><option value="automatic">Automatic</option><option value="cvt">CVT</option><option value="dct">DCT</option><option value="amt">AMT</option><option value="other">Other</option></select>
              <select value={vehicleForm.drive_type || ''} onChange={(event) => setVehicleForm({ ...vehicleForm, drive_type: event.target.value })}><option value="">Drive type</option><option value="fwd">FWD</option><option value="rwd">RWD</option><option value="awd">AWD</option><option value="4wd">4WD</option><option value="other">Other</option></select>
              <input type="number" min="0" step="0.01" placeholder="Power (hp)" value={vehicleForm.power_hp || ''} onChange={(event) => setVehicleForm({ ...vehicleForm, power_hp: event.target.value })} />
              <input type="number" min="0" step="0.01" placeholder="Power (kW)" value={vehicleForm.power_kw || ''} onChange={(event) => setVehicleForm({ ...vehicleForm, power_kw: event.target.value })} />
              <input type="number" min="0" step="0.01" placeholder="Torque (Nm)" value={vehicleForm.torque_nm || ''} onChange={(event) => setVehicleForm({ ...vehicleForm, torque_nm: event.target.value })} />
              <input type="number" min="0" step="0.01" placeholder="Top speed (km/h)" value={vehicleForm.top_speed_kmh || ''} onChange={(event) => setVehicleForm({ ...vehicleForm, top_speed_kmh: event.target.value })} />
              <input type="number" min="0" step="0.01" placeholder="Curb weight (kg)" value={vehicleForm.curb_weight_kg || ''} onChange={(event) => setVehicleForm({ ...vehicleForm, curb_weight_kg: event.target.value })} />
              <input type="number" min="0" step="0.01" placeholder="Tank capacity (L)" value={vehicleForm.tank_capacity_liters || ''} onChange={(event) => setVehicleForm({ ...vehicleForm, tank_capacity_liters: event.target.value })} />
              <input type="number" min="0" step="0.01" placeholder="Combined (L/100 km)" value={vehicleForm.combined_fuel_consumption_l_100km || ''} onChange={(event) => setVehicleForm({ ...vehicleForm, combined_fuel_consumption_l_100km: event.target.value })} />
              <input type="number" min="0" step="0.01" placeholder="City (L/100 km)" value={vehicleForm.city_fuel_consumption_l_100km || ''} onChange={(event) => setVehicleForm({ ...vehicleForm, city_fuel_consumption_l_100km: event.target.value })} />
              <input type="number" min="0" step="0.01" placeholder="Highway (L/100 km)" value={vehicleForm.highway_fuel_consumption_l_100km || ''} onChange={(event) => setVehicleForm({ ...vehicleForm, highway_fuel_consumption_l_100km: event.target.value })} />
              <input type="number" min="0" step="0.01" placeholder="Battery (kWh)" value={vehicleForm.battery_capacity_kwh || ''} onChange={(event) => setVehicleForm({ ...vehicleForm, battery_capacity_kwh: event.target.value })} />
              <input type="number" min="0" placeholder="Electric range (km)" value={vehicleForm.electric_range_km || ''} onChange={(event) => setVehicleForm({ ...vehicleForm, electric_range_km: event.target.value })} />
              <input type="number" min="0" step="0.1" placeholder="Odometer (km)" value={vehicleForm.odometer_km} onChange={(event) => setVehicleForm({ ...vehicleForm, odometer_km: event.target.value })} />
              {vehicleFormError && <p className="dashboard-notice" role="alert">{vehicleFormError}</p>}
              <div className="super-admin-dialog-actions"><button type="button" onClick={() => setShowAddVehicle(false)}>Cancel</button><button type="submit" disabled={vehicleSaving || access?.atLimit('vehicles')}>{vehicleSaving ? 'Adding…' : 'Add vehicle'}</button></div>
            </form>
          </section>
        )}

        {visibleTab === 'telemetry' ? (
          <Telemetry onBack={() => setActiveTab('overview')} />
        ) : visibleTab === 'fuel' ? (
          <Fuel onBack={() => setActiveTab('overview')} vehicle={selectedVehicle} access={access} />
        ) : visibleTab === 'services' ? (
          <Services onBack={() => setActiveTab('overview')} vehicle={selectedVehicle} access={access} />
        ) : visibleTab === 'trips' ? (
          <Trips onBack={() => setActiveTab('overview')} vehicle={selectedVehicle} access={access} />
        ) : visibleTab === 'system' ? (
          <System key={selectedVehicle ? String(selectedVehicle.id) : 'system'} onBack={() => setActiveTab('overview')} vehicle={selectedVehicle} access={access} onVehiclesChanged={loadVehicles} />
        ) : (
          <div className="masonry">
        <section className="metric-grid">
          <Metric label="ODOMETER" value={selectedVehicle ? formatNumber(selectedVehicle.odometer) : '\u2014'} detail={summaryLoading ? 'LOADING\u2026' : 'KM CURRENT'} accent="cyan" icon={<Icon><path d="M4 18a8 8 0 1 1 16 0" /><path d="m12 14 3-3M4 18h16" /></Icon>} />
          <Metric label="FUEL COST" value={summary ? formatUgxShort(summary.fuel.this_month_cost) : summaryLoading ? '\u2026' : '\u2014'} detail="UGX THIS MONTH" accent="white" icon={<Icon><rect x="3" y="6" width="17" height="12" rx="2" /><path d="M7 10h6v4H7zM20 9l2 2v5" /></Icon>} />
          <Metric label="DISTANCE" value={summary ? formatNumber(summary.trips.month_distance_km) : summaryLoading ? '\u2026' : '\u2014'} detail={summary ? `KM THIS MONTH  \u25c9 ${summary.trips.month_count} TRIPS` : 'NO TRIPS YET'} accent="white" icon={<Icon><path d="M6 4v16M18 4v16M6 7c5 0 7 3 12 3M6 17c5 0 7-3 12-3" /><circle cx="6" cy="4" r="2" /><circle cx="18" cy="4" r="2" /></Icon>} />
          <Metric label="EFFICIENCY" value={efficiency} detail="MONTHLY TRIP FUEL / DISTANCE · L/100 KM" accent="amber" icon={<Icon><path d="M12 3a9 9 0 1 1-9 9" /><path d="M12 7v5l3 2" /></Icon>} />
          <Metric label="SERVICE SPEND" value={summary ? formatUgxShort(summary.maintenance.this_month_cost) : summaryLoading ? '\u2026' : '\u2014'} detail={summary ? `UGX THIS MONTH \u00b7 ${summary.maintenance.record_count} RECORDS` : 'NO RECORDS YET'} accent="amber" icon={<Icon><path d="M12 3a9 9 0 1 1-9 9" /><path d="M12 7v5l3 2" /></Icon>} />
          {(summaryError || vehiclesError) && <p className="dashboard-notice" role="alert">{summaryError ?? vehiclesError} <button type="button" className="dashboard-retry" onClick={() => refreshOverview()}>Try again</button></p>}
        </section>
        <p className="sample-dashboard-note" role="note">Chart, alerts, and sensor-specific panels below are illustrative until records or live telemetry are connected.</p>

        <section className="panel telemetry-panel">
          <div className="panel-title"><h2><span className="trend-icon">⌁</span> TELEMETRY CURVES</h2></div>
          <div className="chart-meta"><span>TRIP CONSUMPTION (L/100 KM)</span><strong>{consumptionAvg !== null ? `Avg ${consumptionAvg.toFixed(1)} L/100km` : 'No data yet'}</strong></div>
          {consumption ? (
            <div className="chart">
              <div className="chart-grid" />
              <svg viewBox="0 0 600 230" preserveAspectRatio="none" role="img" aria-label="Trip consumption curve">
                <defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#3bd4f2" stopOpacity=".34" /><stop offset="1" stopColor="#3bd4f2" stopOpacity="0" /></linearGradient></defs>
                <path className="chart-area" d={`${consumption.d} L600,230 L0,230Z`} />
                <path className="chart-line" d={consumption.d} />
                <circle className="point end-point" cx={consumption.lastX} cy={consumption.lastY} r="5" />
              </svg>
              <span className="chart-label peak">{consumption.max.toFixed(1)}L (Peak)</span>
              <span className="chart-label low">{consumption.min.toFixed(1)}L (Min)</span>
            </div>
          ) : (
            <p className="super-admin-empty">Log at least two trips with distance and fuel to see your real consumption curve.</p>
          )}
          <div className="trip-labels">{monthTrips.length ? `${monthTrips.length} recent trip${monthTrips.length === 1 ? '' : 's'} \u00b7 oldest \u2192 newest` : 'No trip data yet'}</div>
        </section>

        <section className="panel alert-panel service">
          <div className="panel-accent amber-line" />
          <div className="card-top"><span className="service-icon"><Icon><path d="m14 6 4 4M13 7l4-4 4 4-4 4M4 20l6-6M3 16l5 5 3-3-5-5z" /></Icon></span><div><small>NEXT SERVICE ALERT</small><h2>{nextReminder ? (nextReminder.service_type || 'Service due') : 'No open reminders'}</h2></div><b>{reminderDueLabel}</b></div>
          {nextReminder && (
            <div className="service-meter">
              <span>Maintenance threshold <b>{nextReminder.km_remaining !== null && nextReminder.km_remaining !== undefined ? `${formatNumber(nextReminder.km_remaining)} km remaining` : nextReminder.due_date ? `Due ${nextReminder.due_date}` : 'Due soon'}</b></span>
              <div className="meter"><i /></div>
              <span>{nextReminder.due_odometer_km ? `Target: ${formatNumber(nextReminder.due_odometer_km)} KM` : 'No odometer target'}{nextReminder.due_date ? ` \u00b7 ${nextReminder.due_date}` : ''}</span>
            </div>
          )}
          <div className="service-bottom">
            <p>{reminders.length ? `${reminders.length} open reminder${reminders.length === 1 ? '' : 's'}\nfor this vehicle` : 'Nothing due right now'}</p>
            <button type="button" onClick={() => setActiveTab('services')}>VIEW<br />SERVICE <Icon size={15}><path d="M5 4h14v16H5zM8 2v4M16 2v4M5 9h14" /></Icon></button>
          </div>
        </section>

        {access?.can('predictions.use') && (
          <section className="panel alert-panel predictive">
            <div className="panel-accent cyan-line" />
            <div className="card-top"><span className="service-icon cyan-bg"><Icon><rect x="4" y="7" width="16" height="12" rx="2" /><path d="M8 7V4h8v3M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" /></Icon></span><div><small>FREQUENT ROUTE</small><h2>{frequentTrip ? `${formatNumber(frequentTrip.avgKm)} km ${frequentTrip.start} \u2192 ${frequentTrip.destination}` : 'Not enough trip history'}</h2></div><b className="optimized">{frequentTrip ? `${frequentTrip.count} TRIPS` : 'LEARNING'}</b></div>
            {frequentTrip ? (
              <>
                <p className="route">△ &nbsp;{frequentTrip.start}&nbsp; → &nbsp;{frequentTrip.destination} <small>Most repeated route this month</small></p>
                <div className="prediction-stats">
                  <div><small>ESTIMATED BURN</small><strong>{frequentTrip.avgLiters !== null ? `${frequentTrip.avgLiters.toFixed(1)} Liters` : '—'}</strong></div>
                  <div><small>PROJECTED COST</small><strong>{frequentTrip.avgCost !== null ? `UGX ${formatUgxShort(frequentTrip.avgCost)}` : '—'}</strong></div>
                </div>
                <div className="predictive-footer">
                  <p>Average of {frequentTrip.count} logged trips<br />on this route</p>
                  <button type="button" onClick={() => setActiveTab('trips')}>START<br />TRIP <span>→</span></button>
                </div>
              </>
            ) : (
              <div className="predictive-footer"><p>Log the same route twice and the estimate appears here.</p></div>
            )}
          </section>
        )}

        <section className="panel reminders">
          <div className="panel-title"><h2><span className="warning">△</span> ALERTS &amp; REMINDERS</h2><b>{reminders.length} ACTIVE</b></div>
          {reminders.length ? reminders.map((reminder) => (
            <div className="reminder" key={reminder.id}>
              <i />
              <div>
                <strong>{reminder.service_type || 'Service reminder'}</strong>
                <p>{[reminder.km_remaining !== null && reminder.km_remaining !== undefined ? `Due in ${formatNumber(reminder.km_remaining)} km` : null, reminder.due_date ? `By ${reminder.due_date}` : null, reminder.notes].filter(Boolean).join(' · ') || 'Scheduled maintenance'}</p>
              </div>
              <small className={reminder.computed_status === 'overdue' || (reminder.days_remaining !== null && reminder.days_remaining <= 7) ? 'warning-text' : ''}>{reminder.computed_status || reminder.status || 'open'}</small>
            </div>
          )) : <p className="super-admin-empty">No open reminders for this vehicle.</p>}
          {access?.can('maintenance.view') && (
            <button className="diagnostic-button" type="button" onClick={() => setActiveTab('services')}>
              <Icon size={16}><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M8 5V3h8v2M8 12h3M14 12h3M8 15h3" /></Icon> OPEN MAINTENANCE
            </button>
          )}
        </section>
          </div>
        )}
      </section>

      <Sidebar
        items={dashboardNavItems}
        activeTab={visibleTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        title="SECTIONS"
        subtitle={roleLabel}
        ariaLabel="Dashboard sections"
        footer={<div className="sidebar-footer-copy"><small>ACTIVE ROLE</small><strong>{roleLabel}</strong></div>}
      />
    </main>
  )
}