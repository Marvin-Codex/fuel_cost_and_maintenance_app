import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { APP_NAME, APP_DESCRIPTION } from '../config/brand'
import { getPublicPlans } from '../api/auth'
import ThemeToggle from '../components/ui/ThemeToggle'
import { Counter, EngineLine, Gauge, Reveal, RouteAnimation, SyncIndicator } from '../components/animations'
import './Landing.css'

const NAV_LINKS = [
  ['Features', '#features'],
  ['How it works', '#how-it-works'],
  ['Offline', '#offline'],
  ['Packages', '#packages'],
  ['FAQ', '#faq'],
  ['Contact', '#contact'],
]

const FEATURES = [
  ['M4 17c3-8 9-12 16-12M4 17h16M4 17l3 4M12 5a8 8 0 0 1 8 8', 'Trip tracking (GPS)', 'Follow every journey on a live route line with distance, duration and speed summaries.'],
  ['M5 21V6a2 2 0 0 1 2-2h6v18M5 21h10M9 8h3v4H9zM15 9h2l2 3v6', 'Fuel tracking', 'Log fill-ups in litres and UGX. Watch consumption in L/100 km and cost per kilometre.'],
  ['M4 19V9M10 19V5M16 19v-8M22 19H2', 'Cost prediction (ML)', 'Each vehicle learns its own behaviour and forecasts trip cost as a range, never a false exact number.'],
  ['M14 7l3 3M13 8l5-5 4 4-5 5M5 21l5-5', 'Maintenance reminders', 'Mileage and date reminders for oil, brakes, filters and more — before they become breakdowns.'],
  ['M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z', 'Service-centre finder', 'Discover nearby garages and workshops with map pins, distances and service focus.'],
  ['M4 20V12M10 20V6M16 20v-9M2 20h20', 'Analytics dashboard', 'Consumption over time, monthly UGX spend and predicted-vs-actual charts at a glance.'],
]

