import { useEffect, useState } from 'react'
import {
  createVehicle,
  deleteVehicle,
  downloadDataExport,
  fetchPreferences,
  updatePreferences,
  updateVehicle,
} from '../api/resources'
import './System.css'

const ALERT_FIELDS = [
  { id: 'low_fuel', label: 'Low fuel' },
  { id: 'engine_overheating', label: 'Engine overheating' },
  { id: 'low_battery', label: 'Low battery' },
  { id: 'service_due', label: 'Service due' },
  { id: 'fault_codes', label: 'Fault codes' },
  { id: 'overspeed', label: 'Overspeed' },
  { id: 'high_fuel_consumption', label: 'High fuel consumption' },
]

const DEFAULT_THRESHOLDS = { low_fuel_percent: 20, engine_temperature_c: 105, overspeed_kmh: 100 }

function vehicleDraftFrom(vehicle = null) {
  return {
    name: vehicle?.name ?? '',
    make: vehicle?.make ?? '',
    model: vehicle?.model ?? '',
    year: vehicle?.year ?? '',
    license_plate: vehicle?.registration ?? vehicle?.license_plate ?? '',
    vin: vehicle?.vin ?? '',
    color: vehicle?.color ?? '',
    body_type: vehicle?.body_type ?? '',
    doors: vehicle?.doors ?? '',
    seats: vehicle?.seats ?? '',
    engine_capacity_cc: vehicle?.engine_capacity_cc ?? '',
    cylinders: vehicle?.cylinders ?? '',
    fuel_type: vehicle?.fuel_type ?? 'petrol',
    transmission: vehicle?.transmission ?? 'automatic',
    drive_type: vehicle?.drive_type ?? '',
    power_hp: vehicle?.power_hp ?? '',
    power_kw: vehicle?.power_kw ?? '',
    torque_nm: vehicle?.torque_nm ?? '',
    top_speed_kmh: vehicle?.top_speed_kmh ?? '',
    curb_weight_kg: vehicle?.curb_weight_kg ?? '',
    gross_weight_kg: vehicle?.gross_weight_kg ?? '',
    tank_capacity_liters: vehicle?.tank_capacity_liters ?? '',
    combined_fuel_consumption_l_100km: vehicle?.combined_fuel_consumption_l_100km ?? '',
    city_fuel_consumption_l_100km: vehicle?.city_fuel_consumption_l_100km ?? '',
    highway_fuel_consumption_l_100km: vehicle?.highway_fuel_consumption_l_100km ?? '',
    battery_capacity_kwh: vehicle?.battery_capacity_kwh ?? '',
    electric_range_km: vehicle?.electric_range_km ?? '',
    odometer_km: vehicle?.odometer ?? vehicle?.odometer_km ?? 0,
    status: vehicle?.status ?? 'simulation',
  }
}

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

