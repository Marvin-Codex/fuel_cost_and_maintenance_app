import { useEffect, useState } from 'react'
import {
  createFuelPurchase,
  getFuelEfficiency,
  getFuelSummary,
  listFuelPurchases,
} from '../api/fuel'
import './Fuel.css'

function localDateTimeValue() {
  const localTime = new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
  return localTime.toISOString().slice(0, 16)
}

function formatUgx(value) {
  return `UGX ${Math.round(Number(value || 0)).toLocaleString('en-UG')}`
}

function formatDateTime(value) {
  if (!value) return 'Date not recorded'
  return new Date(value).toLocaleString()
}

function formatPurchaseDateTime(record) {
  if (record.purchased_at) return formatDateTime(record.purchased_at)
  if (record.date) {
    return `${new Date(`${record.date}T12:00:00`).toLocaleDateString()} · time not recorded`
  }
  return 'Date not recorded'
}

function makeChartPath(values) {
  if (!values.length) return ''
  const width = 600
  const height = 180
  const min = Math.max(0, Math.min(...values) - 1)
  const max = Math.max(min + 1, ...values) + 1
  return values.map((value, index) => {
    const x = values.length === 1 ? width / 2 : index * width / (values.length - 1)
    const y = height - ((value - min) / (max - min)) * height
    return `${index === 0 ? 'M' : 'L'}${x},${y}`
  }).join(' ')
}

