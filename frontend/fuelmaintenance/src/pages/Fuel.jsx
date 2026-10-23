import { useEffect, useMemo, useState } from 'react'
import {
  createFuelRecord,
  fetchFuelSummary,
  listFuelRecords,
  listTrips,
} from '../api/resources'
import './Fuel.css'

const PERIODS = {
  today: { label: 'Today', days: 1 },
  week: { label: '7 days', days: 7 },
  month: { label: '30 days', days: 30 },
}

function formatUgx(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  return `UGX ${Math.round(number).toLocaleString('en-UG')}`
}

function formatLiters(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  return `${number.toFixed(1)} L`
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function localDateTimeValue(date) {
  const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localTime.toISOString().slice(0, 16)
}

function tripConsumption(trip) {
  const liters = Number(trip.fuel_consumed_liters)
  const km = Number(trip.distance_km)
  if (Number.isFinite(liters) && Number.isFinite(km) && km > 0) return (liters / km) * 100
  return null
}

/** Consumption points (L/100 km) inside a rolling window ending now. */
function consumptionPoints(trips, days) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return trips
    .filter((trip) => {
      const at = new Date(trip.started_at || trip.created_at).getTime()
      return Number.isFinite(at) && at >= cutoff
    })
    .map((trip) => ({ at: trip.started_at || trip.created_at, value: tripConsumption(trip) }))
    .filter((point) => Number.isFinite(point.value))
    .sort((a, b) => String(a.at).localeCompare(String(b.at)))
}

/** Build an SVG path plus point coordinates from consumption values. */
function makeChartPath(values) {
  if (!values.length) return null
  const width = 600
  const height = 180
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const points = values.map((value, index) => {
    const x = values.length === 1 ? 0 : (index * width) / (values.length - 1)
    const y = 16 + (1 - (value - min) / span) * (height - 32)
    return { x, y, d: `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}` }
  })
  return { d: points.map((point) => point.d).join(' '), points, min, max }
}

