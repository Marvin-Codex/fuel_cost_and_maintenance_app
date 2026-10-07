import { useState } from 'react'
import './System.css'

const initialVehicle = {
  make: 'Toyota',
  model: 'Premio',
  year: '2018',
  registration: 'UBA 123A',
  vin: '************4821',
  engine: '1.8L Petrol',
  transmission: 'Automatic',
  odometer: '42,580',
}

function vehicleDetails(vehicle) {
  if (!vehicle) return initialVehicle
  return {
    make: vehicle.make,
    model: vehicle.model,
    year: String(vehicle.year),
    registration: vehicle.registration,
    vin: `************${vehicle.vinSuffix}`,
    engine: vehicle.engine,
    transmission: vehicle.transmission,
    odometer: vehicle.odometer,
  }
}

const initialAlerts = [
  { id: 'lowFuel', label: 'Low fuel' },
  { id: 'overheating', label: 'Engine overheating' },
  { id: 'battery', label: 'Low battery' },
  { id: 'service', label: 'Service due' },
  { id: 'faultCodes', label: 'Fault codes' },
  { id: 'overspeed', label: 'Overspeed' },
  { id: 'consumption', label: 'High fuel consumption' },
]

const initialDiagnostics = [
  { name: 'Engine', detail: 'No fault codes detected' },
  { name: 'Transmission', detail: 'Operating normally' },
  { name: 'Battery', detail: 'Voltage within normal range' },
  { name: 'Cooling system', detail: 'Temperature within normal range' },
  { name: 'Sensors', detail: 'All simulated sensors responding' },
]

function StatusDot({ tone = 'good' }) {
  return <i className={`system-status-dot ${tone}`} aria-hidden="true" />
}

function SystemSectionHeading({ eyebrow, title, action, id }) {
  return (
    <div className="system-section-heading">
      <div>
        <p className="system-eyebrow">{eyebrow}</p>
        <h3 id={id}>{title}</h3>
      </div>
      {action}
    </div>
  )
}

