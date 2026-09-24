import { useNavigate } from 'react-router-dom'
import * as auth from '../api/auth'
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

export default function Dashboard() {
  const navigate = useNavigate()

  function signOut() {
    auth.logout()
    navigate('/login')
  }

  return (
    <main className="dashboard-shell">
      <header className="dashboard-topbar">
        <div className="wordmark"><span className="wordmark-mark"><Icon size={22}><path d="M4 15h16M6 15l1-5h10l1 5M8 10l1-3h6l1 3M7 18h.01M17 18h.01" /><circle cx="7" cy="17" r="1.5" /><circle cx="17" cy="17" r="1.5" /></Icon></span><span>VOLT MECHANICS<small>DASHBOARD</small></span></div>
        <div className="topbar-actions"><span className="vin"><Icon size={16}><path d="M4 17h16M5 17l1-6h12l1 6M8 11l1-3h6l1 3" /><circle cx="7" cy="18" r="1" /><circle cx="17" cy="18" r="1" /></Icon> VIN: 8492 <span>⌄</span></span><button className="profile-button" aria-label="Sign out" onClick={signOut}><Icon size={19}><circle cx="12" cy="8" r="3" /><path d="M5 20c.6-3.2 2.8-5 7-5s6.4 1.8 7 5" /></Icon></button></div>
      </header>

      <section className="dashboard-content">
        <div className="eyebrow">DIAGNOSTICS PANEL</div>
        <div className="dashboard-heading"><h1>VEHICLE SMART<br />PERFORMANCE</h1><span className="live-pill"><i /> ECU<br />LIVE</span></div>

        <section className="vehicle-card">
          <div className="vehicle-summary"><span className="car-badge"><Icon size={27}><path d="M3 16v-3l2-5h14l2 5v3M5 16v2M19 16v2M6 13h12" /><circle cx="6" cy="16" r="1.5" /><circle cx="18" cy="16" r="1.5" /></Icon></span><div><h2>Toyota Premio <em>UBA 123A</em></h2><p>1.8L Valvematic Petrol • Automatic</p></div><span className="switch-label">⇄ SWITCH</span></div>
          <div className="health-bars"><div><span>TANK RESERVE <b>68%</b></span><div className="bar"><i style={{ width: '68%' }} /></div><small>40.8 L / 60L</small></div><div><span>OBD HEALTH <b>OPTIMAL</b></span><div className="bar green"><i style={{ width: '92%' }} /></div><small>0 DTC Codes</small></div></div>
        </section>

        <section className="metric-grid">
          <Metric label="ODOMETER" value="42,580" detail="KM CURRENT  ↗ +180 km wk" accent="cyan" icon={<Icon><path d="M4 18a8 8 0 1 1 16 0" /><path d="m12 14 3-3M4 18h16" /></Icon>} />
          <Metric label="EFFICIENCY" value="7.8" detail="L/100KM   Target: 7.2   +0.6 high" accent="amber" icon={<Icon><path d="M12 3a9 9 0 1 1-9 9" /><path d="M12 7v5l3 2" /></Icon>} />
          <Metric label="FUEL COST" value="320K" detail="UGX THIS MONTH  ↘ -12% vs last mo" accent="white" icon={<Icon><rect x="3" y="6" width="17" height="12" rx="2" /><path d="M7 10h6v4H7zM20 9l2 2v5" /></Icon>} />
          <Metric label="DISTANCE" value="1,240" detail="KM LOGGED CYCLE  ◉ 26 Trips Logged" accent="white" icon={<Icon><path d="M6 4v16M18 4v16M6 7c5 0 7 3 12 3M6 17c5 0 7-3 12-3" /><circle cx="6" cy="4" r="2" /><circle cx="18" cy="4" r="2" /></Icon>} />
        </section>

        <section className="panel telemetry-panel"><div className="panel-title"><h2><span className="trend-icon">⌁</span> TELEMETRY CURVES</h2><div className="segmented"><button className="active">FUEL</button><button>SPEND</button></div></div><div className="chart-meta"><span>TRIP CONSUMPTION VARIANCE</span><strong>Avg 7.8 L/100km</strong></div><div className="chart"><div className="chart-grid" /><svg viewBox="0 0 600 230" preserveAspectRatio="none" role="img" aria-label="Trip consumption curve"><defs><linearGradient id="area" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#3bd4f2" stopOpacity=".34" /><stop offset="1" stopColor="#3bd4f2" stopOpacity="0" /></linearGradient></defs><path className="chart-area" d="M0 190 C70 70 120 120 210 165 S290 225 350 85 S450 25 500 78 S560 150 600 165 L600 230 L0 230Z" /><path className="chart-line" d="M0 190 C70 70 120 120 210 165 S290 225 350 85 S450 25 500 78 S560 150 600 165" /><circle className="point amber-point" cx="350" cy="85" r="6" /><circle className="point green-point" cx="210" cy="165" r="6" /><circle className="point end-point" cx="600" cy="165" r="5" /></svg><span className="chart-label peak">8.5L (Peak)</span><span className="chart-label low">7.1L (Min)</span><span className="chart-target">TARGET 7.2L</span></div><div className="trip-labels">Trip #19&nbsp;&nbsp; Trip #21&nbsp;&nbsp; Trip #23&nbsp;&nbsp; Trip #25 (Yesterday)&nbsp;&nbsp; Latest</div></section>

        <section className="panel alert-panel service"><div className="panel-accent amber-line" /><div className="card-top"><span className="service-icon"><Icon><path d="m14 6 4 4M13 7l4-4 4 4-4 4M4 20l6-6M3 16l5 5 3-3-5-5z" /></Icon></span><div><small>NEXT SERVICE ALERT</small><h2>Oil Change &amp; Filter</h2></div><b>~12 Days</b></div><div className="service-meter"><span>Maintenance Threshold <b>850 KM Remaining</b></span><div className="meter"><i /></div><span>Last: 38,000 KM <b>Target: 43,430 KM</b></span></div><div className="service-bottom"><p>5W-30 Full Synthetic<br />Recommended</p><button>BOOK<br />SERVICE <Icon size={15}><path d="M5 4h14v16H5zM8 2v4M16 2v4M5 9h14" /></Icon></button></div></section>

        <section className="panel alert-panel predictive"><div className="panel-accent cyan-line" /><div className="card-top"><span className="service-icon cyan-bg"><Icon><rect x="4" y="7" width="16" height="12" rx="2" /><path d="M8 7V4h8v3M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" /></Icon></span><div><small>PREDICTIVE TELEMETRY</small><h2>85 km Frequent Trip</h2></div><b className="optimized">OPTIMIZED</b></div><p className="route">△ &nbsp;Home&nbsp; → &nbsp;Industrial Area <small>Morning Route</small></p><div className="prediction-stats"><div><small>ESTIMATED BURN</small><strong>6.7 Liters</strong></div><div><small>PROJECTED COST</small><strong>UGX 28,000</strong></div></div><div className="predictive-footer"><p>Live congestion &amp; engine load<br />forecasted</p><button>START<br />TRIP <span>→</span></button></div></section>

        <section className="panel reminders"><div className="panel-title"><h2><span className="warning">△</span> ALERTS &amp; REMINDERS</h2><b>2 ACTIVE</b></div><div className="reminder"><i /><div><strong>Fuel consumption higher than usual</strong><p>Surged +0.9 L/100km on uphill driving &amp; continuous heavy AC compressor load.</p></div><small>Yesterday</small></div><div className="reminder"><i /><div><strong>Service due in 850 km</strong><p>Engine oil viscosity degrading; schedule service before hitting 43,430 km odometer mark.</p></div><small className="warning-text">Warning</small></div><button className="diagnostic-button"><Icon size={16}><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M8 5V3h8v2M8 12h3M14 12h3M8 15h3" /></Icon> RUN FULL DIAGNOSTIC SCAN</button></section>
      </section>

      <nav className="bottom-nav"><button className="selected"><Icon><path d="M4 16a8 8 0 1 1 8 4" /><path d="m12 12 4-4" /></Icon><span>TELEMETRY</span></button><button><Icon><path d="M6 4v16M18 4v16M6 7h8M6 12h12M6 17h8" /><path d="M18 4h2v4h-2" /></Icon><span>FUEL</span></button><button><Icon><path d="m14 6 4 4M13 7l4-4 4 4-4 4M4 20l6-6" /></Icon><span>SERVICE</span></button><button><Icon><path d="M6 4v16M18 4v16M6 7c5 0 7 3 12 3M6 17c5 0 7-3 12-3" /></Icon><span>TRIPS</span></button><button><Icon><path d="M4 6h16M4 12h16M4 18h16M8 4v4M15 10v4M11 16v4" /></Icon><span>SYSTEM</span></button></nav>
    </main>
  )
}