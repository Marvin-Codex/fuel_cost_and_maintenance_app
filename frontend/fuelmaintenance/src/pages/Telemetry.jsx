import './Telemetry.css'

const liveReadings = [
  { label: 'ENGINE RPM', value: '--', unit: 'rpm', note: 'Engine speed' },
  { label: 'VEHICLE SPEED', value: '--', unit: 'km/h', note: 'Current speed' },
  { label: 'ENGINE LOAD', value: '--', unit: '%', note: 'Calculated load' },
  { label: 'COOLANT TEMP', value: '--', unit: '°C', note: 'Engine coolant' },
  { label: 'INTAKE TEMP', value: '--', unit: '°C', note: 'Intake air' },
]

const alertRules = [
  { title: 'Engine overheating', detail: 'Alert when coolant temperature exceeds your limit.' },
  { title: 'Low battery voltage', detail: 'Alert when battery voltage falls below your limit.' },
  { title: 'Abnormal engine readings', detail: 'Watch for readings outside your configured ranges.' },
  { title: 'New diagnostic fault codes', detail: 'Show a warning when a new DTC is detected.' },
]

function EmptyState({ children }) {
  return <p className="telemetry-empty">{children}</p>
}

export default function Telemetry({ onBack }) {
  return (
    <section className="telemetry-view" aria-labelledby="telemetry-title">
      <div className="telemetry-view-heading">
        <button className="telemetry-back" type="button" onClick={onBack} aria-label="Back to dashboard" title="Back to dashboard">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6M9 12h12" />
          </svg>
        </button>
        <div>
          <p className="telemetry-eyebrow">VEHICLE MONITORING</p>
          <h2 id="telemetry-title">Live telemetry</h2>
        </div>
      </div>

      <div className="telemetry-connection" role="status">
        <span className="connection-dot" />
        <div>
          <strong>OBD-II adapter not connected</strong>
          <p>Live readings will appear here when a vehicle adapter is connected.</p>
        </div>
        <span className="connection-badge">OFFLINE</span>
      </div>

      <section className="telemetry-section" aria-labelledby="live-readings-title">
        <div className="telemetry-section-heading">
          <div>
            <p className="telemetry-eyebrow">LIVE ENGINE MONITORING</p>
            <h3 id="live-readings-title">Operating conditions</h3>
          </div>
          <span className="telemetry-unavailable">Waiting for vehicle data</span>
        </div>
        <div className="reading-grid">
          {liveReadings.map((reading) => (
            <article className="reading-card" key={reading.label}>
              <span>{reading.label}</span>
              <strong>{reading.value}<small>{reading.unit}</small></strong>
              <p>{reading.note}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="telemetry-section" aria-labelledby="engine-health-title">
        <div className="telemetry-section-heading">
          <div>
            <p className="telemetry-eyebrow">ENGINE HEALTH</p>
            <h3 id="engine-health-title">Diagnostics &amp; sensors</h3>
          </div>
          <span className="health-state">Not yet scanned</span>
        </div>
        <div className="health-grid">
          <article className="telemetry-card">
            <span className="telemetry-card-label">CHECK-ENGINE STATUS</span>
            <strong className="pending-value">Awaiting scan</strong>
            <p>Connect an OBD-II adapter to read the warning lamp status.</p>
          </article>
          <article className="telemetry-card">
            <span className="telemetry-card-label">DIAGNOSTIC TROUBLE CODES</span>
            <strong className="pending-value">-- DTCs</strong>
            <p>Stored and pending engine fault codes will be listed here.</p>
          </article>
          <article className="telemetry-card sensor-card">
            <span className="telemetry-card-label">SENSOR READINGS</span>
            <EmptyState>Sensor data will be available after connection.</EmptyState>
          </article>
        </div>
      </section>

      <section className="telemetry-section" aria-labelledby="driving-title">
        <div className="telemetry-section-heading">
          <div>
            <p className="telemetry-eyebrow">DRIVING BEHAVIOUR</p>
            <h3 id="driving-title">Your driving patterns</h3>
          </div>
        </div>
        <div className="behaviour-grid">
          <article className="telemetry-card behaviour-score">
            <span className="telemetry-card-label">ECO-DRIVING SCORE</span>
            <strong>--<small>/100</small></strong>
            <p>Based on acceleration, braking, idling and fuel use.</p>
          </article>
          <div className="behaviour-stats">
            <article><span>AVG. SPEED</span><strong>-- <small>km/h</small></strong></article>
            <article><span>MAX. SPEED</span><strong>-- <small>km/h</small></strong></article>
            <article><span>IDLE TIME</span><strong>--</strong></article>
            <article><span>FUEL TREND</span><strong>--</strong></article>
          </div>
        </div>
        <div className="driving-events">
          <span>ACCELERATION</span><span>BRAKING</span><span>IDLING</span>
          <p>Driving events will be summarized after trip data is available.</p>
        </div>
      </section>

      <section className="telemetry-section" aria-labelledby="alerts-title">
        <div className="telemetry-section-heading">
          <div>
            <p className="telemetry-eyebrow">EARLY WARNING</p>
            <h3 id="alerts-title">Alert monitoring</h3>
          </div>
          <span className="telemetry-unavailable">No live alerts</span>
        </div>
        <div className="alert-rule-list">
          {alertRules.map((rule) => (
            <article className="alert-rule" key={rule.title}>
              <span className="rule-indicator" />
              <div><strong>{rule.title}</strong><p>{rule.detail}</p></div>
              <span className="rule-state">Awaiting data</span>
            </article>
          ))}
        </div>
        <p className="alert-footnote">
          Alert thresholds can be configured once live vehicle readings are connected.
        </p>
      </section>

      <section className="telemetry-section" aria-labelledby="trip-telemetry-title">
        <div className="telemetry-section-heading">
          <div>
            <p className="telemetry-eyebrow">TRIP TELEMETRY</p>
            <h3 id="trip-telemetry-title">Trip performance</h3>
          </div>
          <button className="compare-button" type="button" disabled>
            Compare trips
          </button>
        </div>
        <div className="trip-summary-grid">
          <article><span>DURATION</span><strong>--</strong></article>
          <article><span>DISTANCE</span><strong>-- km</strong></article>
          <article><span>AVG. SPEED</span><strong>-- km/h</strong></article>
          <article><span>FUEL USED</span><strong>-- L</strong></article>
          <article><span>MAX. RPM</span><strong>-- rpm</strong></article>
        </div>
        <EmptyState>Trip history and comparisons will appear after trips have been recorded.</EmptyState>
      </section>
    </section>
  )
}