function FeatureIcon({ path }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

/** Friendly labels for plan entitlement codes shown on the marketing cards. */
const FEATURE_LABELS = {
  'vehicles.view': 'Vehicle records',
  'fuel.view': 'Fuel & trip tracking',
  'fuel.add': 'Log fill-ups',
  'trips.add': 'Trip logging',
  'maintenance.view': 'Maintenance history',
  'analytics.view': 'Analytics dashboard',
  'analytics.export': 'Export reports',
  'predictions.use': 'Cost prediction (ML)',
  'servicecentres.view': 'Service-centre finder',
  'members.view': 'Team visibility',
  'members.invite': 'Invite members',
  'members.manage': 'Manage roles',
  'workspace.manage': 'Workspace settings',
  'billing.manage': 'Billing & subscriptions',
}

/** Curated highlights per plan kind so the marketing cards stay readable. */
function highlightFeatures(plan) {
  const codes = Array.isArray(plan?.features) ? plan.features : []
  const picks = (plan?.kind === 'personal'
    ? ['vehicles.view', 'fuel.view', 'maintenance.view', 'analytics.view', 'predictions.use']
    : ['vehicles.view', 'members.view', 'members.invite', 'members.manage', 'analytics.view', 'predictions.use']
  )
  const labels = picks.filter((code) => codes.includes(code)).map((code) => FEATURE_LABELS[code])
  const extras = codes.filter((code) => !picks.includes(code)).map((code) => FEATURE_LABELS[code]).filter(Boolean)
  const items = [...labels, ...extras].filter(Boolean)
  const seen = new Set()
  return items.filter((label) => (seen.has(label) ? false : (seen.add(label), true))).slice(0, 6)
}

function formatLimit(value) {
  if (value === null || value === undefined) return 'Unlimited'
  return String(value)
}

/** Static cards mirroring backend/access/defaults.py; shown if the API is unreachable. */
const FALLBACK_PACKAGES = [
  { key: 'personal-free', title: 'Personal', text: 'Free. One person, one vehicle.', items: ['1 vehicle', '1 member', 'Vehicle records', 'Fuel & trip tracking', 'Maintenance history'] },
  { key: 'personal-pro', title: 'Personal Pro', text: 'One person, more vehicles. Price grows with vehicle count (billing later).', items: ['5 vehicles', '1 member', 'Cost prediction (ML)', 'Export reports'] },
  { key: 'group', title: 'Group', text: 'A family or small group sharing the same vehicles and statistics.', items: ['5 vehicles', '3 members', 'Team visibility', 'Manage roles'] },
  { key: 'enterprise', title: 'Enterprise', text: 'Registered organization with roles. Limits are set per customer.', items: ['Unlimited vehicles', 'Unlimited members', 'Everything included'] },
]

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [vehicle, setVehicle] = useState('car')
  const [plans, setPlans] = useState([])
  const [plansLoading, setPlansLoading] = useState(true)
  useEffect(() => {
    let cancelled = false
    // Same public endpoint + pagination shape the registration page uses.
    getPublicPlans()
      .then((list) => {
        if (cancelled) return
        const items = Array.isArray(list) ? list : (list?.results || [])
        setPlans(items)
        setPlansLoading(false)
      })
      .catch(() => { if (!cancelled) { setPlans([]); setPlansLoading(false) } })
    return () => { cancelled = true }
  }, [])
  const liveGroups = [
    { heading: 'For individuals', plans: plans.filter((plan) => plan.kind === 'personal') },
    { heading: 'For teams & organizations', plans: plans.filter((plan) => plan.kind !== 'personal') },
  ].filter((group) => group.plans.length > 0)
  return (
    <main className="fm-landing" id="top">
      <nav className="fm-nav" aria-label="Primary">
        <div className="fm-nav-inner">
          <Link to="/" className="fm-brand" aria-label={`${APP_NAME} home`}>
            <span className="fm-brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><path d="M9 17h6" /><circle cx="17" cy="17" r="2" /></svg>
            </span>
            <span className="fm-brand-name">{APP_NAME}</span>
          </Link>
          <div className="fm-nav-links">
            {NAV_LINKS.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
          </div>
          <div className="fm-nav-actions">
            <ThemeToggle />
            <Link className="fm-btn fm-btn--ghost fm-btn--sm" to="/login">Login</Link>
            <Link className="fm-btn fm-btn--primary fm-btn--sm" to="/register">Get started</Link>
            <button type="button" className="fm-menu-btn" aria-expanded={menuOpen} aria-label={menuOpen ? 'Close menu' : 'Open menu'} onClick={() => setMenuOpen((open) => !open)}>
              <span aria-hidden="true">{menuOpen ? '\u2715' : '\u2630'}</span>
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="fm-nav-mobile">
            {NAV_LINKS.map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}
          </div>
        )}
      </nav>
      <header className="fm-hero fm-map-grid" aria-labelledby="hero-title">
        <div className="fm-hero-inner">
          <Reveal>
            <p className="fm-eyebrow">Connected-vehicle telematics · Uganda-ready</p>
            <h1 id="hero-title">Know exactly what your vehicle costs you — and when it needs care.</h1>
            <p className="fm-lede">{APP_DESCRIPTION} GPS trips, fuel in litres and UGX, ML cost forecasts and service reminders for cars and bikes.</p>
            <div className="fm-hero-cta">
              <Link className="fm-btn fm-btn--primary" to="/register">Get started</Link>
              <a className="fm-btn fm-btn--ghost" href="#how-it-works">See how it works</a>
            </div>
            <div className="fm-hero-badges">
              <SyncIndicator state="synced" />
              <span className="fm-badge fm-badge--accent">UGX · km · L/100 km</span>
              <span className="fm-badge">Offline-first PWA</span>
            </div>
          </Reveal>
          <Reveal delay={1} className="fm-hero-visual fm-card">
            <RouteAnimation chips={['Trip 42 km', 'Fuel 3.4 L', 'UGX 18,700']} />
            <div className="fm-hero-gauges">
              <Gauge label="Speed" value={86} max={200} unit="km/h" display="86" />
              <Gauge label="Fuel level" value={68} max={100} unit="%" display="68%" />
            </div>
          </Reveal>
        </div>
      </header>

      <section className="fm-section" id="features" aria-labelledby="features-title">
        <div className="fm-wrap">
          <Reveal>
            <p className="fm-eyebrow">Features</p>
            <h2 id="features-title">Everything a kilometre depends on.</h2>
          </Reveal>
          <div className="fm-grid fm-grid--3">
            {FEATURES.map(([path, title, text], i) => (
              <Reveal as="article" key={title} delay={i % 3} className="fm-card fm-card--lift fm-feature">
                <span className="fm-feature-icon"><FeatureIcon path={path} /></span>
                <h3>{title}</h3>
                <p>{text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="fm-section fm-section--alt" id="how-it-works" aria-labelledby="how-title">
        <div className="fm-wrap">
          <Reveal>
            <p className="fm-eyebrow">How it works</p>
            <h2 id="how-title">From signup to savings in four stops.</h2>
          </Reveal>
          <ol className="fm-timeline">
            {[['Add your vehicle', 'Register cars and motorcycles with plate, fuel type and odometer.'], ['Record fuel and trips', 'Log fill-ups and journeys online or offline — the app never blocks on network.'], ['Learn your vehicle', 'ML studies each vehicle\u2019s own consumption behaviour over real trips.'], ['Get predictions & reminders', 'Trip cost ranges before you drive; service alerts before parts wear out.']].map(([title, text], i) => (
              <Reveal as="li" key={title} delay={i % 4} className="fm-card fm-timeline-step">
                <span className="fm-step-num" aria-hidden="true">{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>
      <section className="fm-section" id="prediction" aria-labelledby="prediction-title">
        <div className="fm-wrap fm-split">
          <Reveal>
            <p className="fm-eyebrow">Cost prediction</p>
            <h2 id="prediction-title">A range you can plan around.</h2>
            <p className="fm-muted">Sample data — the model forecasts a cost band from the vehicle\u2019s own history, then compares it with what you actually spent.</p>
            <div className="fm-pred-chart" role="img" aria-label="Sample predicted versus actual fuel cost chart">
              <svg viewBox="0 0 320 140" aria-hidden="true">
                <g stroke="currentColor" opacity="0.15">{[20, 50, 80, 110].map((y) => <line key={y} x1="0" y1={y} x2="320" y2={y} />)}</g>
                <path d="M10 110 L70 92 L130 96 L190 70 L250 74 L310 48" fill="none" stroke="var(--fm-accent)" strokeWidth="3" strokeLinecap="round" className="fm-route-draw" />
                <path d="M10 116 L70 100 L130 88 L190 80 L250 68 L310 58" fill="none" stroke="var(--fm-warn)" strokeWidth="2.5" strokeDasharray="6 5" strokeLinecap="round" />
              </svg>
              <div className="fm-legend"><span><i className="fm-dot fm-dot--accent" />Predicted</span><span><i className="fm-dot fm-dot--warn" />Actual</span></div>
            </div>
          </Reveal>
          <Reveal delay={1}>
            <article className="fm-card fm-trip-card">
              <p className="fm-eyebrow">Sample trip · Kampala → Entebbe</p>
              <dl>
                <div><dt>Distance</dt><dd className="fm-tnum">42 km</dd></div>
                <div><dt>Fuel</dt><dd className="fm-tnum">3.4 L</dd></div>
                <div><dt>Estimate</dt><dd className="fm-tnum">UGX 17,900 – 19,500</dd></div>
                <div><dt>Actual</dt><dd className="fm-tnum">UGX 18,700</dd></div>
              </dl>
              <span className="fm-badge fm-badge--ok">Within range</span>
            </article>
          </Reveal>
        </div>
      </section>

      <section className="fm-section fm-section--alt" id="maintenance" aria-labelledby="maint-title">
        <div className="fm-wrap fm-split">
          <Reveal className="fm-engine-wrap">
            <EngineLine />
          </Reveal>
          <Reveal delay={1}>
            <p className="fm-eyebrow">Maintenance</p>
            <h2 id="maint-title">Service before the warning light.</h2>
            <p className="fm-muted">Sample data — mileage and date reminders with a live countdown to the next service.</p>
            <div className="fm-service-bar">
              <div className="fm-service-bar-top"><span>Next service in <strong className="fm-tnum"><Counter to={1800} format={(n) => Math.round(n).toLocaleString()} /> km</strong></span><span className="fm-tnum">72%</span></div>
              <div className="fm-progress" role="progressbar" aria-valuenow={72} aria-valuemin={0} aria-valuemax={100} aria-label="Distance to next service"><span style={{ width: '72%' }} /></div>
              <p className="fm-muted">Oil &amp; filter · due at 44,380 km</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="fm-section" id="offline" aria-labelledby="offline-title">
        <div className="fm-wrap fm-split">
          <Reveal>
            <p className="fm-eyebrow">Works offline</p>
            <h2 id="offline-title">Record anywhere. Sync later.</h2>
            <p className="fm-muted">The app shell loads from the service-worker cache after the first visit. Fuel, trips and maintenance save on-device first, then sync — the UI always shows connection and sync state.</p>
            <div className="fm-sync-row">
              <SyncIndicator state="offline" />
              <span className="fm-sync-arrow" aria-hidden="true">→</span>
              <SyncIndicator state="syncing" />
              <span className="fm-sync-arrow" aria-hidden="true">→</span>
              <SyncIndicator state="synced" />
            </div>
          </Reveal>
          <Reveal delay={1}>
            <ol className="fm-steps">
              <li><strong>Record anywhere</strong><span>Log fuel, trips and maintenance with zero bars.</span></li>
              <li><strong>Stored on-device</strong><span>Dexie (web) and SQLite (mobile) keep every entry safe.</span></li>
              <li><strong>Sync when online</strong><span>Queued records upload and reconcile with server truth.</span></li>
            </ol>
          </Reveal>
        </div>
      </section>
      <section className="fm-section fm-section--alt" id="vehicles" aria-labelledby="vehicles-title">
        <div className="fm-wrap">
          <Reveal>
            <p className="fm-eyebrow">Cars and bikes</p>
            <h2 id="vehicles-title">One app for every road user.</h2>
          </Reveal>
          <div className="fm-tabs" role="tablist" aria-label="Vehicle type">
            <button type="button" role="tab" aria-selected={vehicle === 'car'} className={vehicle === 'car' ? 'is-active' : ''} onClick={() => setVehicle('car')}>Cars</button>
            <button type="button" role="tab" aria-selected={vehicle === 'bike'} className={vehicle === 'bike' ? 'is-active' : ''} onClick={() => setVehicle('bike')}>Motorcycles</button>
          </div>
          <Reveal className="fm-card fm-vehicle-card" role="tabpanel">
            {vehicle === 'car' ? (
              <svg key="car" className="car" viewBox="0 0 460 170" role="img" aria-labelledby="car-title">
                <title id="car-title">Animated car driving to the right</title>
                <defs>
                  <clipPath id="car-clip">
                    <path d="M36 126V106Q36 96 48 94L120 88L152 60Q157 55 164 55H252Q261 55 267 61L296 88L362 96Q384 100 388 116V126Z" />
                  </clipPath>
                  <linearGradient id="car-beam" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" className="s0" />
                    <stop offset="1" className="s1" />
                  </linearGradient>
                </defs>

                {/* Road */}
                <line className="ground" x1="0" y1="148" x2="460" y2="148" />
                <line className="dash" x1="-50" y1="160" x2="510" y2="160" />

                {/* Headlight beam */}
                <path className="beam" fill="url(#car-beam)" d="M388 108L456 88V130L388 114Z" />

                {/* Speed streaks behind the car */}
                <g>
                  <path className="streak" d="M12 100H28" />
                  <path className="streak" style={{ animationDelay: '-.2s' }} d="M12 112H28" />
                  <path className="streak" style={{ animationDelay: '-.4s' }} d="M12 124H28" />
                </g>

                {/* Body (bobs on the suspension) */}
                <g className="bob">
                  <path className="body" d="M36 126V106Q36 96 48 94L120 88L152 60Q157 55 164 55H252Q261 55 267 61L296 88L362 96Q384 100 388 116V126Z" />
                  <path className="shade" d="M36 118H388V126H36Z" />
                  <path className="glass" d="M132 86L158 63Q160 60 165 60H204V86Z" />
                  <path className="glass" d="M212 60H252Q257 60 261 64L284 86H212Z" />
                  <path className="glint" d="M168 84L188 62H196L176 84Z" />
                  <path className="glint" d="M232 84L250 62H256L238 84Z" />
                  <path className="seam" d="M148 90V120M208 88V122" />
                  <rect className="handle" x="184" y="97" width="14" height="3" rx="1.5" />
                  <rect className="handle" x="244" y="97" width="14" height="3" rx="1.5" />
                  <rect className="tail" x="36" y="100" width="6" height="12" rx="2" clipPath="url(#car-clip)" />
                  <path className="lamp" d="M366 101Q384 103 388 111V115L370 112Z" />
                  {/* Wheel arches, cut to the body outline */}
                  <g clipPath="url(#car-clip)">
                    <circle className="well" cx="108" cy="124" r="29" />
                    <circle className="well" cx="312" cy="124" r="29" />
                  </g>
                </g>

                {/* Rear wheel */}
                <g transform="translate(108 124)">
                  <g className="spin">
                    <circle className="tire" r="24" />
                    <circle className="tread" r="20.5" />
                    <circle className="rim" r="15" />
                    <path className="spk" d="M0 0V-13M0 0L12.4-4M0 0L7.6 10.5M0 0L-7.6 10.5M0 0L-12.4-4" />
                    <circle className="cap" r="4" />
                    <circle className="mark" cx="6.5" cy="-8.9" r="1.8" />
                  </g>
                </g>

                {/* Front wheel */}
                <g transform="translate(312 124)">
                  <g className="spin">
                    <circle className="tire" r="24" />
                    <circle className="tread" r="20.5" />
                    <circle className="rim" r="15" />
                    <path className="spk" d="M0 0V-13M0 0L12.4-4M0 0L7.6 10.5M0 0L-7.6 10.5M0 0L-12.4-4" />
                    <circle className="cap" r="4" />
                    <circle className="mark" cx="6.5" cy="-8.9" r="1.8" />
                  </g>
                </g>
              </svg>
            ) : (
              <svg key="bike" className="moto" viewBox="0 0 460 170" role="img" aria-labelledby="moto-title">
                <title id="moto-title">Animated motorcycle riding to the right</title>
                <defs>
                  <linearGradient id="moto-beam" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" className="s0" />
                    <stop offset="1" className="s1" />
                  </linearGradient>
                </defs>

                {/* Road */}
                <line className="ground" x1="0" y1="148" x2="460" y2="148" />
                <line className="dash" x1="-50" y1="160" x2="510" y2="160" />

                {/* Headlight beam */}
                <path className="beam" fill="url(#moto-beam)" d="M312 66L452 44V104L312 74Z" />

                {/* Speed streaks behind the bike */}
                <g>
                  <path className="streak" d="M30 92H52" />
                  <path className="streak" style={{ animationDelay: '-.2s' }} d="M30 104H52" />
                  <path className="streak" style={{ animationDelay: '-.4s' }} d="M30 116H52" />
                </g>

                {/* Rear wheel */}
                <g transform="translate(112 118)">
                  <g className="spin">
                    <circle className="tire" r="26" />
                    <circle className="tread" r="26" />
                    <circle className="rimring" r="21" />
                    <path className="spk" d="M0 0V-21M0 0L10.5-18.2M0 0L18.2-10.5M0 0H21M0 0L18.2 10.5M0 0L10.5 18.2M0 0V21M0 0L-10.5 18.2M0 0L-18.2 10.5M0 0H-21M0 0L-18.2-10.5M0 0L-10.5-18.2" />
                    <circle className="hub" r="5" />
                    <circle className="mark" cx="4.5" cy="-16.9" r="1.8" />
                  </g>
                </g>

                {/* Front wheel (with brake disc) */}
                <g transform="translate(344 118)">
                  <g className="spin">
                    <circle className="tire" r="26" />
                    <circle className="tread" r="26" />
                    <circle className="rimring" r="21" />
                    <path className="spk" d="M0 0V-21M0 0L10.5-18.2M0 0L18.2-10.5M0 0H21M0 0L18.2 10.5M0 0L10.5 18.2M0 0V21M0 0L-10.5 18.2M0 0L-18.2 10.5M0 0H-21M0 0L-18.2-10.5M0 0L-10.5-18.2" />
                    <circle className="disc" r="11" />
                    <circle className="hub" r="5" />
                    <circle className="mark" cx="4.5" cy="-16.9" r="1.8" />
                  </g>
                </g>

                {/* Exhaust smoke */}
                <g transform="translate(90 126)"><circle className="puff" r="3.5" /></g>
                <g transform="translate(90 126)"><circle className="puff" style={{ animationDelay: '-.3s' }} r="3.5" /></g>
                <g transform="translate(90 126)"><circle className="puff" style={{ animationDelay: '-.6s' }} r="3.5" /></g>

                {/* Bike (bobs on the suspension) */}
                <g className="bob">
                  {/* swingarm and rear shock */}
                  <path className="metal" style={{ strokeWidth: 5 }} d="M112 118L196 112" />
                  <path className="metal" style={{ strokeWidth: 3 }} d="M170 92L154 114" />

                  {/* engine */}
                  <g className="vib">
                    <path className="engine" d="M176 106L240 98L256 112L250 132L184 134Z" />
                    <path className="engine" d="M206 99L244 93L252 104L214 108Z" />
                    <path className="fin" d="M190 114L246 110M190 121L249 118M188 128L250 126" />
                  </g>

                  {/* down tube, tank, seat, tail */}
                  <path className="metal" style={{ strokeWidth: 4 }} d="M286 82L252 108" />
                  <path className="body" d="M200 86Q204 66 238 64L274 68Q290 72 284 84L210 94Z" />
                  <path className="hl" d="M212 77Q236 70 270 74" />
                  <path className="seat" d="M118 86Q150 80 200 86L206 94L128 98Q114 96 118 86Z" />
                  <path className="shade" d="M106 88L122 83L128 92L110 98Z" />
                  <circle className="tail" cx="108" cy="92" r="3.2" />

                  {/* front fork, bars, mirror, lamp, fender */}
                  <path className="metal" style={{ strokeWidth: 5 }} d="M288 74L344 118" />
                  <path className="stan" d="M288 74L316 96" />
                  <path className="metal" style={{ strokeWidth: 4 }} d="M290 70L284 58L270 56" />
                  <path className="grip" d="M270 56L261 55" />
                  <path className="metal" style={{ strokeWidth: 2 }} d="M285 59L292 48" />
                  <ellipse className="shade" cx="293" cy="46" rx="4.5" ry="3" />
                  <path className="fender" d="M316 90Q344 74 372 92" />
                  <ellipse className="lamp" cx="304" cy="68" rx="7" ry="9" />

                  {/* exhaust */}
                  <path className="pipe" d="M246 126Q236 140 206 138L150 134L96 126" />
                  <path className="pipehl" transform="translate(0 -2)" d="M246 126Q236 140 206 138L150 134L96 126" />
                </g>
              </svg>
            )}
            <div>
              <h3>{vehicle === 'car' ? 'Cars & SUVs' : 'Boda & sport bikes'}</h3>
              <p className="fm-muted">{vehicle === 'car' ? 'Track litres per 100 km, service intervals and trip costs across the family fleet.' : 'Track small-tank fill-ups, daily stage distances and maintenance built for high mileage.'}</p>
              <p className="fm-stat"><strong className="fm-tnum">{vehicle === 'car' ? '7.8 L/100 km' : '3.1 L/100 km'}</strong><span>Sample fleet average</span></p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="fm-section" id="packages" aria-labelledby="packages-title">
        <div className="fm-wrap">
          <Reveal>
            <p className="fm-eyebrow">Packages</p>
            <h2 id="packages-title">One package per workspace — the plan is the ceiling.</h2>
            <p className="fm-muted">Pick a personal package for yourself, or a team package when you register an organization. {plansLoading ? 'Loading live packages…' : 'Live from the server — the same packages you choose at sign-up.'}</p>
          </Reveal>
          <div className="fm-packages" role="list">
            {plansLoading && (
              <Reveal as="article" className="fm-card fm-package" aria-label="Loading packages">
                <div className="fm-package-top"><h3>Loading packages…</h3></div>
                <p className="fm-muted">Fetching the latest packages from the server.</p>
              </Reveal>
            )}
            {!plansLoading && liveGroups.map((group) => (
              <div key={group.heading} className="fm-package-group" role="list">
                <p className="fm-package-group-heading">{group.heading}</p>
                {group.plans.map((plan) => {
                  const popular = plan.key === 'personal-pro' || plan.key === 'group'
                  const accountType = plan.kind === 'personal' ? 'personal' : 'organization'
                  return (
                    <Reveal as="article" key={plan.key || plan.id} className={`fm-card fm-card--lift fm-package${popular ? ' fm-package--hot' : ''}`}>
                      <div className="fm-package-top">
                        <h3>{plan.name}</h3>
                        {popular && <span className="fm-badge fm-badge--accent">Popular</span>}
                      </div>
                      <p className="fm-muted">{plan.description}</p>
                      <ul>
                        <li>{formatLimit(plan.limits?.vehicles)} {Number(plan.limits?.vehicles) === 1 ? 'vehicle' : 'vehicles'} · {formatLimit(plan.limits?.members)} {Number(plan.limits?.members) === 1 ? 'member' : 'members'}</li>
                        {highlightFeatures(plan).map((item) => <li key={item}>{item}</li>)}
                      </ul>
                      <Link className={`fm-btn ${popular ? 'fm-btn--primary' : 'fm-btn--ghost'}`} to={`/register?account=${accountType}&plan=${encodeURIComponent(plan.id)}`}>Start with {plan.name}</Link>
                    </Reveal>
                  )
                })}
              </div>
            ))}
            {!plansLoading && liveGroups.length === 0 && FALLBACK_PACKAGES.map(({ key, title, text, items }, i) => (
              <Reveal as="article" key={key} className={`fm-card fm-card--lift fm-package${i === 1 ? ' fm-package--hot' : ''}`}>
                <div className="fm-package-top"><h3>{title}</h3>{i === 1 && <span className="fm-badge fm-badge--accent">Popular</span>}</div>
                <p className="fm-muted">{text}</p>
                <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
                <Link className={`fm-btn ${i === 1 ? 'fm-btn--primary' : 'fm-btn--ghost'}`} to="/register">Start with {title}</Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="fm-section fm-section--alt" id="faq" aria-labelledby="faq-title">
        <div className="fm-wrap fm-wrap--narrow">
          <Reveal>
            <p className="fm-eyebrow">FAQ</p>
            <h2 id="faq-title">Questions, answered.</h2>
          </Reveal>
          <div className="fm-faq">
            {[['Does it work offline?', 'Yes. The app shell loads from cache, records save on-device first (Dexie on web, SQLite on mobile), and everything syncs when you are back online. Sign-in needs the network the first time.'], ['Do I need an OBD-II adapter?', 'No. Telemetry lights up when you connect one; fuel, trips and maintenance work fully without hardware.'], ['Cars and motorcycles?', 'Both. Fuel in litres, distances in km, consumption in L/100 km and UGX costs work for any vehicle with an odometer.'], ['How do packages work?', 'Every workspace has one package: personal packages for individuals (Personal, Personal Pro), team packages for groups and organizations (Group, Enterprise). The package sets vehicle and member limits; roles decide what each person can do.'], ['Is my data private?', 'Every API call needs JWT auth and is scoped to you — clients never supply an owner id.']].map(([q, a]) => (
              <details key={q} className="fm-card"><summary>{q}</summary><p className="fm-muted">{a}</p></details>
            ))}
          </div>
        </div>
      </section>

      <section className="fm-cta fm-map-grid" id="contact" aria-labelledby="cta-title">
        <Reveal className="fm-wrap fm-cta-inner">
          <p className="fm-eyebrow">Ready when you are</p>
          <h2 id="cta-title">Stop guessing. Start tracking every litre.</h2>
          <p className="fm-lede">Create a free account and log your first fill-up in minutes.</p>
          <div className="fm-hero-cta">
            <Link className="fm-btn fm-btn--primary" to="/register">Create your free account</Link>
            <Link className="fm-btn fm-btn--ghost" to="/login">Sign in</Link>
          </div>
          <p className="fm-muted">Contact: hello@{APP_NAME.toLowerCase()}.app · Free to start · Works offline</p>
        </Reveal>
      </section>

      <footer className="fm-footer">
        <div className="fm-wrap fm-footer-grid">
          <div>
            <Link to="#top" className="fm-brand"><span className="fm-brand-name">{APP_NAME}</span></Link>
            <p className="fm-muted">{APP_DESCRIPTION}</p>
          </div>
          <nav aria-label="Product"><h3>Product</h3><ul><li><a href="#features">Features</a></li><li><a href="#how-it-works">How it works</a></li><li><a href="#offline">Offline</a></li><li><a href="#packages">Packages</a></li></ul></nav>
          <nav aria-label="Account"><h3>Account</h3><ul><li><Link to="/register">Create account</Link></li><li><Link to="/login">Sign in</Link></li><li><Link to="/dashboard">Open dashboard</Link></li></ul></nav>
        </div>
        <div className="fm-wrap fm-footer-base">
          <p>{APP_NAME} · Sample data is labelled wherever shown.</p>
          <p>© 2026 {APP_NAME}. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
