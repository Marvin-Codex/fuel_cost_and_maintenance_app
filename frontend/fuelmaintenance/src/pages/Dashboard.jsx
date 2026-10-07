import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as auth from '../api/auth'
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
  const [subscription, setSubscription] = useState(null)
  const [packageState, setPackageState] = useState('loading')
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedVehicleId, setSelectedVehicleId] = useState(demoVehicles[0].id)
  const [isVehiclePickerOpen, setIsVehiclePickerOpen] = useState(false)
  const selectedVehicle = demoVehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? demoVehicles[0]

  useEffect(() => {
    let mounted = true
    async function loadSubscription() {
      try {
        const organizations = await auth.getOrganizations()
        const organizationList = Array.isArray(organizations) ? organizations : organizations.results ?? []
        const organization = organizationList[0]
        if (!organization) {
          if (mounted) setPackageState('empty')
          return
        }
        const response = await auth.getSubscription(organization.id)
        if (mounted) {
          setSubscription(response.subscription)
          setPackageState(response.subscription ? 'active' : 'empty')
        }
      } catch {
        if (mounted) setPackageState('error')
      }
    }
    loadSubscription()
    return () => { mounted = false }
  }, [])

  function signOut() {
    auth.logout()
    navigate('/login')
  }

  return (
    <main className="dashboard-shell">
      <header className="dashboard-topbar">
        <div className="wordmark"><span className="wordmark-mark"><Icon size={22}><path d="M4 15h16M6 15l1-5h10l1 5M8 10l1-3h6l1 3M7 18h.01M17 18h.01" /><circle cx="7" cy="17" r="1.5" /><circle cx="17" cy="17" r="1.5" /></Icon></span><span>VOLT MECHANICS<small>DASHBOARD</small></span></div>
        <div className="topbar-actions"><span className="vin"><Icon size={16}><path d="M4 17h16M5 17l1-6h12l1 6M8 11l1-3h6l1 3" /><circle cx="7" cy="18" r="1" /><circle cx="17" cy="18" r="1" /></Icon> VIN: {selectedVehicle.vinSuffix} <span>⌄</span></span><button className="profile-button" aria-label="Sign out" onClick={signOut}><Icon size={19}><circle cx="12" cy="8" r="3" /><path d="M5 20c.6-3.2 2.8-5 7-5s6.4 1.8 7 5" /></Icon></button></div>
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
          <>
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
          </>
        )}
      </section>

      <nav className="bottom-nav" aria-label="Dashboard sections"><button className={activeTab === 'telemetry' ? 'selected' : ''} type="button" aria-pressed={activeTab === 'telemetry'} onClick={() => setActiveTab('telemetry')}><Icon><path d="M4 16a8 8 0 1 1 8 4" /><path d="m12 12 4-4" /></Icon><span>TELEMETRY</span></button><button className={activeTab === 'fuel' ? 'selected' : ''} type="button" aria-pressed={activeTab === 'fuel'} onClick={() => setActiveTab('fuel')}><Icon><path d="M6 4v16M18 4v16M6 7h8M6 12h12M6 17h8" /><path d="M18 9l2 2v5" /></Icon><span>FUEL</span></button><button className={activeTab === 'services' ? 'selected' : ''} type="button" aria-pressed={activeTab === 'services'} onClick={() => setActiveTab('services')}><Icon><path d="m14 6 4 4M13 7l4-4 4 4-4 4M4 20l6-6" /></Icon><span>SERVICE</span></button><button className={activeTab === 'trips' ? 'selected' : ''} type="button" aria-pressed={activeTab === 'trips'} onClick={() => setActiveTab('trips')}><Icon><path d="M6 4v16M18 4v16M6 7c5 0 7 3 12 3M6 17c5 0 7-3 12-3" /></Icon><span>TRIPS</span></button><button className={activeTab === 'system' ? 'selected' : ''} type="button" aria-pressed={activeTab === 'system'} onClick={() => setActiveTab('system')}><Icon><path d="M4 6h16M4 12h16M4 18h16M8 4v4M15 10v4M11 16v4" /></Icon><span>SYSTEM</span></button></nav>
    </main>
  )
}