function TripFuelChart({ records, period, setPeriod }) {
  const limit = Number(period)
  const chartRecords = records.slice(0, limit).reverse()
  const values = chartRecords.map((record) => Number(record.fuel_economy_l_per_100km))
  const path = makeChartPath(values)
  const area = path ? `${path} L600,180 L0,180 Z` : ''

  return (
    <>
    <section className="fuel-panel fuel-efficiency-panel" aria-labelledby="fuel-efficiency-title">
      <div className="fuel-section-heading">
        <div>
          <p className="fuel-eyebrow">FUEL EFFICIENCY</p>
          <h3 id="fuel-efficiency-title">Measured trip trend</h3>
        </div>
        <div className="fuel-period-switch" role="group" aria-label="Number of trips to show">
          {[['7', '7 trips'], ['30', '30 trips'], ['100', '100 trips']].map(([key, label]) => (
            <button
              className={period === key ? 'active' : ''}
              key={key}
              type="button"
              aria-pressed={period === key}
              onClick={() => setPeriod(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {values.length ? (
        <>
          <div className="fuel-chart-legend">
            <span><i /> Trip consumption · L/100 km</span>
          </div>
          <div className="fuel-chart">
            <div className="fuel-chart-grid" />
            <svg viewBox="0 0 600 180" preserveAspectRatio="none" role="img" aria-label="Recorded trip fuel-efficiency trend">
              <defs>
                <linearGradient id="fuel-area" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="#42d8f4" stopOpacity=".3" />
                  <stop offset="1" stopColor="#42d8f4" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={area} fill="url(#fuel-area)" />
              <path d={path} fill="none" stroke="#42d8f4" strokeWidth="3" vectorEffect="non-scaling-stroke" />
              {values.map((value, index) => {
                const x = values.length === 1 ? 300 : index * 600 / (values.length - 1)
                const min = Math.max(0, Math.min(...values) - 1)
                const max = Math.max(min + 1, ...values) + 1
                const y = 180 - ((value - min) / (max - min)) * 180
                return <circle key={chartRecords[index].trip_id} cx={x} cy={y} r="4" fill="#42d8f4" />
              })}
            </svg>
          </div>
          <div className="fuel-chart-labels">
            {chartRecords.map((record, index) => (
              index % Math.ceil(chartRecords.length / 7) === 0
                || index === chartRecords.length - 1
            ) && (
              <span key={record.trip_id}>{new Date(record.ended_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            ))}
          </div>
          <p className="fuel-chart-caption">
            {records.length} trip{records.length === 1 ? '' : 's'} with both distance and fuel-consumed readings.
          </p>
        </>
      ) : (
        <p className="fuel-empty-copy">Trip-efficiency trends appear after completed trips include both distance and fuel consumed.</p>
      )}
    </section>
    <section className="fuel-panel fuel-history-panel" aria-labelledby="trip-consumption-title">
      <div className="fuel-section-heading">
        <div>
          <p className="fuel-eyebrow">FUEL CONSUMED</p>
          <h3 id="trip-consumption-title">Trip consumption</h3>
        </div>
      </div>
      {records.length ? (
        <div className="trip-fuel-history-list">
          {records.slice(0, 10).map((record) => (
            <article className="trip-fuel-history-row" key={record.trip_id}>
              <div>
                <strong>{record.start_location} → {record.destination || 'Route not recorded'}</strong>
                <span>{formatDateTime(record.ended_at)} · {record.distance_km} km · {record.fuel_economy_l_per_100km} L/100 km</span>
              </div>
              <span>{record.fuel_consumed_liters} L<br />{formatUgx(record.fuel_cost)}</span>
            </article>
          ))}
        </div>
      ) : (
        <p className="fuel-empty-copy">Fuel use per trip appears when trip records include a measured fuel quantity.</p>
      )}
    </section>
    </>
  )
}

export default function Fuel({ onBack, vehicle }) {
  const vehicleId = vehicle?.id
  const [records, setRecords] = useState([])
  const [summary, setSummary] = useState(null)
  const [efficiency, setEfficiency] = useState(null)
  const [reloadVersion, setReloadVersion] = useState(0)
  const [loadedRequest, setLoadedRequest] = useState('')
  const [savePending, setSavePending] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [period, setPeriod] = useState('7')
  const [purchaseTime, setPurchaseTime] = useState(localDateTimeValue)
  const [quantity, setQuantity] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [odometerByVehicle, setOdometerByVehicle] = useState({})
  const [fuelTypeOverride, setFuelTypeOverride] = useState(null)
  const [station, setStation] = useState('')
  const [receiptReference, setReceiptReference] = useState('')
  const [isFullTank, setIsFullTank] = useState(false)
  const requestKey = `${vehicleId ?? ''}|${reloadVersion}`
  const loading = Boolean(vehicleId) && loadedRequest !== requestKey
  const odometer = vehicleId
    ? odometerByVehicle[vehicleId] ?? String(vehicle?.odometer_km ?? '')
    : ''
  const fuelType = fuelTypeOverride?.vehicleId === vehicleId
    ? fuelTypeOverride.value
    : vehicle?.fuel_type ?? 'petrol'

  useEffect(() => {
    if (!vehicleId) return undefined
    let currentRequest = true
    Promise.all([
      listFuelPurchases({ vehicle: vehicleId }),
      getFuelSummary({ vehicle: vehicleId }),
      getFuelEfficiency({ vehicle: vehicleId }),
    ]).then(([fuelRecords, fuelSummary, fuelEfficiency]) => {
      if (currentRequest) {
        setRecords(fuelRecords)
        setSummary(fuelSummary)
        setEfficiency(fuelEfficiency)
        setError('')
      }
    }).catch((requestError) => {
      if (currentRequest) setError(requestError.message)
    }).finally(() => {
      if (currentRequest) setLoadedRequest(requestKey)
    })
    return () => { currentRequest = false }
  }, [vehicleId, reloadVersion, requestKey])

  const fuelLevel = summary?.fuel_level
  const tankCapacity = Number(vehicle?.tank_capacity_liters)
  const hasTankCapacity = Number.isFinite(tankCapacity) && tankCapacity > 0
  const efficiencySummary = efficiency?.trip_efficiency_summary
  const measuredConsumption = efficiencySummary?.average_l_per_100km
  const monthlyLiters = summary?.purchases?.this_month?.total_liters
  const alerts = [...(summary?.alerts ?? []), ...(efficiency?.alerts ?? [])]
  const displayVehicle = vehicle
    ? `${vehicle.make || ''} ${vehicle.model || ''}`.trim() || vehicle.name || vehicle.license_plate
    : 'No vehicle selected'

  async function handlePurchase(event) {
    event.preventDefault()
    if (!vehicleId) return
    setSavePending(true)
    setError('')
    setNotice('')
    try {
      const purchase = await createFuelPurchase({
        vehicle: vehicleId,
        purchased_at: new Date(purchaseTime).toISOString(),
        odometer_km: Number(odometer),
        quantity_liters: quantity,
        unit_price: unitPrice,
        fuel_type: fuelType,
        station: station.trim(),
        receipt_reference: receiptReference.trim(),
        is_full_tank: isFullTank,
      })
      setNotice(`Purchase saved: ${purchase.quantity_liters} L for ${formatUgx(purchase.total_cost)}.`)
      setQuantity('')
      setUnitPrice('')
      setStation('')
      setReceiptReference('')
      setIsFullTank(false)
      setOdometerByVehicle((current) => ({
        ...current,
        [vehicleId]: String(purchase.odometer_km),
      }))
      setReloadVersion((version) => version + 1)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSavePending(false)
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
          <p className="fuel-vehicle-name">{displayVehicle}{vehicle?.license_plate ? ` · ${vehicle.license_plate}` : ''}</p>
        </div>
        <span className={`fuel-demo-badge ${loading ? '' : 'connected'}`}><i /> {loading ? 'LOADING' : 'SAVED DATA'}</span>
      </div>

      {error && <p className="fuel-form-message error" role="alert">{error}</p>}
      {notice && <p className="fuel-form-message success" role="status">{notice}</p>}

      <section className="fuel-panel fuel-level-panel" aria-labelledby="fuel-level-title">
        <div className="fuel-section-heading">
          <div>
            <p className="fuel-eyebrow">ESTIMATED FUEL LEVEL</p>
            <h3 id="fuel-level-title">Tank status</h3>
          </div>
          <span className="fuel-level-live"><i /> {fuelLevel?.available ? 'ESTIMATE' : 'UNAVAILABLE'}</span>
        </div>
        <div className="fuel-level-value">
          <strong>{fuelLevel?.percentage ?? '—'}{fuelLevel?.available ? '%' : ''}</strong>
          <span>
            {fuelLevel?.available && hasTankCapacity
              ? `${fuelLevel.remaining_liters} L / ${tankCapacity.toLocaleString()} L`
              : fuelLevel?.unavailable_reason || 'Select a vehicle to view fuel estimate.'}
          </span>
        </div>
        <div className="fuel-gauge" role="meter" aria-label="Estimated current fuel level" aria-valuemin="0" aria-valuemax="100" aria-valuenow={fuelLevel?.percentage ?? 0}>
          <span style={{ width: `${fuelLevel?.percentage ?? 0}%` }} />
        </div>
        <div className="fuel-gauge-labels"><span>Empty</span><span>Full</span></div>
        <div className="fuel-range">
          <div>
            <span>Estimated remaining range</span>
            <small>{fuelLevel?.average_consumption_l_per_100km
              ? `Based on recorded ${fuelLevel.average_consumption_l_per_100km} L/100 km consumption`
              : fuelLevel?.unavailable_reason || 'Requires a full-tank record and measured trip consumption'}</small>
          </div>
          <strong>{fuelLevel?.estimated_range_km ?? '—'}{fuelLevel?.estimated_range_km != null && <small> km</small>}</strong>
        </div>
      </section>

      <section className="fuel-metric-grid" aria-label="Fuel statistics">
        <article className="fuel-panel fuel-metric">
          <p className="fuel-eyebrow">MEASURED CONSUMPTION</p>
          <strong className="fuel-metric-value">{measuredConsumption ?? '—'}<small> L/100 km</small></strong>
          <span className="fuel-metric-note">{efficiencySummary ? `${efficiencySummary.trip_count} measured trips` : 'No measured trips yet'}</span>
          <div className="fuel-extra-stats">
            <span>Best <b>{efficiencySummary?.best_l_per_100km ?? '—'}</b></span>
            <span>Worst <b>{efficiencySummary?.worst_l_per_100km ?? '—'}</b></span>
          </div>
        </article>
        <article className="fuel-panel fuel-metric">
          <p className="fuel-eyebrow">PURCHASE COST</p>
          <strong className="fuel-metric-value">{formatUgx(summary?.purchases?.this_month?.total_cost)}</strong>
          <span className="fuel-metric-note">This month · recorded purchases</span>
          <div className="fuel-extra-stats">
            <span>Today <b>{formatUgx(summary?.expenditure?.today)}</b></span>
            <span>Week <b>{formatUgx(summary?.expenditure?.this_week)}</b></span>
          </div>
        </article>
        <article className="fuel-panel fuel-metric">
          <p className="fuel-eyebrow">PURCHASED FUEL</p>
          <strong className="fuel-metric-value">{monthlyLiters ?? '0.000'}<small> L</small></strong>
          <span className="fuel-metric-note">Purchased this month, not consumption</span>
          <div className="fuel-extra-stats">
            <span>Purchases <b>{summary?.purchases?.this_month?.record_count ?? 0}</b></span>
            <span>Lifetime <b>{summary?.record_count ?? 0}</b></span>
          </div>
        </article>
        <article className="fuel-panel fuel-metric">
          <p className="fuel-eyebrow">TANK CAPACITY</p>
          <strong className="fuel-metric-value">{hasTankCapacity ? tankCapacity.toLocaleString() : '—'}<small> L</small></strong>
          <span className="fuel-metric-note">From saved vehicle specifications</span>
        </article>
      </section>

      <section className="fuel-panel fuel-purchase-panel" aria-labelledby="fuel-purchase-title">
        <div className="fuel-section-heading">
          <div>
            <p className="fuel-eyebrow">FUEL PURCHASE</p>
            <h3 id="fuel-purchase-title">Record a refuel</h3>
          </div>
        </div>
        <form className="fuel-purchase-form" onSubmit={handlePurchase}>
          <label>Purchase date and time
            <input required type="datetime-local" value={purchaseTime} onChange={(event) => setPurchaseTime(event.target.value)} />
          </label>
          <label>Odometer (km)
            <input required type="number" min={vehicle?.odometer_km ?? 0} step="1" value={odometer} onChange={(event) => setOdometerByVehicle((current) => ({ ...current, [vehicleId]: event.target.value }))} />
          </label>
          <label>Litres purchased
            <input required type="number" min="0.001" step="0.001" value={quantity} onChange={(event) => setQuantity(event.target.value)} />
          </label>
          <label>Price per litre (UGX)
            <input required type="number" min="0" step="0.01" value={unitPrice} onChange={(event) => setUnitPrice(event.target.value)} />
          </label>
          <label>Fuel type
            <select value={fuelType} onChange={(event) => setFuelTypeOverride({ vehicleId, value: event.target.value })}>
              <option value="petrol">Petrol</option>
              <option value="diesel">Diesel</option>
              <option value="electric">Electric</option>
              <option value="hybrid">Hybrid</option>
              <option value="lpg">LPG</option>
            </select>
          </label>
          <label>Fuel station (optional)
            <input maxLength="150" value={station} onChange={(event) => setStation(event.target.value)} />
          </label>
          <label>Receipt reference (optional)
            <input maxLength="120" value={receiptReference} onChange={(event) => setReceiptReference(event.target.value)} />
          </label>
          <label className="fuel-full-tank-check">
            <input type="checkbox" checked={isFullTank} onChange={(event) => setIsFullTank(event.target.checked)} />
            Filled tank to full
          </label>
          <button className="fuel-save-button" type="submit" disabled={savePending || !vehicleId}>
            {savePending ? 'SAVING…' : 'SAVE PURCHASE'}
          </button>
        </form>
        <p className="fuel-form-help">Total paid is calculated by the server from litres × price per litre. Fuel purchased is recorded separately from fuel consumed on trips.</p>
      </section>

      <TripFuelChart records={efficiency?.trip_efficiency ?? []} period={period} setPeriod={setPeriod} />

      <section className="fuel-panel fuel-history-panel" aria-labelledby="fuel-history-title">
        <div className="fuel-section-heading">
          <div>
            <p className="fuel-eyebrow">RECENT FUEL ACTIVITY</p>
            <h3 id="fuel-history-title">Fuel purchase history</h3>
          </div>
          <span className="fuel-history-caption">{records.length} purchases</span>
        </div>
        {records.length ? (
          <div className="fuel-history-list">
            {records.map((entry) => (
              <article className="fuel-history-row" key={entry.id}>
                <span className="fuel-history-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 21V5a2 2 0 0 1 2-2h8v18M4 21h12M8 7h4v5H8zM16 8h2l2 2v7a2 2 0 0 1-4 0" />
                  </svg>
                </span>
                <div className="fuel-history-main">
                  <strong>{formatPurchaseDateTime(entry)}</strong>
                  <span>{entry.fuel_type} · {entry.quantity_liters} L · Odometer {Number(entry.odometer_km).toLocaleString()} km{entry.station ? ` · ${entry.station}` : ''}{entry.is_full_tank ? ' · Full tank' : ''}</span>
                  {entry.receipt_reference && <small>Receipt {entry.receipt_reference}</small>}
                </div>
                <strong className="fuel-history-cost">{formatUgx(entry.total_cost)}</strong>
              </article>
            ))}
          </div>
        ) : (
          <p className="fuel-empty-copy">{loading ? 'Loading fuel records…' : 'No fuel purchases saved for this vehicle yet.'}</p>
        )}
      </section>

      {alerts.map((alert) => (
        <section className={`fuel-alert ${alert.severity === 'warning' ? 'warning' : ''}`} key={alert.code} role="status">
          <span className="fuel-alert-icon" aria-hidden="true">!</span>
          <div><strong>{alert.code.replaceAll('_', ' ').toUpperCase()}</strong><p>{alert.message}</p></div>
        </section>
      ))}
      {!alerts.length && !loading && (
        <p className="fuel-demo-note">No fuel alerts. Fuel-level and range estimates are shown only when purchase and trip records provide enough data.</p>
      )}
    </section>
  )
}