export default function Fuel({ onBack, vehicle, access }) {
  const vehicleId = vehicle?.rawId ?? vehicle?.id ?? null
  const [records, setRecords] = useState([])
  const [trips, setTrips] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [period, setPeriod] = useState('week')
  const [fuelPrice, setFuelPrice] = useState('')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [savedMessage, setSavedMessage] = useState('')
  const [form, setForm] = useState({
    purchased_at: localDateTimeValue(new Date()),
    odometer_km: '',
    quantity_liters: '',
    unit_price: '',
    fuel_type: vehicle?.fuel_type ?? 'petrol',
    station: '',
    receipt_reference: '',
    is_full_tank: false,
    notes: '',
  })

  const canAddFuel = Boolean(access?.can('fuel.add'))
  const canViewTrips = Boolean(access?.can('trips.view'))

  useEffect(() => {
    if (!vehicleId) {
      setRecords([])
      setTrips([])
      setSummary(null)
      setLoading(false)
      return undefined
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([
      listFuelRecords({ vehicle: vehicleId }),
      fetchFuelSummary({ vehicle: vehicleId }),
      canViewTrips ? listTrips({ vehicle: vehicleId }) : Promise.resolve([]),
    ])
      .then(([fuelRows, fuelSummary, tripRows]) => {
        if (cancelled) return
        const sorted = [...fuelRows].sort((a, b) => String(b.date).localeCompare(String(a.date)))
        setRecords(sorted)
        setSummary(fuelSummary)
        setTrips(tripRows)
        const latestPrice = sorted.find((row) => Number(row.unit_price) > 0)?.unit_price
        if (latestPrice) setFuelPrice(String(latestPrice))
        setForm((current) => ({
          ...current,
          odometer_km: String(sorted[0]?.odometer_km ?? vehicle?.odometer ?? ''),
          unit_price: latestPrice ? String(latestPrice) : current.unit_price,
        }))
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [vehicleId, canViewTrips, vehicle?.odometer, reloadKey])

  const periodDays = PERIODS[period].days
  const periodRecords = useMemo(() => {
    if (period === 'month') return records
    if (period === 'today') return records.filter((row) => String(row.date) === todayIso())
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    return records.filter((row) => String(row.date) >= since)
  }, [records, period])

  const periodStats = useMemo(() => {
    const sum = (values) => values.reduce((total, value) => total + value, 0)
    const costs = periodRecords.map((row) => Number(row.total_cost)).filter(Number.isFinite)
    const liters = periodRecords.map((row) => Number(row.quantity_liters)).filter(Number.isFinite)
    const prices = periodRecords.map((row) => Number(row.unit_price)).filter((value) => Number.isFinite(value) && value > 0)
    return {
      cost: costs.length ? sum(costs) : 0,
      liters: liters.length ? sum(liters) : 0,
      count: periodRecords.length,
      avgPrice: prices.length ? sum(prices) / prices.length : null,
    }
  }, [periodRecords])

  const periodTrips = useMemo(() => consumptionPoints(trips, periodDays), [trips, periodDays])
  const consumptionValues = periodTrips.map((point) => point.value)
  const consumptionAvg = consumptionValues.length
    ? consumptionValues.reduce((total, value) => total + value, 0) / consumptionValues.length
    : null
  const consumptionBest = consumptionValues.length ? Math.min(...consumptionValues) : null
  const consumptionWorst = consumptionValues.length ? Math.max(...consumptionValues) : null
  const chart = makeChartPath(consumptionValues)
  const previousConsumption = (() => {
    const cutoff = Date.now() - periodDays * 24 * 60 * 60 * 1000
    const older = consumptionPoints(trips, periodDays * 2)
      .filter((point) => new Date(point.at).getTime() < cutoff)
      .map((point) => point.value)
    if (!older.length) return null
    return older.reduce((total, value) => total + value, 0) / older.length
  })()

  const latest = records[0] ?? null
  const parsedFuelPrice = Number(fuelPrice)
  const fillCost = Number.isFinite(parsedFuelPrice) && parsedFuelPrice > 0 ? 40 * parsedFuelPrice : null

  function updateForm(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function saveFillUp(event) {
    event.preventDefault()
    setFormError(null)
    if (!vehicleId) {
      setFormError('Select a vehicle before logging a fill-up.')
      return
    }
    const payload = {
      vehicle: vehicleId,
      purchased_at: new Date(form.purchased_at).toISOString(),
      odometer_km: Number(form.odometer_km),
      quantity_liters: Number(form.quantity_liters),
      fuel_type: form.fuel_type,
      is_full_tank: form.is_full_tank,
    }
    if (Number(form.unit_price) > 0) payload.unit_price = Number(form.unit_price)
    if (form.station.trim()) payload.station = form.station.trim()
    if (form.receipt_reference.trim()) payload.receipt_reference = form.receipt_reference.trim()
    if (form.notes.trim()) payload.notes = form.notes.trim()
    setSaving(true)
    try {
      await createFuelRecord(payload)
      const [fuelRows, fuelSummary] = await Promise.all([
        listFuelRecords({ vehicle: vehicleId }),
        fetchFuelSummary({ vehicle: vehicleId }),
      ])
      setRecords([...fuelRows].sort((a, b) => String(b.date).localeCompare(String(a.date))))
      setSummary(fuelSummary)
      setSavedMessage(`Fill-up on ${formatDate(form.purchased_at)} recorded.`)
      setForm((current) => ({
        ...current,
        quantity_liters: '',
        station: '',
        receipt_reference: '',
        is_full_tank: false,
        notes: '',
      }))
      setIsFormOpen(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="fuel-view" aria-labelledby="fuel-title">
      <div className="fuel-view-heading">
        <button className="fuel-back" type="button" onClick={onBack} aria-label="Back to dashboard" title="Back to dashboard">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6M9 12h12" />
          </svg>
        </button>
        <div>
          <p className="fuel-eyebrow">VEHICLE FUEL</p>
          <h2 id="fuel-title">Fuel</h2>
          <p className="fuel-vehicle-name">{vehicle ? `${vehicle.make} ${vehicle.model} · ${vehicle.registration}` : 'Select a vehicle to see fuel data'}</p>
        </div>
        {canAddFuel && (
          <button className="fuel-add-toggle" type="button" onClick={() => { setIsFormOpen((open) => !open); setSavedMessage(''); setFormError(null) }}>
            {isFormOpen ? '− CANCEL' : '+ LOG FILL-UP'}
          </button>
        )}
      </div>

      {error && <p className="fuel-notice" role="alert">{error} <button type="button" onClick={() => setReloadKey((key) => key + 1)}>Retry</button></p>}
      {savedMessage && <p className="fuel-notice success" role="status">{savedMessage}</p>}

      {isFormOpen && (
        <section className="fuel-panel fuel-add-panel" aria-labelledby="fuel-add-title">
          <div className="fuel-section-heading">
            <div>
              <p className="fuel-eyebrow">NEW RECORD</p>
              <h3 id="fuel-add-title">Log a fill-up</h3>
            </div>
          </div>
          <form className="fuel-add-form" onSubmit={saveFillUp}>
            <label>Purchase date and time
              <input name="purchased_at" type="datetime-local" max={localDateTimeValue(new Date())} value={form.purchased_at} onChange={updateForm} required />
            </label>
            <label>Odometer (km)
              <input name="odometer_km" type="number" min="0" step="1" inputMode="numeric" value={form.odometer_km} onChange={updateForm} required />
            </label>
            <label>Liters
              <input name="quantity_liters" type="number" min="0.001" step="0.01" inputMode="decimal" value={form.quantity_liters} onChange={updateForm} required />
            </label>
            <label>Unit price (UGX / L)
              <input name="unit_price" type="number" min="0" step="1" inputMode="numeric" value={form.unit_price} onChange={updateForm} />
            </label>
            <label>Fuel type
              <select name="fuel_type" value={form.fuel_type} onChange={updateForm}>
                {['petrol', 'diesel', 'electric', 'hybrid', 'lpg'].map((type) => (
                  <option key={type} value={type}>{type.toUpperCase()}</option>
                ))}
              </select>
            </label>
            <label>Station
              <input name="station" type="text" placeholder="e.g. Shell Najjanankumbi" value={form.station} onChange={updateForm} />
            </label>
            <label>Receipt reference
              <input name="receipt_reference" type="text" maxLength="120" value={form.receipt_reference} onChange={updateForm} />
            </label>
            <label className="fuel-form-wide">
              <input name="is_full_tank" type="checkbox" checked={form.is_full_tank} onChange={(event) => setForm((current) => ({ ...current, is_full_tank: event.target.checked }))} />
              Filled tank to full
            </label>
            <label className="fuel-form-wide">Notes
              <textarea name="notes" rows="2" placeholder="Optional notes" value={form.notes} onChange={updateForm} />
            </label>
            {formError && <p className="fuel-notice" role="alert">{formError}</p>}
            <button className="fuel-save-button" type="submit" disabled={saving}>{saving ? 'SAVING…' : 'SAVE FILL-UP'}</button>
          </form>
        </section>
      )}

      <section className="fuel-panel fuel-level-panel" aria-labelledby="fuel-latest-title">
        <div className="fuel-section-heading">
          <div>
            <p className="fuel-eyebrow">LATEST FILL-UP</p>
            <h3 id="fuel-latest-title">{latest ? formatDate(latest.date) : 'No fill-ups yet'}</h3>
          </div>
          <span className="fuel-level-live"><i /> FROM YOUR LOG</span>
        </div>
        {loading ? (
          <p className="fuel-empty">Loading fuel records…</p>
        ) : latest ? (
          <>
            <div className="fuel-level-value">
              <strong>{formatLiters(latest.quantity_liters)}</strong>
              <span>{formatUgx(latest.total_cost)} total{latest.unit_price ? ` · ${formatUgx(latest.unit_price)}/L` : ''}</span>
            </div>
            <div className="fuel-range">
              <div>
                <span>Odometer</span>
                <small>{Number(latest.odometer_km).toLocaleString('en-UG')} km</small>
              </div>
              <strong>{latest.station || latest.fuel_type || '—'}</strong>
            </div>
          </>
        ) : (
          <p className="fuel-empty">Log your first fill-up to see tank spend, prices and consumption here.</p>
        )}
      </section>

      <section className="fuel-metric-grid" aria-label="Fuel statistics">
        <article className="fuel-panel fuel-metric">
          <p className="fuel-eyebrow">CONSUMPTION · {PERIODS[period].label.toUpperCase()}</p>
          <strong className="fuel-metric-value">{consumptionAvg !== null ? consumptionAvg.toFixed(1) : '—'}<small> L/100 km</small></strong>
          <span className="fuel-metric-note">{consumptionValues.length ? `From ${consumptionValues.length} trip${consumptionValues.length === 1 ? '' : 's'}` : 'No trips with fuel in this period'}</span>
          {consumptionBest !== null && (
            <div className="fuel-extra-stats">
              <span>Best <b>{consumptionBest.toFixed(1)}</b></span><span>Worst <b>{consumptionWorst.toFixed(1)}</b></span>
            </div>
          )}
        </article>
        <article className="fuel-panel fuel-metric">
          <p className="fuel-eyebrow">FUEL COST · {PERIODS[period].label.toUpperCase()}</p>
          <strong className="fuel-metric-value">{formatUgx(periodStats.cost)}</strong>
          <span className="fuel-metric-note">{periodStats.count} fill-up{periodStats.count === 1 ? '' : 's'} in period</span>
          {summary && (
            <div className="fuel-extra-stats">
              <span>Month <b>{formatUgx(summary.this_month_cost)}</b></span><span>Year <b>{formatUgx(summary.this_year_cost)}</b></span>
            </div>
          )}
        </article>
        <article className="fuel-panel fuel-metric">
          <p className="fuel-eyebrow">FUEL USED · {PERIODS[period].label.toUpperCase()}</p>
          <strong className="fuel-metric-value">{formatLiters(periodStats.liters)}</strong>
          <span className="fuel-metric-note">Pumped in period</span>
          {summary && (
            <div className="fuel-extra-stats fuel-usage-stats">
              <span>Records <b>{summary.record_count}</b></span><span>Month <b>{formatLiters(summary.this_month_liters ?? 0)}</b></span>
            </div>
          )}
        </article>
        <article className="fuel-panel fuel-metric">
          <p className="fuel-eyebrow">FILL ESTIMATE</p>
          <label className="fuel-price-label" htmlFor="fuel-price">Price per litre{periodStats.avgPrice ? ` · last avg ${formatUgx(periodStats.avgPrice)}` : ''}</label>
          <div className="fuel-price-input">
            <span>UGX</span>
            <input
              id="fuel-price"
              type="number"
              min="1"
              step="100"
              inputMode="numeric"
              value={fuelPrice}
              onChange={(event) => setFuelPrice(event.target.value)}
              aria-label="Fuel price per litre in Ugandan shillings"
            />
            <span>/ L</span>
          </div>
          <span className="fuel-metric-note">40 L fill estimate</span>
          <strong className="fuel-fill-cost">{fillCost === null ? 'Enter a price' : formatUgx(fillCost)}</strong>
        </article>
      </section>

      <section className="fuel-panel fuel-purchase-panel" aria-labelledby="fuel-purchase-title">
        <div className="fuel-section-heading">
          <div>
            <p className="fuel-eyebrow">FUEL EFFICIENCY</p>
            <h3 id="fuel-efficiency-title">Consumption trend</h3>
          </div>
          <div className="fuel-period-switch" role="group" aria-label="Chart period">
            {Object.entries(PERIODS).map(([key, option]) => (
              <button
                className={period === key ? 'active' : ''}
                key={key}
                type="button"
                aria-pressed={period === key}
                onClick={() => setPeriod(key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        {canViewTrips && chart ? (
          <>
            <div className="fuel-chart-legend"><span><i /> Consumption · L/100 km</span></div>
            <div className="fuel-chart">
              <div className="fuel-chart-grid" />
              <span className="fuel-chart-y y10">{chart.max.toFixed(1)}</span>
              <span className="fuel-chart-y y8">{((chart.max + chart.min) / 2).toFixed(1)}</span>
              <span className="fuel-chart-y y6">{chart.min.toFixed(1)}</span>
              <svg viewBox="0 0 600 180" preserveAspectRatio="none" role="img" aria-label={`${PERIODS[period].label} fuel consumption trend`}>
                <defs>
                  <linearGradient id="fuel-area" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor="#42d8f4" stopOpacity=".3" />
                    <stop offset="1" stopColor="#42d8f4" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={`${chart.d} L600,180 L0,180 Z`} fill="url(#fuel-area)" />
                <path d={chart.d} fill="none" stroke="#42d8f4" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                {chart.points.map((point, index) => (
                  <circle key={`${period}-${index}`} cx={point.x} cy={point.y} r="4" fill="#42d8f4" />
                ))}
              </svg>
            </div>
            <p className="fuel-chart-caption">
              Average {consumptionAvg.toFixed(1)} L/100 km over {consumptionValues.length} trip{consumptionValues.length === 1 ? '' : 's'} · oldest → newest
            </p>
          </>
        ) : (
          <p className="fuel-empty">
            {canViewTrips
              ? 'Log trips with distance and fuel used to see your real consumption curve.'
              : 'Your role cannot view trips, so consumption cannot be calculated.'}
          </p>
        )}
      </section>

      <section className="fuel-panel fuel-history-panel" aria-labelledby="fuel-history-title">
        <div className="fuel-section-heading">
          <div>
            <p className="fuel-eyebrow">RECENT FUEL ACTIVITY</p>
            <h3 id="fuel-history-title">Fuel purchase history</h3>
          </div>
          <span className="fuel-history-caption">{records.length} fill-up{records.length === 1 ? '' : 's'} on record</span>
        </div>
        {records.length ? (
          <div className="fuel-history-list">
            {records.slice(0, 8).map((entry) => (
              <article className="fuel-history-row" key={entry.id}>
                <span className="fuel-history-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 21V5a2 2 0 0 1 2-2h8v18M4 21h12M8 7h4v5H8zM16 8h2l2 2v7a2 2 0 0 1-4 0" />
                  </svg>
                </span>
                <div className="fuel-history-main">
                  <strong>{formatDate(entry.date)}</strong>
                  <span>{[entry.fuel_type, formatLiters(entry.quantity_liters), entry.odometer_km ? `Odometer ${Number(entry.odometer_km).toLocaleString('en-UG')} km` : null, entry.station].filter(Boolean).join(' · ')}</span>
                </div>
                <strong className="fuel-history-cost">{formatUgx(entry.total_cost)}</strong>
              </article>
            ))}
          </div>
        ) : (
          <p className="fuel-empty">No fill-ups recorded for this vehicle yet.</p>
        )}
      </section>

      {consumptionAvg !== null && previousConsumption !== null && consumptionAvg > previousConsumption * 1.05 && (
        <section className="fuel-alert high" role="status">
          <span className="fuel-alert-icon" aria-hidden="true">!</span>
          <div>
            <strong>HIGH CONSUMPTION</strong>
            <p>Recent consumption is {consumptionAvg.toFixed(1)} L/100 km, above your earlier {previousConsumption.toFixed(1)} L/100 km.</p>
          </div>
        </section>
      )}
      {consumptionAvg !== null && previousConsumption !== null && consumptionAvg < previousConsumption * 0.95 && (
        <section className="fuel-alert improved" role="status">
          <span className="fuel-alert-icon" aria-hidden="true">✓</span>
          <div>
            <strong>EFFICIENCY IMPROVED</strong>
            <p>Recent consumption is {consumptionAvg.toFixed(1)} L/100 km, better than your earlier {previousConsumption.toFixed(1)} L/100 km.</p>
          </div>
        </section>
      )}
      {!canAddFuel && <p className="fuel-demo-note">Your role can view fuel data but not create records.</p>}
    </section>
  )
}
