import { Link } from 'react-router-dom'
import { useState } from 'react'
import { APP_NAME, APP_DESCRIPTION } from '../config/brand'
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

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [vehicle, setVehicle] = useState('car')
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
              <svg key="car" className="fm-veh-art" viewBox="0 0 360 150" role="img" aria-label="Side-view illustration of a modern car with tinted windows, alloy wheels, headlight and taillight">
                <g className="fm-veh-bob">
                  <ellipse className="fm-veh-shadow" cx="184" cy="137" rx="152" ry="6" />
                  <path className="fm-veh-body" d="M36 106 Q36 86 60 82 L96 58 Q102 54 110 54 L214 54 Q222 54 228 60 L258 82 L302 90 Q324 94 332 102 L334 106 Z" />
                  <path className="fm-veh-glass" d="M116 60 L206 60 L216 82 L126 82 Z" />
                  <path className="fm-veh-detail" d="M162 60 L168 82" />
                  <path className="fm-veh-detail" d="M132 66 L152 78 M142 64 L162 76" />
                  <path className="fm-veh-detail" d="M126 84 L120 106 M216 84 L216 106" />
                  <path className="fm-veh-detail" d="M150 92 L164 92" />
                  <path className="fm-veh-detail" d="M62 98 L300 96" />
                  <path className="fm-veh-body" d="M214 68 L226 64 L226 73 Z" />
                  <path className="fm-veh-light-front fm-veh-glow" d="M316 92 L332 96 L330 102 L314 98 Z" />
                  <path className="fm-veh-light-rear" d="M38 88 L52 89 L51 96 L38 95 Z" />
                  <g>
                    <circle className="fm-veh-tire" cx="278" cy="108" r="26" />
                    <circle className="fm-veh-disc" cx="278" cy="108" r="15" />
                    <g className="fm-veh-spin"><path className="fm-veh-spokes" d="M278 96 L278 120 M266 108 L290 108 M270 100 L286 116 M286 100 L270 116" /></g>
                    <circle className="fm-veh-rim" cx="278" cy="108" r="15" />
                    <circle className="fm-veh-hub" cx="278" cy="108" r="3.6" />
                  </g>
                  <g>
                    <circle className="fm-veh-tire" cx="92" cy="108" r="26" />
                    <circle className="fm-veh-disc" cx="92" cy="108" r="15" />
                    <g className="fm-veh-spin"><path className="fm-veh-spokes" d="M92 96 L92 120 M80 108 L104 108 M82 100 L102 116 M102 100 L82 116" /></g>
                    <circle className="fm-veh-rim" cx="92" cy="108" r="15" />
                    <circle className="fm-veh-hub" cx="92" cy="108" r="3.6" />
                  </g>
                </g>
              </svg>
            ) : (
              <svg key="bike" className="fm-veh-art" viewBox="0 0 360 150" role="img" aria-label="Side-view illustration of a sport motorcycle with spoked wheels, fuel tank, engine block and exhaust">
                <g className="fm-veh-bob">
                  <ellipse className="fm-veh-shadow" cx="180" cy="136" rx="150" ry="6" />
                  <g>
                    <circle className="fm-veh-tire" cx="86" cy="102" r="29" />
                    <circle className="fm-veh-disc" cx="86" cy="102" r="17" />
                    <g className="fm-veh-spin"><path className="fm-veh-spokes" d="M86 86 L86 118 M70 102 L102 102 M74 90 L98 114 M98 90 L74 114" /></g>
                    <circle className="fm-veh-rim" cx="86" cy="102" r="17" />
                    <circle className="fm-veh-hub" cx="86" cy="102" r="3.6" />
                  </g>
                  <g>
                    <circle className="fm-veh-tire" cx="256" cy="102" r="29" />
                    <circle className="fm-veh-disc" cx="256" cy="102" r="17" />
                    <g className="fm-veh-spin"><path className="fm-veh-spokes" d="M256 86 L256 118 M240 102 L272 102 M244 90 L268 114 M268 90 L244 114" /></g>
                    <circle className="fm-veh-rim" cx="256" cy="102" r="17" />
                    <circle className="fm-veh-hub" cx="256" cy="102" r="3.6" />
                  </g>
                  <path className="fm-veh-body" d="M256 102 L228 76 L196 66 L172 66" />
                  <path className="fm-veh-detail" d="M172 70 L120 74 M120 74 L86 96" />
                  <path className="fm-veh-detail" d="M228 78 L214 92 M214 92 L176 96" />
                  <path className="fm-veh-body" d="M150 78 C144 62 160 52 180 52 C200 52 210 64 205 78 Z" />
                  <path className="fm-veh-glass" d="M156 70 C158 62 168 58 178 58 C186 58 192 62 194 70 Z" />
                  <path className="fm-veh-body" d="M204 76 L232 80 C238 81 242 78 242 72 C242 66 236 64 230 66 L206 68 Z" />
                  <path className="fm-veh-body" d="M172 66 C182 62 200 62 210 68 L214 74 L168 74 Z" />
                  <path className="fm-veh-detail" d="M150 82 L172 90 M172 86 L172 96" />
                  <path className="fm-veh-body" d="M168 78 L146 82 L150 92 L172 90 Z" />
                  <path className="fm-veh-detail" d="M150 84 L166 87 M152 88 L168 90" />
                  <path className="fm-veh-body" d="M244 58 L262 50 L272 52 L268 66 L250 66 Z" />
                  <path className="fm-veh-glass" d="M248 60 L262 54 L266 62 L250 64 Z" />
                  <path className="fm-veh-body" d="M248 52 L274 44 M266 44 L280 40" />
                  <path className="fm-veh-light-front fm-veh-glow" d="M240 66 L252 64 L252 74 L242 74 Z" />
                  <path className="fm-veh-detail" d="M188 80 C160 84 120 86 92 84" />
                  <path className="fm-veh-light-rear" d="M84 92 L94 92 L94 100 L84 100 Z" />
                  <path className="fm-veh-detail" d="M96 84 L92 72 L108 82" />
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
            <p className="fm-eyebrow">Access</p>
            <h2 id="packages-title">Features unlock through organization packages.</h2>
            <p className="fm-muted">Contact us for fleet pricing — packages grant dashboard features per organization while subscriptions stay active.</p>
          </Reveal>
          <div className="fm-grid fm-grid--3">
            {[['Essentials', 'Core tracking for owners.', ['Vehicle records', 'Fuel & trip tracking', 'Maintenance history']], ['Fleet', 'Shared visibility for teams.', ['Everything in Essentials', 'Organization roles', 'Package-based access']], ['Scale', 'For growing operations.', ['Time-limited subscriptions', 'Central access', 'Expanding fleets']]].map(([title, text, items], i) => (
              <Reveal as="article" key={title} delay={i % 3} className={`fm-card fm-card--lift fm-package${i === 1 ? ' fm-package--hot' : ''}`}>
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
            {[['Does it work offline?', 'Yes. The app shell loads from cache, records save on-device first (Dexie on web, SQLite on mobile), and everything syncs when you are back online. Sign-in needs the network the first time.'], ['Do I need an OBD-II adapter?', 'No. Telemetry lights up when you connect one; fuel, trips and maintenance work fully without hardware.'], ['Cars and motorcycles?', 'Both. Fuel in litres, distances in km, consumption in L/100 km and UGX costs work for any vehicle with an odometer.'], ['How do teams work?', 'Organizations group vehicles and members with roles from owner to viewer; packages unlock features per organization.'], ['Is my data private?', 'Every API call needs JWT auth and is scoped to you — clients never supply an owner id.']].map(([q, a]) => (
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