export default function System({ onBack, vehicle: selectedVehicle }) {
  const selectedVehicleDetails = vehicleDetails(selectedVehicle)
  const [vehicle, setVehicle] = useState(selectedVehicleDetails)
  const [vehicleDraft, setVehicleDraft] = useState(selectedVehicleDetails)
  const [editingVehicle, setEditingVehicle] = useState(false)
  const [alerts, setAlerts] = useState(() => Object.fromEntries(initialAlerts.map(({ id }) => [id, true])))
  const [thresholds, setThresholds] = useState({ lowFuel: '20', temperature: '105', overspeed: '100' })
  const [diagnostics, setDiagnostics] = useState(initialDiagnostics)
  const [scanning, setScanning] = useState(false)
  const [diagnosticMessage, setDiagnosticMessage] = useState('')
  const [units, setUnits] = useState('Metric')
  const [currency, setCurrency] = useState('UGX')
  const [language, setLanguage] = useState('English')
  const [notifications, setNotifications] = useState(true)
  const [notice, setNotice] = useState('')
  const [aboutDocument, setAboutDocument] = useState('')

  function updateVehicle(event) {
    setVehicleDraft((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function saveVehicle(event) {
    event.preventDefault()
    setVehicle(vehicleDraft)
    setEditingVehicle(false)
    setNotice('Vehicle information updated for this session.')
  }

  function updateThreshold(event) {
    setThresholds((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function toggleAlert(id) {
    setAlerts((current) => ({ ...current, [id]: !current[id] }))
  }

  function runDiagnostic() {
    if (scanning) return
    setScanning(true)
    setDiagnosticMessage('Scanning simulated vehicle systems…')
    setDiagnostics(initialDiagnostics.map(({ name }) => ({ name, detail: 'Scanning…' })))
    window.setTimeout(() => {
      setDiagnostics(initialDiagnostics)
      setDiagnosticMessage('Diagnostic complete. No critical problems detected.')
      setScanning(false)
    }, 1300)
  }

  function downloadFile(filename, type, content) {
    const file = new Blob([content], { type })
    const url = URL.createObjectURL(file)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
  }

  function exportData() {
    const lines = [
      'category,record_count',
      'telemetry,12480',
      'trips,86',
      'services,24',
    ]
    downloadFile('vehicle-data-export.csv', 'text/csv;charset=utf-8', lines.join('\n'))
    setNotice('Sample data export downloaded as CSV.')
  }

  function backupData() {
    const backup = {
      vehicle,
      connections: { obd: 'Connected', gps: 'Active', telemetry: 'Receiving', internet: 'Connected' },
      alerts,
      thresholds,
      appSettings: { units, currency, language, notifications },
      exportedAt: new Date().toISOString(),
      note: 'Simulated sample data backup',
    }
    downloadFile('vehicle-system-backup.json', 'application/json', JSON.stringify(backup, null, 2))
    setNotice('Settings backup downloaded as JSON.')
  }

  function clearCache() {
    setNotice('Simulated cache-clear complete. No persisted records were changed.')
  }

  function resetSettings() {
    setAlerts(Object.fromEntries(initialAlerts.map(({ id }) => [id, true])))
    setThresholds({ lowFuel: '20', temperature: '105', overspeed: '100' })
    setUnits('Metric')
    setCurrency('UGX')
    setLanguage('English')
    setNotifications(true)
    setNotice('Alert and app preferences restored to their defaults.')
  }

  return (
    <section className="system-view" aria-labelledby="system-title">
      <header className="system-heading">
        <button className="system-back" type="button" onClick={onBack} aria-label="Back to dashboard" title="Back to dashboard">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6M9 12h12" />
          </svg>
        </button>
        <div>
          <p className="system-eyebrow">VEHICLE CONTROL CENTER</p>
          <h2 id="system-title">System</h2>
          <p className="system-vehicle">{vehicle.make} {vehicle.model} · {vehicle.registration}</p>
        </div>
        <span className="system-live-badge"><StatusDot /> SIMULATED</span>
      </header>

      {notice && <p className="system-notice" role="status">{notice}</p>}

      <section className="system-panel" aria-labelledby="vehicle-info-title">
        <SystemSectionHeading
          id="vehicle-info-title"
          eyebrow="YOUR VEHICLE"
          title="Vehicle information"
          action={
            <button
              className="system-text-button"
              type="button"
              onClick={() => {
                setVehicleDraft(vehicle)
                setEditingVehicle((current) => !current)
              }}
            >
              {editingVehicle ? 'CANCEL' : 'EDIT VEHICLE'}
            </button>
          }
        />
        {editingVehicle ? (
          <form className="vehicle-edit-form" onSubmit={saveVehicle}>
            {[
              ['make', 'Make'],
              ['model', 'Model'],
              ['year', 'Year'],
              ['registration', 'Registration'],
              ['vin', 'VIN'],
              ['engine', 'Engine'],
              ['transmission', 'Transmission'],
              ['odometer', 'Odometer (km)'],
            ].map(([name, label]) => (
              <label key={name}>
                {label}
                <input name={name} value={vehicleDraft[name]} onChange={updateVehicle} required />
              </label>
            ))}
            <button className="system-primary-button form-full" type="submit">SAVE VEHICLE</button>
          </form>
        ) : (
          <div className="vehicle-info-grid">
            {[
              ['Make', vehicle.make],
              ['Model', vehicle.model],
              ['Year', vehicle.year],
              ['Registration', vehicle.registration],
              ['VIN', vehicle.vin],
              ['Engine', vehicle.engine],
              ['Transmission', vehicle.transmission],
              ['Odometer', `${vehicle.odometer} km`],
            ].map(([label, value]) => (
              <div className="vehicle-info-item" key={label}><span>{label}</span><strong>{value}</strong></div>
            ))}
          </div>
        )}
      </section>

      <section className="system-panel" aria-labelledby="connection-title">
        <SystemSectionHeading id="connection-title" eyebrow="DEVICE STATUS" title="Connection" />
        <div className="connection-grid">
          {[
            ['OBD-II adapter', 'Connected'],
            ['GPS', 'Active'],
            ['Telemetry', 'Receiving'],
            ['Internet', 'Connected'],
          ].map(([label, state]) => (
            <div className="connection-row" key={label}><span>{label}</span><strong><StatusDot /> {state}</strong></div>
          ))}
        </div>
        <p className="system-last-update">Last update <strong>Just now</strong></p>
      </section>

      <section className="system-panel" aria-labelledby="diagnostics-title">
        <SystemSectionHeading
          id="diagnostics-title"
          eyebrow="SIMULATED OBD-II CHECK"
          title="Diagnostics"
          action={<span className={`diagnostic-state ${scanning ? 'scanning' : ''}`}><StatusDot tone={scanning ? 'warning' : 'good'} /> {scanning ? 'SCANNING' : 'READY'}</span>}
        />
        <div className="diagnostic-list">
          {diagnostics.map((item) => (
            <div className="diagnostic-row" key={item.name}>
              <span><StatusDot tone={scanning ? 'warning' : 'good'} /> {item.name}</span>
              <small>{item.detail}</small>
            </div>
          ))}
        </div>
        {diagnosticMessage && <p className="diagnostic-message" role="status">{diagnosticMessage}</p>}
        <button className="system-primary-button" type="button" onClick={runDiagnostic} disabled={scanning}>
          {scanning ? 'SCANNING SYSTEMS…' : 'RUN FULL DIAGNOSTIC'}
        </button>
      </section>

      <section className="system-panel" aria-labelledby="alert-settings-title">
        <SystemSectionHeading id="alert-settings-title" eyebrow="NOTIFICATION RULES" title="Alert settings" />
        <div className="system-alert-list">
          {initialAlerts.map(({ id, label }) => (
            <label className="system-toggle-row" key={id}>
              <span>{label}</span>
              <input type="checkbox" role="switch" checked={alerts[id]} onChange={() => toggleAlert(id)} />
              <span className="system-toggle" aria-hidden="true" />
            </label>
          ))}
        </div>
        <div className="threshold-grid">
          <label>Low fuel threshold <span><input name="lowFuel" type="number" min="1" max="100" value={thresholds.lowFuel} onChange={updateThreshold} /> %</span></label>
          <label>Engine temperature <span><input name="temperature" type="number" min="50" max="160" value={thresholds.temperature} onChange={updateThreshold} /> °C</span></label>
          <label>Overspeed limit <span><input name="overspeed" type="number" min="20" max="300" value={thresholds.overspeed} onChange={updateThreshold} /> km/h</span></label>
        </div>
      </section>

      <section className="system-panel" aria-labelledby="data-management-title">
        <SystemSectionHeading id="data-management-title" eyebrow="LOCAL SAMPLE DATA" title="Data management" />
        <div className="data-stat-grid">
          <div><span>Storage used</span><strong>248 MB</strong></div>
          <div><span>Telemetry records</span><strong>12,480</strong></div>
          <div><span>Trip records</span><strong>86</strong></div>
          <div><span>Service records</span><strong>24</strong></div>
        </div>
        <div className="system-actions-grid">
          <button className="system-primary-button" type="button" onClick={exportData}>EXPORT DATA · CSV</button>
          <button className="system-secondary-button" type="button" onClick={backupData}>BACKUP SETTINGS</button>
          <button className="system-secondary-button form-full" type="button" onClick={clearCache}>CLEAR TEMPORARY CACHE</button>
        </div>
      </section>

      <section className="system-panel" aria-labelledby="app-settings-title">
        <SystemSectionHeading id="app-settings-title" eyebrow="PREFERENCES" title="App settings" />
        <div className="app-settings-list">
          <div className="app-setting-row"><span>Dark mode</span><span className="locked-setting">ON · LOCKED</span></div>
          <label className="app-setting-row">Units<select value={units} onChange={(event) => setUnits(event.target.value)}><option>Metric</option><option>Imperial</option></select></label>
          <label className="app-setting-row">Currency<select value={currency} onChange={(event) => setCurrency(event.target.value)}><option>UGX</option><option>USD</option><option>EUR</option><option>GBP</option></select></label>
          <label className="app-setting-row">Language<select value={language} onChange={(event) => setLanguage(event.target.value)}><option>English</option><option>Swahili</option></select></label>
          <label className="system-toggle-row"><span>Notifications</span><input type="checkbox" role="switch" checked={notifications} onChange={() => setNotifications((current) => !current)} /><span className="system-toggle" aria-hidden="true" /></label>
        </div>
        <button className="system-secondary-button reset-settings-button" type="button" onClick={resetSettings}>RESET ALERTS &amp; PREFERENCES</button>
      </section>

      <section className="system-panel about-panel" aria-labelledby="about-title">
        <SystemSectionHeading id="about-title" eyebrow="APPLICATION" title="About" />
        <div className="about-app-name">Vehicle Smart Performance</div>
        <div className="about-meta"><span>Version</span><strong>1.0.0</strong></div>
        <div className="about-meta"><span>Telemetry Engine</span><strong>v1.0</strong></div>
        <p className="about-copyright">© 2026 Vehicle Smart Performance</p>
        <div className="about-links">
          <button type="button" onClick={() => setAboutDocument((current) => current === 'privacy' ? '' : 'privacy')}>Privacy Policy</button>
          <button type="button" onClick={() => setAboutDocument((current) => current === 'terms' ? '' : 'terms')}>Terms of Service</button>
        </div>
        {aboutDocument && (
          <div className="about-document" role="region" aria-label={aboutDocument === 'privacy' ? 'Privacy policy' : 'Terms of service'}>
            {aboutDocument === 'privacy'
              ? 'This simulated demo keeps your edits and preferences in the current session. It does not connect to or transmit vehicle, location, or diagnostic data.'
              : 'This demonstration uses simulated vehicle and diagnostic data. Do not rely on it for vehicle operation, repair decisions, or emergency assistance.'}
          </div>
        )}
        <p className="system-demo-note">Connection, diagnostics, and data figures are simulated. Settings and edits are kept for this session only.</p>
      </section>
    </section>
  )
}
