import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { useLocation, useNavigate } from 'react-router-dom'
import * as auth from '../api/auth'
import { SyncIndicator } from '../components/animations'
import ThemeToggle from '../components/ui/ThemeToggle'
import { APP_NAME } from '../config/brand'
import { useSyncStatus } from '../hooks/useSyncStatus'
import { getDashboardAccess, normalizeRoleKey, ROLE_LABELS } from '../utils/permissions'
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

const demoVehicles = [
  {
    id: 'premio',
    make: 'Toyota',
    model: 'Premio',
    year: 2018,
    registration: 'UBA 123A',
    vinSuffix: '8492',
    engine: '1.8L Valvematic Petrol',
    transmission: 'Automatic',
    odometer: '42,580',
    tankReserve: 68,
    obdHealth: 92,
    efficiency: '7.8',
    fuelCost: '320K',
    distance: '1,240',
  },
  {
    id: 'hilux',
    make: 'Toyota',
    model: 'Hilux',
    year: 2021,
    registration: 'UBD 456B',
    vinSuffix: '3176',
    engine: '2.4L Turbo Diesel',
    transmission: 'Automatic',
    odometer: '28,340',
    tankReserve: 54,
    obdHealth: 96,
    efficiency: '9.1',
    fuelCost: '485K',
    distance: '1,680',
  },
  {
    id: 'fit',
    make: 'Honda',
    model: 'Fit',
    year: 2016,
    registration: 'UBE 789C',
    vinSuffix: '6205',
    engine: '1.5L Petrol',
    transmission: 'CVT',
    odometer: '81,290',
    tankReserve: 34,
    obdHealth: 84,
    efficiency: '6.9',
    fuelCost: '210K',
    distance: '960',
  },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const [organization, setOrganization] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const [packageState, setPackageState] = useState('loading')
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedVehicleId, setSelectedVehicleId] = useState(demoVehicles[0].id)
  const [isVehiclePickerOpen, setIsVehiclePickerOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
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
      window.localStorage.setItem('fm.sidebar.collapsed', sidebarCollapsed ? '1' : '0')
    } catch {
      /* storage unavailable; collapse state just won't persist */
    }
  }, [sidebarCollapsed])
  const selectedVehicle = demoVehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? demoVehicles[0]
  const { pending, state: syncState } = useSyncStatus()

  const planFeatures = useMemo(
    () => (Array.isArray(subscription?.plan?.features) ? subscription.plan.features : []),
    [subscription],
  )

  const user = auth.getStoredUser()
  const isPlatformSuperUser = Boolean(user?.is_superuser)
  const hasOrganization = Boolean(organization && organization.role)
  const effectiveRole = isPlatformSuperUser
    ? 'super_admin'
    : normalizeRoleKey(hasOrganization ? organization.role : (user ? 'owner' : 'viewer'))

  const access = useMemo(
    () => getDashboardAccess({ role: effectiveRole, planFeatures, allowNoPackageAccess: Boolean(user && !hasOrganization) }),
    [effectiveRole, hasOrganization, planFeatures, user],
  )

  const dashboardNavItems = [
    { id: 'overview', label: 'OVERVIEW', allowed: access.tabs.overview, icon: <Icon><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></Icon> },
    { id: 'telemetry', label: 'TELEMETRY', allowed: access.tabs.telemetry, icon: <Icon><path d="M4 16a8 8 0 1 1 8 4" /><path d="m12 12 4-4" /></Icon> },
    { id: 'fuel', label: 'FUEL', allowed: access.tabs.fuel, icon: <Icon><path d="M6 4v16M18 4v16M6 7h8M6 12h12M6 17h8" /><path d="M18 9l2 2v5" /></Icon> },
    { id: 'services', label: 'SERVICE', allowed: access.tabs.services, icon: <Icon><path d="m14 6 4 4M13 7l4-4 4 4-4 4M4 20l6-6" /></Icon> },
    { id: 'trips', label: 'TRIPS', allowed: access.tabs.trips, icon: <Icon><path d="M6 4v16M18 4v16M6 7c5 0 7 3 12 3M6 17c5 0 7-3 12-3" /></Icon> },
    { id: 'system', label: 'SYSTEM', allowed: access.tabs.system, icon: <Icon><path d="M4 6h16M4 12h16M4 18h16M8 4v4M15 10v4M11 16v4" /></Icon> },
  ]

  useEffect(() => {
    let mounted = true
    async function loadSubscription() {
      try {
        const organizations = await auth.getOrganizations()
        const organizationList = Array.isArray(organizations) ? organizations : organizations.results ?? []
        const currentOrganization = organizationList[0]

        if (!currentOrganization) {
          if (mounted) setPackageState('empty')
          return
        }

        if (mounted) setOrganization(currentOrganization)

        const response = await auth.getSubscription(currentOrganization.id)
        if (mounted) {
          const nextSubscription = response.subscription
          setSubscription(nextSubscription)
          setPackageState(nextSubscription ? 'active' : 'empty')
        }
      } catch {
        if (mounted) setPackageState('error')
      }
    }
    loadSubscription()
    return () => { mounted = false }
  }, [])

  useEffect(() => {
    if (!access.canViewAny && activeTab !== 'overview') {
      setActiveTab('overview')
    }

    const permittedTab = Object.entries(access.tabs).find(([, allowed]) => allowed)?.[0] ?? 'overview'
    if (!access.tabs[activeTab] && activeTab !== 'overview') {
      setActiveTab(permittedTab)
    }
  }, [access, activeTab])

  function signOut() {
    auth.logout()
    navigate('/login')
  }

  const roleKey = isPlatformSuperUser ? 'super_admin' : normalizeRoleKey(organization?.role)
  const roleLabel = ROLE_LABELS[roleKey] ?? ROLE_LABELS.viewer
  const isSuperAdmin = isPlatformSuperUser || roleKey === 'super_admin'

  const superAdminNavItems = [
    { id: 'sa-overview', label: 'OVERVIEW', allowed: true, icon: <Icon><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></Icon> },
    { id: 'sa-tenants', label: 'TENANTS', allowed: access.memberManage, icon: <Icon><path d="M3 21h18M6 21V3h12v18M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01" /></Icon> },
    { id: 'sa-plans', label: 'PLANS', allowed: access.systemView, icon: <Icon><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" /></Icon> },
    { id: 'sa-actions', label: 'ACTIONS', allowed: access.systemView, icon: <Icon><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" /></Icon> },
  ]

  const handleSuperAdminNav = (id) => {
    setSuperAdminSection(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (isSuperAdmin) {
    return (
      <main className={`dashboard-shell super-admin-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <header className="dashboard-topbar">
          <div className="wordmark"><span className="wordmark-mark"><Icon size={22}><path d="M4 15h16M6 15l1-5h10l1 5M8 10l1-3h6l1 3M7 18h.01M17 18h.01" /><circle cx="7" cy="17" r="1.5" /><circle cx="17" cy="17" r="1.5" /></Icon></span><span>{APP_NAME}<small>SUPER ADMIN</small></span></div>
          <div className="topbar-actions">
            <SyncIndicator state={syncState} pending={pending} />
            <ThemeToggle />
            <div className="profile-menu">
              <button className="profile-button" aria-label="Open profile menu" onClick={() => setProfileOpen((open) => !open)}>
                <Icon size={19}><circle cx="12" cy="8" r="3" /><path d="M5 20c.6-3.2 2.8-5 7-5s6.4 1.8 7 5" /></Icon>
              </button>
              {profileOpen && (
                <div className="profile-dropdown" role="menu" aria-label="Profile menu">
                  <div className="profile-summary">
                    <strong>{organization?.name ?? 'Platform Admin'}</strong>
                    <span>{roleLabel}</span>
                  </div>
                  <button type="button" role="menuitem" onClick={() => navigate('/super-admin')}>Profile</button>
                  <button type="button" role="menuitem" onClick={() => navigate('/super-admin')}>Settings</button>
                  <button type="button" role="menuitem" className="danger" onClick={signOut}>Log out</button>
                </div>
              )}
            </div>
          </div>
        </header>

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

          <div className="super-admin-stat-grid">
            <article className="metric-card super-admin-metric">
              <small>ACTIVE ORGANIZATIONS</small>
              <strong>24</strong>
              <p>+3 this month</p>
            </article>
            <article className="metric-card super-admin-metric">
              <small>SUBSCRIPTIONS</small>
              <strong>18</strong>
              <p>12 active plans</p>
            </article>
            <article className="metric-card super-admin-metric">
              <small>MEMBERS</small>
              <strong>342</strong>
              <p>96% active</p>
            </article>
            <article className="metric-card super-admin-metric">
              <small>SYSTEM HEALTH</small>
              <strong>99.2%</strong>
              <p>Uptime this week</p>
            </article>
          </div>

          <div className="super-admin-grid">
            <section className="panel super-admin-panel" id="sa-tenants">
              <div className="panel-title"><h2>Tenant overview</h2><b>LIVE</b></div>
              <div className="super-admin-list">
                <div><span>FleetOps Uganda</span><strong>Owner</strong></div>
                <div><span>TransLogix</span><strong>Admin</strong></div>
                <div><span>City Fuel Co.</span><strong>Fleet Manager</strong></div>
                <div><span>LogiCare</span><strong>Maintenance</strong></div>
              </div>
            </section>

            <section className="panel super-admin-panel" id="sa-plans">
              <div className="panel-title"><h2>Plan access</h2><b>FEATURES</b></div>
              <div className="super-admin-list">
                <div><span>Essentials</span><strong>12 orgs</strong></div>
                <div><span>Fleet</span><strong>7 orgs</strong></div>
                <div><span>Scale</span><strong>5 orgs</strong></div>
                <div><span>Enterprise</span><strong>1 org</strong></div>
              </div>
            </section>

            <section className="panel super-admin-panel wide" id="sa-actions">
              <div className="panel-title"><h2>Platform actions</h2><b>CONTROL</b></div>
              <div className="super-admin-actions">
                <button type="button">Manage organizations</button>
                <button type="button">Update subscriptions</button>
                <button type="button">Review members</button>
                <button type="button">System settings</button>
              </div>
            </section>
          </div>
        </section>
      </main>
    )
  }

  if (!access.canViewAny && packageState !== 'loading') {
    return (
      <main className="dashboard-shell dashboard-denied-shell">
        <header className="dashboard-topbar">
          <div className="wordmark"><span className="wordmark-mark"><Icon size={22}><path d="M4 15h16M6 15l1-5h10l1 5M8 10l1-3h6l1 3M7 18h.01M17 18h.01" /><circle cx="7" cy="17" r="1.5" /><circle cx="17" cy="17" r="1.5" /></Icon></span><span>{APP_NAME}<small>DASHBOARD</small></span></div>
          <div className="topbar-actions"><SyncIndicator state={syncState} pending={pending} /><ThemeToggle /><button className="profile-button" aria-label="Sign out" onClick={signOut}><Icon size={19}><circle cx="12" cy="8" r="3" /><path d="M5 20c.6-3.2 2.8-5 7-5s6.4 1.8 7 5" /></Icon></button></div>
        </header>

        <section className="dashboard-content dashboard-denied">
          <div className="denied-card">
            <p className="eyebrow">ACCESS RESTRICTED</p>
            <h1>Dashboard access is unavailable</h1>
            <p>
              Your role ({roleLabel}) does not currently have access to this organization’s active plan features.
              Contact an administrator to enable the required permissions or upgrade the subscription.
            </p>
            <button type="button" className="denied-button" onClick={signOut}>Back to login</button>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className={`dashboard-shell${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <header className="dashboard-topbar">
        <div className="wordmark"><span className="wordmark-mark"><Icon size={22}><path d="M4 15h16M6 15l1-5h10l1 5M8 10l1-3h6l1 3M7 18h.01M17 18h.01" /><circle cx="7" cy="17" r="1.5" /><circle cx="17" cy="17" r="1.5" /></Icon></span><span>{APP_NAME}<small>DASHBOARD</small></span></div>
        <div className="topbar-actions">
          <SyncIndicator state={syncState} pending={pending} />
          <ThemeToggle />
          <span className="vin"><Icon size={16}><path d="M4 17h16M5 17l1-6h12l1 6M8 11l1-3h6l1 3" /><circle cx="7" cy="18" r="1" /><circle cx="17" cy="18" r="1" /></Icon> VIN: {selectedVehicle.vinSuffix} <span>⌄</span></span>
          <div className="profile-menu">
            <button className="profile-button" aria-label="Open profile menu" onClick={() => setProfileOpen((open) => !open)}>
              <Icon size={19}><circle cx="12" cy="8" r="3" /><path d="M5 20c.6-3.2 2.8-5 7-5s6.4 1.8 7 5" /></Icon>
            </button>
            {profileOpen && (
              <div className="profile-dropdown" role="menu" aria-label="Profile menu">
                <div className="profile-summary">
                  <strong>{organization?.name ?? 'Fleet User'}</strong>
                  <span>{roleLabel}</span>
                </div>
                <button type="button" role="menuitem" onClick={() => navigate('/dashboard')}>Profile</button>
                <button type="button" role="menuitem" onClick={() => navigate('/dashboard')}>Settings</button>
                <button type="button" role="menuitem" className="danger" onClick={signOut}>Log out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <section className="dashboard-content">
        <div className="eyebrow">DIAGNOSTICS PANEL</div>
        <div className="dashboard-heading"><h1>VEHICLE SMART<br />PERFORMANCE</h1><span className="live-pill"><i /> ECU<br />LIVE</span></div>

        <section className="package-status" aria-live="polite">
          <div><small>ORGANIZATION PACKAGE</small><strong>{packageState === 'active' ? subscription.plan.name : packageState === 'loading' ? 'CHECKING ACCESS…' : 'NO ACTIVE PACKAGE'}</strong></div>
          <span>{packageState === 'active' ? `Valid until ${new Date(subscription.ends_at).toLocaleDateString()}` : packageState === 'error' ? 'Access status unavailable' : packageState === 'empty' ? 'Contact your administrator' : 'Loading subscription'}</span>
        </section>

        <section className="vehicle-card">
          <div className="vehicle-summary"><span className="car-badge"><Icon size={27}><path d="M3 16v-3l2-5h14l2 5v3M5 16v2M19 16v2M6 13h12" /><circle cx="6" cy="16" r="1.5" /><circle cx="18" cy="16" r="1.5" /></Icon></span><div className="vehicle-card-copy"><h2>{selectedVehicle.make} {selectedVehicle.model} <em>{selectedVehicle.registration}</em></h2><p>{selectedVehicle.engine} • {selectedVehicle.transmission}</p></div><div className="vehicle-switcher"><button className="switch-label" type="button" aria-expanded={isVehiclePickerOpen} aria-haspopup="listbox" onClick={() => setIsVehiclePickerOpen((open) => !open)}>⇄ SWITCH</button>{isVehiclePickerOpen && <div className="vehicle-picker" role="listbox" aria-label="Select a vehicle">{demoVehicles.map((vehicle) => <button className={vehicle.id === selectedVehicle.id ? 'current' : ''} type="button" role="option" aria-selected={vehicle.id === selectedVehicle.id} key={vehicle.id} onClick={() => { setSelectedVehicleId(vehicle.id); setIsVehiclePickerOpen(false) }}><strong>{vehicle.make} {vehicle.model}</strong><span>{vehicle.registration} · {vehicle.year}</span></button>)}</div>}</div></div>
          <div className="health-bars"><div><span>TANK RESERVE <b>{selectedVehicle.tankReserve}%</b></span><div className="bar"><i style={{ width: `${selectedVehicle.tankReserve}%` }} /></div><small>{(60 * selectedVehicle.tankReserve / 100).toFixed(1)} L / 60L</small></div><div><span>OBD HEALTH <b>OPTIMAL</b></span><div className="bar green"><i style={{ width: `${selectedVehicle.obdHealth}%` }} /></div><small>0 DTC Codes</small></div></div>
        </section>

        {activeTab === 'telemetry' ? (
          <Telemetry onBack={() => setActiveTab('overview')} />
        ) : activeTab === 'fuel' ? (
          <Fuel onBack={() => setActiveTab('overview')} vehicle={selectedVehicle} />
        ) : activeTab === 'services' ? (
          <Services onBack={() => setActiveTab('overview')} vehicle={selectedVehicle} />
        ) : activeTab === 'trips' ? (
          <Trips onBack={() => setActiveTab('overview')} vehicle={selectedVehicle} />
        ) : activeTab === 'system' ? (
          <System key={selectedVehicle.id} onBack={() => setActiveTab('overview')} vehicle={selectedVehicle} />
        ) : (
          <div className="overview-grid">
        <section className="metric-grid">
          <Metric label="ODOMETER" value={selectedVehicle.odometer} detail="KM CURRENT  ↗ +180 km wk" accent="cyan" icon={<Icon><path d="M4 18a8 8 0 1 1 16 0" /><path d="m12 14 3-3M4 18h16" /></Icon>} />
          <Metric label="EFFICIENCY" value={selectedVehicle.efficiency} detail="L/100KM   Target: 7.2" accent="amber" icon={<Icon><path d="M12 3a9 9 0 1 1-9 9" /><path d="M12 7v5l3 2" /></Icon>} />
          <Metric label="FUEL COST" value={selectedVehicle.fuelCost} detail="UGX THIS MONTH" accent="white" icon={<Icon><rect x="3" y="6" width="17" height="12" rx="2" /><path d="M7 10h6v4H7zM20 9l2 2v5" /></Icon>} />
          <Metric label="DISTANCE" value={selectedVehicle.distance} detail="KM LOGGED CYCLE  ◉ 26 Trips Logged" accent="white" icon={<Icon><path d="M6 4v16M18 4v16M6 7c5 0 7 3 12 3M6 17c5 0 7-3 12-3" /><circle cx="6" cy="4" r="2" /><circle cx="18" cy="4" r="2" /></Icon>} />
        </section>

        <section className="panel telemetry-panel"><div className="panel-title"><h2><span className="trend-icon">⌁</span> TELEMETRY CURVES</h2><div className="segmented"><button className="active">FUEL</button><button>SPEND</button></div></div><div className="chart-meta"><span>TRIP CONSUMPTION VARIANCE</span><strong>Avg 7.8 L/100km</strong></div><div className="chart"><div className="chart-grid" /><svg viewBox="0 0 600 230" preserveAspectRatio="none" role="img" aria-label="Trip consumption curve"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#3bd4f2" stopOpacity=".34" /><stop offset="1" stopColor="#3bd4f2" stopOpacity="0" /></linearGradient></defs><path className="chart-area" d="M0 190 C70 70 120 120 210 165 S290 225 350 85 S450 25 500 78 S560 150 600 165 L600 230 L0 230Z" /><path className="chart-line" d="M0 190 C70 70 120 120 210 165 S290 225 350 85 S450 25 500 78 S560 150 600 165" /><circle className="point amber-point" cx="350" cy="85" r="6" /><circle className="point green-point" cx="210" cy="165" r="6" /><circle className="point end-point" cx="600" cy="165" r="5" /></svg><span className="chart-label peak">8.5L (Peak)</span><span className="chart-label low">7.1L (Min)</span><span className="chart-target">TARGET 7.2L</span></div><div className="trip-labels">Trip #19&nbsp;&nbsp; Trip #21&nbsp;&nbsp; Trip #23&nbsp;&nbsp; Trip #25 (Yesterday)&nbsp;&nbsp; Latest</div></section>

        <section className="panel alert-panel service"><div className="panel-accent amber-line" /><div className="card-top"><span className="service-icon"><Icon><path d="m14 6 4 4M13 7l4-4 4 4-4 4M4 20l6-6M3 16l5 5 3-3-5-5z" /></Icon></span><div><small>NEXT SERVICE ALERT</small><h2>Oil Change &amp; Filter</h2></div><b>~12 Days</b></div><div className="service-meter"><span>Maintenance Threshold <b>850 KM Remaining</b></span><div className="meter"><i /></div><span>Last: 38,000 KM <b>Target: 43,430 KM</b></span></div><div className="service-bottom"><p>5W-30 Full Synthetic<br />Recommended</p><button>BOOK<br />SERVICE <Icon size={15}><path d="M5 4h14v16H5zM8 2v4M16 2v4M5 9h14" /></Icon></button></div></section>

        <section className="panel alert-panel predictive"><div className="panel-accent cyan-line" /><div className="card-top"><span className="service-icon cyan-bg"><Icon><rect x="4" y="7" width="16" height="12" rx="2" /><path d="M8 7V4h8v3M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" /></Icon></span><div><small>PREDICTIVE TELEMETRY</small><h2>85 km Frequent Trip</h2></div><b className="optimized">OPTIMIZED</b></div><p className="route">△ &nbsp;Home&nbsp; → &nbsp;Industrial Area <small>Morning Route</small></p><div className="prediction-stats"><div><small>ESTIMATED BURN</small><strong>6.7 Liters</strong></div><div><small>PROJECTED COST</small><strong>UGX 28,000</strong></div></div><div className="predictive-footer"><p>Live congestion &amp; engine load<br />forecasted</p><button>START<br />TRIP <span>→</span></button></div></section>

        <section className="panel reminders"><div className="panel-title"><h2><span className="warning">△</span> ALERTS &amp; REMINDERS</h2><b>2 ACTIVE</b></div><div className="reminder"><i /><div><strong>Fuel consumption higher than usual</strong><p>Surged +0.9 L/100km on uphill driving &amp; continuous heavy AC compressor load.</p></div><small>Yesterday</small></div><div className="reminder"><i /><div><strong>Service due in 850 km</strong><p>Engine oil viscosity degrading; schedule service before hitting 43,430 km odometer mark.</p></div><small className="warning-text">Warning</small></div><button className="diagnostic-button"><Icon size={16}><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M8 5V3h8v2M8 12h3M14 12h3M8 15h3" /></Icon> RUN FULL DIAGNOSTIC SCAN</button></section>
          </div>
        )}
      </section>

      <Sidebar
        items={dashboardNavItems}
        activeTab={activeTab}
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