export default function System({ onBack, vehicle, access, onVehiclesChanged }) {
  const [preferences, setPreferences] = useState(null)
  const [prefsLoading, setPrefsLoading] = useState(true)
  const [prefsError, setPrefsError] = useState(null)
  const [vehicleDraft, setVehicleDraft] = useState(() => vehicleDraftFrom(vehicle))
  const [editingVehicle, setEditingVehicle] = useState(false)
  const [creatingVehicle, setCreatingVehicle] = useState(false)
  const [vehicleSaving, setVehicleSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [aboutDocument, setAboutDocument] = useState('')

  const canEditVehicle = Boolean(access?.can('vehicles.edit'))
  const canAddVehicle = Boolean(access?.can('vehicles.add'))
  const canDeleteVehicle = Boolean(access?.can('vehicles.delete'))
  const canExport = Boolean(access?.can('analytics.export'))

  useEffect(() => {
    setVehicleDraft(vehicleDraftFrom(vehicle))
    setCreatingVehicle(false)
    setEditingVehicle(false)
  }, [vehicle])

  useEffect(() => {
    let mounted = true
    setPrefsLoading(true)
    fetchPreferences()
      .then((prefs) => {
        if (mounted) {
          setPreferences(prefs)
          setPrefsError(null)
        }
      })
      .catch((err) => {
        if (mounted) setPrefsError(err.message)
      })
      .finally(() => {
        if (mounted) setPrefsLoading(false)
      })
    return () => { mounted = false }
  }, [])

  function updateDraft(event) {
    setVehicleDraft((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function saveVehicle(event) {
    event.preventDefault()
    setVehicleSaving(true)
    setNotice('')
    try {
      const payload = {
        name: vehicleDraft.name.trim(),
        make: vehicleDraft.make.trim(),
        model: vehicleDraft.model.trim(),
        license_plate: vehicleDraft.license_plate.trim(),
        odometer_km: Number(vehicleDraft.odometer_km),
        vin: vehicleDraft.vin.trim(),
        color: vehicleDraft.color.trim(),
        body_type: vehicleDraft.body_type || '',
        doors: vehicleDraft.doors ? Number(vehicleDraft.doors) : null,
        seats: vehicleDraft.seats ? Number(vehicleDraft.seats) : null,
        engine_capacity_cc: vehicleDraft.engine_capacity_cc ? Number(vehicleDraft.engine_capacity_cc) : null,
        cylinders: vehicleDraft.cylinders ? Number(vehicleDraft.cylinders) : null,
        fuel_type: vehicleDraft.fuel_type,
        transmission: vehicleDraft.transmission,
        drive_type: vehicleDraft.drive_type || '',
        power_hp: vehicleDraft.power_hp ? Number(vehicleDraft.power_hp) : null,
        power_kw: vehicleDraft.power_kw ? Number(vehicleDraft.power_kw) : null,
        torque_nm: vehicleDraft.torque_nm ? Number(vehicleDraft.torque_nm) : null,
        top_speed_kmh: vehicleDraft.top_speed_kmh ? Number(vehicleDraft.top_speed_kmh) : null,
        curb_weight_kg: vehicleDraft.curb_weight_kg ? Number(vehicleDraft.curb_weight_kg) : null,
        gross_weight_kg: vehicleDraft.gross_weight_kg ? Number(vehicleDraft.gross_weight_kg) : null,
        tank_capacity_liters: vehicleDraft.tank_capacity_liters ? Number(vehicleDraft.tank_capacity_liters) : null,
        combined_fuel_consumption_l_100km: vehicleDraft.combined_fuel_consumption_l_100km ? Number(vehicleDraft.combined_fuel_consumption_l_100km) : null,
        city_fuel_consumption_l_100km: vehicleDraft.city_fuel_consumption_l_100km ? Number(vehicleDraft.city_fuel_consumption_l_100km) : null,
        highway_fuel_consumption_l_100km: vehicleDraft.highway_fuel_consumption_l_100km ? Number(vehicleDraft.highway_fuel_consumption_l_100km) : null,
        battery_capacity_kwh: vehicleDraft.battery_capacity_kwh ? Number(vehicleDraft.battery_capacity_kwh) : null,
        electric_range_km: vehicleDraft.electric_range_km ? Number(vehicleDraft.electric_range_km) : null,
        status: vehicleDraft.status,
      }
      if (String(vehicleDraft.year).trim()) payload.year = Number(vehicleDraft.year)
      if (vehicle?.rawId) {
        await updateVehicle(vehicle.rawId, payload)
      } else {
        await createVehicle(payload)
      }
      setEditingVehicle(false)
      setCreatingVehicle(false)
      setNotice(vehicle?.rawId ? 'Vehicle details saved to your workspace.' : 'Vehicle added to your workspace.')
      if (onVehiclesChanged) await onVehiclesChanged()
    } catch (err) {
      setNotice(err.message)
    } finally {
      setVehicleSaving(false)
    }
  }

  async function removeVehicle() {
    if (!vehicle?.rawId || !canDeleteVehicle) return
    if (!window.confirm('Delete this vehicle? Vehicles with saved records cannot be deleted.')) return
    setNotice('')
    try {
      await deleteVehicle(vehicle.rawId)
      setNotice('Vehicle deleted from your workspace.')
      if (onVehiclesChanged) await onVehiclesChanged()
    } catch (err) {
      setNotice(err.message)
    }
  }

  /** PATCH the workspace preferences; the server answer becomes the new state. */
  async function savePreferences(patch) {
    setPrefsError(null)
    try {
      const updated = await updatePreferences(patch)
      setPreferences(updated)
      return updated
    } catch (err) {
      setPrefsError(err.message)
      return null
    }
  }

  function toggleAlert(id) {
    const current = preferences?.alert_settings ?? {}
    savePreferences({ alert_settings: { ...current, [id]: !current[id] } })
  }

  function updateThreshold(event) {
    const { name, value } = event.target
    const current = preferences?.thresholds ?? DEFAULT_THRESHOLDS
    savePreferences({ thresholds: { ...current, [name]: Number(value) } })
  }

  function updateSetting(field, value) {
    savePreferences({ [field]: value })
  }

  function reloadPreferences() {
    setPrefsLoading(true)
    setPrefsError(null)
    fetchPreferences()
      .then((prefs) => {
        setPreferences(prefs)
        setPrefsError(null)
      })
      .catch((err) => {
        setPrefsError(err.message)
      })
      .finally(() => {
        setPrefsLoading(false)
      })
  }

  async function exportData() {
    setNotice('')
    try {
      await downloadDataExport()
      setNotice('Workspace data export downloaded as CSV.')
    } catch (err) {
      setNotice(err.message)
    }
  }

  const alerts = preferences?.alert_settings ?? {}
  const thresholds = { ...DEFAULT_THRESHOLDS, ...(preferences?.thresholds ?? {}) }

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
          <p className="system-vehicle">{vehicle ? `${vehicle.make} ${vehicle.model} · ${vehicle.registration}` : 'No vehicle selected'}</p>
        </div>
        <span className="system-live-badge"><StatusDot tone={prefsLoading ? 'warning' : 'good'} /> {prefsLoading ? 'LOADING' : 'SYNCED'}</span>
      </header>

      {notice && <p className="system-notice" role="status">{notice}</p>}
      {prefsError && <p className="system-notice error" role="alert">{prefsError}</p>}

      <section className="system-panel" aria-labelledby="vehicle-info-title">
        <SystemSectionHeading
          id="vehicle-info-title"
          eyebrow="YOUR VEHICLE"
          title="Vehicle information"
          action={
            <div className="vehicle-management-actions">
              {canEditVehicle && vehicle && !creatingVehicle && (
                <button
                  className="system-text-button"
                  type="button"
                  onClick={() => {
                    if (editingVehicle) setVehicleDraft(vehicleDraftFrom(vehicle))
                    setEditingVehicle((current) => !current)
                  }}
                >
                  {editingVehicle ? 'CANCEL' : 'EDIT VEHICLE'}
                </button>
              )}
              {canDeleteVehicle && vehicle && !editingVehicle && (
                <button className="system-text-button danger-button" type="button" onClick={removeVehicle}>
                  DELETE
                </button>
              )}
              {canAddVehicle && !editingVehicle && (
                <button
                  className="system-text-button"
                  type="button"
                  onClick={() => {
                    setVehicleDraft(vehicleDraftFrom())
                    setCreatingVehicle(true)
                    setEditingVehicle(true)
                  }}
                >
                  ADD VEHICLE
                </button>
              )}
            </div>
          }
        />
        {editingVehicle ? (
          <form className="vehicle-edit-form" onSubmit={saveVehicle}>
            {[
              ['name', 'Name'],
              ['make', 'Make'],
              ['model', 'Model'],
              ['year', 'Year'],
              ['license_plate', 'License plate'],
              ['vin', 'VIN'],
              ['color', 'Color'],
              ['doors', 'Doors'],
              ['seats', 'Seats'],
              ['engine_capacity_cc', 'Engine capacity (cc)'],
              ['cylinders', 'Cylinders'],
              ['tank_capacity_liters', 'Tank capacity (litres)'],
              ['odometer_km', 'Odometer (km)'],
              ['power_hp', 'Power (hp)'],
              ['power_kw', 'Power (kW)'],
              ['torque_nm', 'Torque (Nm)'],
              ['top_speed_kmh', 'Top speed (km/h)'],
              ['curb_weight_kg', 'Curb weight (kg)'],
              ['gross_weight_kg', 'Gross weight (kg)'],
              ['combined_fuel_consumption_l_100km', 'Combined (L/100 km)'],
              ['city_fuel_consumption_l_100km', 'City (L/100 km)'],
              ['highway_fuel_consumption_l_100km', 'Highway (L/100 km)'],
              ['battery_capacity_kwh', 'Battery (kWh)'],
              ['electric_range_km', 'Electric range (km)'],
            ].map(([name, label]) => (
              <label key={name}>
                {label}
                <input
                  name={name}
                  type={['year', 'doors', 'seats', 'engine_capacity_cc', 'cylinders', 'tank_capacity_liters', 'odometer_km', 'power_hp', 'power_kw', 'torque_nm', 'top_speed_kmh', 'curb_weight_kg', 'gross_weight_kg', 'combined_fuel_consumption_l_100km', 'city_fuel_consumption_l_100km', 'highway_fuel_consumption_l_100km', 'battery_capacity_kwh', 'electric_range_km'].includes(name) ? 'number' : 'text'}
                  min={name === 'year' ? '1900' : name === 'tank_capacity_liters' || name.includes('fuel_consumption') ? '0.01' : name === 'engine_capacity_cc' ? '1' : name === 'doors' || name === 'seats' ? '1' : name === 'cylinders' ? '1' : name === 'odometer_km' ? '0' : '0'}
                  max={name === 'year' ? '2100' : undefined}
                  step={name === 'tank_capacity_liters' || name.includes('fuel_consumption') || name === 'power_hp' || name === 'power_kw' || name === 'torque_nm' || name === 'top_speed_kmh' || name === 'curb_weight_kg' || name === 'gross_weight_kg' || name === 'battery_capacity_kwh' ? '0.01' : '1'}
                  value={vehicleDraft[name]}
                  onChange={updateDraft}
                  required={['make', 'model', 'year', 'license_plate'].includes(name)}
                />
              </label>
            ))}
            <label>Fuel type
              <select name="fuel_type" value={vehicleDraft.fuel_type} onChange={updateDraft}>
                {['petrol', 'diesel', 'electric', 'hybrid', 'lpg', 'cng', 'other'].map((value) => (
                  <option key={value} value={value}>{value.toUpperCase()}</option>
                ))}
              </select>
            </label>
            <label>Transmission
              <select name="transmission" value={vehicleDraft.transmission} onChange={updateDraft}>
                {['manual', 'automatic', 'cvt', 'dct', 'amt', 'other'].map((value) => (
                  <option key={value} value={value}>{value.toUpperCase()}</option>
                ))}
              </select>
            </label>
            <label>Drive type
              <select name="drive_type" value={vehicleDraft.drive_type} onChange={updateDraft}>
                <option value="">—</option>
                {['fwd', 'rwd', 'awd', '4wd', 'other'].map((value) => (
                  <option key={value} value={value}>{value.toUpperCase()}</option>
                ))}
              </select>
            </label>
            <label>Body type
              <select name="body_type" value={vehicleDraft.body_type} onChange={updateDraft}>
                <option value="">—</option>
                {['sedan', 'hatchback', 'suv', 'crossover', 'wagon', 'pickup', 'van', 'coupe', 'convertible', 'bus', 'other'].map((value) => (
                  <option key={value} value={value}>{value.replace(/_/g, ' ').toUpperCase()}</option>
                ))}
              </select>
            </label>
            <label>Vehicle status
              <select name="status" value={vehicleDraft.status} onChange={updateDraft}>
                <option value="simulation">Simulation</option>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="in_service">In service</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <button className="system-primary-button form-full" type="submit" disabled={vehicleSaving}>
              {vehicleSaving ? 'SAVING…' : creatingVehicle ? 'ADD VEHICLE' : 'SAVE VEHICLE'}
            </button>
          </form>
        ) : (
          <div className="vehicle-info-grid">
            {[
              ['Name', vehicle?.name ?? '—'],
              ['Make', vehicle?.make ?? '—'],
              ['Model', vehicle?.model ?? '—'],
              ['Year', vehicle?.year ?? '—'],
              ['Registration', vehicle?.registration ?? vehicle?.license_plate ?? '—'],
              ['VIN', vehicle?.vin ?? '—'],
              ['Color', vehicle?.color ?? '—'],
              ['Body type', vehicle?.body_type ? vehicle.body_type.replace(/_/g, ' ') : '—'],
              ['Doors', vehicle?.doors ?? '—'],
              ['Seats', vehicle?.seats ?? '—'],
              ['Engine capacity', vehicle?.engine_capacity_cc ? `${vehicle.engine_capacity_cc} cc` : '—'],
              ['Cylinders', vehicle?.cylinders ?? '—'],
              ['Fuel type', vehicle?.fuel_type ?? '—'],
              ['Transmission', vehicle?.transmission ?? '—'],
              ['Drive type', vehicle?.drive_type ? vehicle.drive_type.toUpperCase() : '—'],
              ['Power (hp)', vehicle?.power_hp ?? '—'],
              ['Power (kW)', vehicle?.power_kw ?? '—'],
              ['Torque (Nm)', vehicle?.torque_nm ?? '—'],
              ['Top speed (km/h)', vehicle?.top_speed_kmh ?? '—'],
              ['Curb weight (kg)', vehicle?.curb_weight_kg ?? '—'],
              ['Gross weight (kg)', vehicle?.gross_weight_kg ?? '—'],
              ['Tank capacity', vehicle?.tank_capacity_liters ? `${vehicle.tank_capacity_liters} L` : '—'],
              ['Combined consumption', vehicle?.combined_fuel_consumption_l_100km ? `${vehicle.combined_fuel_consumption_l_100km} L/100 km` : '—'],
              ['City consumption', vehicle?.city_fuel_consumption_l_100km ? `${vehicle.city_fuel_consumption_l_100km} L/100 km` : '—'],
              ['Highway consumption', vehicle?.highway_fuel_consumption_l_100km ? `${vehicle.highway_fuel_consumption_l_100km} L/100 km` : '—'],
              ['Battery capacity', vehicle?.battery_capacity_kwh ? `${vehicle.battery_capacity_kwh} kWh` : '—'],
              ['Electric range', vehicle?.electric_range_km ? `${vehicle.electric_range_km} km` : '—'],
              ['Odometer', vehicle?.odometer !== undefined && vehicle?.odometer !== null ? `${Number(vehicle.odometer).toLocaleString('en-UG')} km` : (vehicle?.odometer_km !== undefined && vehicle?.odometer_km !== null ? `${Number(vehicle.odometer_km).toLocaleString('en-UG')} km` : '—')],
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
            ['OBD-II adapter', 'Not connected', 'offline'],
            ['GPS tracking', 'Not connected', 'offline'],
            ['Telemetry stream', 'Not connected', 'offline'],
            ['Account sync', 'Online', 'good'],
          ].map(([label, state, tone]) => (
            <div className="connection-row" key={label}><span>{label}</span><strong><StatusDot tone={tone === 'offline' ? 'offline' : 'good'} /> {state}</strong></div>
          ))}
        </div>
        <p className="system-last-update">Live adapters are not part of this release — trips and fill-ups are recorded manually.</p>
      </section>

      {!access ? (
        <section className="system-panel" aria-labelledby="connect-settings-title">
          <SystemSectionHeading id="connect-settings-title" eyebrow="WORKSPACE" title="Connect your workspace" />
          <p className="system-empty">
            Settings are empty because the workspace connection could not be verified. Your account was signed in, but the app could not reach the server to load this workspace's data.
            <button type="button" className="dashboard-retry" onClick={() => (access?.refresh ? access.refresh() : undefined)}>Try again</button>
            {' '}— check that the backend is running at http://localhost:8000 and refresh the page.
          </p>
        </section>
      ) : prefsLoading ? (
        <section className="system-panel" aria-labelledby="prefs-loading-title">
          <p className="system-empty">Loading your workspace preferences…</p>
        </section>
      ) : prefsError ? (
        <section className="system-panel" aria-labelledby="prefs-error-title">
          <p className="system-notice error" role="alert">{prefsError} <button type="button" className="dashboard-retry" onClick={reloadPreferences}>Try again</button></p>
        </section>
      ) : preferences ? (
        <section className="system-panel" aria-labelledby="alert-settings-title">
          <SystemSectionHeading id="alert-settings-title" eyebrow="NOTIFICATION RULES" title="Alert settings" />
          <div className="system-alert-list">
            {ALERT_FIELDS.map(({ id, label }) => (
              <label className="system-toggle-row" key={id}>
                <span>{label}</span>
                <input type="checkbox" role="switch" checked={Boolean(alerts[id])} onChange={() => toggleAlert(id)} />
                <span className="system-toggle" aria-hidden="true" />
              </label>
            ))}
          </div>
          <div className="threshold-grid">
            <label>Low fuel threshold <span><input name="low_fuel_percent" type="number" min="1" max="100" value={thresholds.low_fuel_percent} onChange={updateThreshold} /> %</span></label>
            <label>Engine temperature <span><input name="engine_temperature_c" type="number" min="50" max="160" value={thresholds.engine_temperature_c} onChange={updateThreshold} /> °C</span></label>
            <label>Overspeed limit <span><input name="overspeed_kmh" type="number" min="20" max="300" value={thresholds.overspeed_kmh} onChange={updateThreshold} /> km/h</span></label>
          </div>
        </section>
      ) : (
        <section className="system-panel" aria-labelledby="alert-settings-title">
          <SystemSectionHeading id="alert-settings-title" eyebrow="NOTIFICATION RULES" title="Alert settings" />
          <div className="system-alert-list">
            {ALERT_FIELDS.map(({ id, label }) => (
              <label className="system-toggle-row" key={id}>
                <span>{label}</span>
                <input type="checkbox" role="switch" defaultChecked onChange={() => toggleAlert(id)} />
                <span className="system-toggle" aria-hidden="true" />
              </label>
            ))}
          </div>
          <div className="threshold-grid">
            <label>Low fuel threshold <span><input name="low_fuel_percent" type="number" min="1" max="100" value={thresholds.low_fuel_percent} onChange={updateThreshold} /> %</span></label>
            <label>Engine temperature <span><input name="engine_temperature_c" type="number" min="50" max="160" value={thresholds.engine_temperature_c} onChange={updateThreshold} /> °C</span></label>
            <label>Overspeed limit <span><input name="overspeed_kmh" type="number" min="20" max="300" value={thresholds.overspeed_kmh} onChange={updateThreshold} /> km/h</span></label>
          </div>
        </section>
      )}

      <section className="system-panel" aria-labelledby="data-management-title">
        <SystemSectionHeading id="data-management-title" eyebrow="YOUR DATA" title="Data management" />
        <p className="system-empty">Download every vehicle, fuel record, service and trip in this workspace as CSV.</p>
        <div className="system-actions-grid">
          {canExport ? (
            <button className="system-primary-button" type="button" onClick={exportData}>EXPORT DATA · CSV</button>
          ) : (
            <p className="system-empty form-full">Your role cannot export workspace data.</p>
          )}
        </div>
      </section>

      <section className="system-panel" aria-labelledby="app-settings-title">
        <SystemSectionHeading id="app-settings-title" eyebrow="PREFERENCES" title="App settings" />
        {prefsLoading ? (
          <p className="system-empty">Loading your workspace preferences…</p>
        ) : (
          <div className="app-settings-list">
            <label className="app-setting-row">Units
              <select value={preferences?.units ?? 'metric'} onChange={(event) => updateSetting('units', event.target.value)}>
                <option value="metric">Metric</option>
                <option value="imperial">Imperial</option>
              </select>
            </label>
            <label className="app-setting-row">Currency
              <select value={preferences?.currency ?? 'UGX'} onChange={(event) => updateSetting('currency', event.target.value)}>
                <option>UGX</option>
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
              </select>
            </label>
            <label className="app-setting-row">Language
              <select value={preferences?.language ?? 'en'} onChange={(event) => updateSetting('language', event.target.value)}>
                <option value="en">English</option>
                <option value="sw">Swahili</option>
              </select>
            </label>
            <label className="system-toggle-row">
              <span>Notifications</span>
              <input
                type="checkbox"
                role="switch"
                checked={preferences?.notifications_enabled !== false}
                onChange={(event) => updateSetting('notifications_enabled', event.target.checked)}
              />
              <span className="system-toggle" aria-hidden="true" />
            </label>
          </div>
        )}
      </section>

      <section className="system-panel about-panel" aria-labelledby="about-title">
        <SystemSectionHeading id="about-title" eyebrow="APPLICATION" title="About" />
        <div className="about-app-name">FuelMaintenance</div>
        <div className="about-meta"><span>Version</span><strong>1.0.0</strong></div>
        <p className="about-copyright">© 2026 FuelMaintenance</p>
        <div className="about-links">
          <button type="button" onClick={() => setAboutDocument((current) => current === 'privacy' ? '' : 'privacy')}>Privacy Policy</button>
          <button type="button" onClick={() => setAboutDocument((current) => current === 'terms' ? '' : 'terms')}>Terms of Service</button>
        </div>
        {aboutDocument && (
          <div className="about-document" role="region" aria-label={aboutDocument === 'privacy' ? 'Privacy policy' : 'Terms of service'}>
            {aboutDocument === 'privacy'
              ? 'Your vehicle, fuel, service and trip records stay inside your workspace. Exports are limited to members with the analytics.export permission.'
              : 'Record only journeys and vehicles you are authorised to track. Service and fuel entries should reflect real vehicle activity.'}
          </div>
        )}
      </section>
    </section>
  )
}
