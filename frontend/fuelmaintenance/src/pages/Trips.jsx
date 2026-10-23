import { useEffect, useState } from 'react'
import { completeTrip, getTripSummary, listTrips, startTrip } from '../api/trips'
import './Trips.css'

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString()
}

function formatDuration(seconds) {
  if (seconds == null) return 'In progress'
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  return hours ? `${hours}h ${minutes % 60}m` : `${minutes} min`
}

function TripMetric({ label, value, detail }) {
  return (
    <article className="trip-metric">
      <span>{label}</span>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </article>
  )
}

async function fetchTripData(vehicleId, dateFrom, dateTo) {
  const filters = { vehicle: vehicleId, dateFrom, dateTo }
  const [records, allVehicleRecords, summary] = await Promise.all([
    listTrips(filters),
    listTrips({ vehicle: vehicleId }),
    getTripSummary(filters),
  ])
  const activeRecords = allVehicleRecords.filter((trip) => !trip.ended_at)
  return {
    trips: [...activeRecords, ...records.filter((trip) => trip.ended_at)],
    summary,
  }
}

export default function Trips({ onBack, vehicle }) {
  const vehicleId = vehicle?.id
  const [trips, setTrips] = useState([])
  const [summary, setSummary] = useState(null)
  const [startLocation, setStartLocation] = useState('')
  const [destination, setDestination] = useState('')
  const [endOdometer, setEndOdometer] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(true)
  const [reloadVersion, setReloadVersion] = useState(0)
  const [loadedRequest, setLoadedRequest] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!vehicleId) return undefined
    let currentRequest = true
    const requestKey = { vehicleId, dateFrom, dateTo, reloadVersion }
    fetchTripData(vehicleId, dateFrom, dateTo)
      .then((data) => {
        if (currentRequest) {
          setTrips(data.trips)
          setSummary(data.summary)
          setError('')
        }
      })
      .catch((requestError) => {
        if (currentRequest) setError(requestError.message)
      })
      .finally(() => {
        if (currentRequest) {
          setLoading(false)
          setLoadedRequest(requestKey)
        }
      })
    return () => { currentRequest = false }
  }, [vehicleId, dateFrom, dateTo, reloadVersion])

  const requestIsCurrent = loadedRequest?.vehicleId === vehicleId
    && loadedRequest?.dateFrom === dateFrom
    && loadedRequest?.dateTo === dateTo
    && loadedRequest?.reloadVersion === reloadVersion
  const visibleTrips = requestIsCurrent ? trips : []
  const visibleSummary = requestIsCurrent ? summary : null
  const activeTrip = visibleTrips.find((trip) => !trip.ended_at)
  const completedTrips = visibleTrips.filter((trip) => trip.ended_at)

  async function handleStart(event) {
    event.preventDefault()
    if (!vehicle?.id || !startLocation.trim()) return
    setSaving(true)
    setLoading(true)
    setError('')
    setNotice('')
    try {
      await startTrip({
        vehicle: vehicle.id,
        start_location: startLocation.trim(),
        destination: destination.trim(),
      })
      setStartLocation('')
      setDestination('')
      setNotice('Trip started. The vehicle odometer was captured as its starting reading.')
      setReloadVersion((version) => version + 1)
    } catch (requestError) {
      setError(requestError.message)
      setLoading(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleComplete(event) {
    event.preventDefault()
    if (!activeTrip || endOdometer === '') return
    setSaving(true)
    setLoading(true)
    setError('')
    setNotice('')
    try {
      const completed = await completeTrip(activeTrip.id, endOdometer)
      setEndOdometer('')
      setNotice(`Trip completed: ${completed.distance_km} km from odometer readings.`)
      setReloadVersion((version) => version + 1)
    } catch (requestError) {
      setError(requestError.message)
      setLoading(false)
    } finally {
      setSaving(false)
    }
  }

  const displayVehicle = vehicle
    ? `${vehicle.make || ''} ${vehicle.model || ''}`.trim() || vehicle.name || vehicle.license_plate
    : 'No vehicle selected'
  const currentOdometer = Number(vehicle?.odometer_km ?? 0)
  const isLoading = loading || !requestIsCurrent

  return (
    <section className="trips-view" aria-labelledby="trips-title">
      <header className="trips-heading">
        <button className="trips-back" type="button" onClick={onBack} aria-label="Back to dashboard" title="Back to dashboard">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6M9 12h12" />
          </svg>
        </button>
        <div>
          <p className="trips-eyebrow">VEHICLE JOURNEYS</p>
          <h2 id="trips-title">Trips</h2>
          <p className="trips-vehicle">{displayVehicle}{vehicle?.license_plate ? ` · ${vehicle.license_plate}` : ''}</p>
        </div>
        <span className={`trip-live-pill ${activeTrip ? 'active' : 'stopped'}`}>
          <i /> {activeTrip ? 'TRIP IN PROGRESS' : 'IDLE'}
        </span>
      </header>

      {error && <p className="trip-notice trip-error" role="alert">{error}</p>}
      {notice && <p className="trip-notice" role="status">{notice}</p>}

      <section className="trips-panel current-trip-panel" aria-labelledby="current-trip-title">
        <div className="trips-section-heading">
          <div>
            <p className="trips-eyebrow">{activeTrip ? 'CURRENT TRIP' : 'NEW TRIP'}</p>
            <h3 id="current-trip-title">
              {activeTrip
                ? `${activeTrip.start_location}${activeTrip.destination ? ` → ${activeTrip.destination}` : ''}`
                : 'Record a journey'}
            </h3>
          </div>
          <span className={`trip-state ${activeTrip ? 'active' : 'stopped'}`}>
            <i /> {activeTrip ? 'ACTIVE' : 'READY'}
          </span>
        </div>

        {activeTrip ? (
          <>
            <div className="current-trip-metrics">
              <TripMetric label="STARTED" value={formatDate(activeTrip.started_at)} />
              <TripMetric label="START ODOMETER" value={`${activeTrip.start_odometer_km ?? '—'} km`} />
              <TripMetric label="DISTANCE" value="Set when trip ends" />
            </div>
            <form className="trip-action-form" onSubmit={handleComplete}>
              <label>
                Ending odometer (km)
                <input
                  type="number"
                  min={Math.max(currentOdometer, Number(activeTrip.start_odometer_km ?? 0))}
                  step="1"
                  required
                  value={endOdometer}
                  onChange={(event) => setEndOdometer(event.target.value)}
                  placeholder={`At least ${Math.max(currentOdometer, Number(activeTrip.start_odometer_km ?? 0))}`}
                />
              </label>
              <button className="trip-toggle-button end" type="submit" disabled={saving || !vehicle}>
                {saving ? 'SAVING…' : 'END TRIP'}
              </button>
            </form>
            <p className="trip-idle-copy">Trip distance is calculated from ending minus starting odometer. No GPS or sensor data is assumed.</p>
          </>
        ) : (
          <form className="trip-action-form" onSubmit={handleStart}>
            <label>
              Starting point
              <input
                required
                maxLength="200"
                value={startLocation}
                onChange={(event) => setStartLocation(event.target.value)}
                placeholder="e.g. Kampala"
              />
            </label>
            <label>
              Destination (optional)
              <input
                maxLength="200"
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
                placeholder="e.g. Entebbe"
              />
            </label>
            <button className="trip-toggle-button start" type="submit" disabled={saving || !vehicle}>
              {saving ? 'SAVING…' : 'START TRIP'}
            </button>
            <p className="trip-idle-copy">
              Current vehicle odometer: {currentOdometer.toLocaleString()} km. This reading will be captured when the trip starts.
            </p>
          </form>
        )}
      </section>

      <section className="trip-statistics" aria-label="Trip statistics">
        <div>
          <p className="trips-eyebrow">THIS WEEK</p>
          <strong>{visibleSummary?.this_week?.trip_count ?? '—'}</strong>
          <span>completed trips · {Number(visibleSummary?.this_week?.distance_km ?? 0).toLocaleString()} km</span>
        </div>
        <div>
          <p className="trips-eyebrow">THIS MONTH</p>
          <strong>{visibleSummary?.this_month?.trip_count ?? '—'}</strong>
          <span>completed trips · {Number(visibleSummary?.this_month?.distance_km ?? 0).toLocaleString()} km</span>
        </div>
        <div>
          <p className="trips-eyebrow">MATCHING TRIPS</p>
          <strong>{visibleSummary?.totals?.trip_count ?? '—'}</strong>
          <span>average {Number(visibleSummary?.totals?.average_distance_km ?? 0).toFixed(1)} km per trip</span>
        </div>
      </section>

      <section className="trips-panel" aria-labelledby="trip-history-title">
        <div className="trips-section-heading">
          <div>
            <p className="trips-eyebrow">JOURNEY LOG</p>
            <h3 id="trip-history-title">Trip history</h3>
          </div>
          <span className="trip-history-count">{completedTrips.length} COMPLETED</span>
        </div>
        <div className="trip-date-filters">
          <label>From <input type="date" value={dateFrom} onChange={(event) => {
            setLoading(true)
            setError('')
            setDateFrom(event.target.value)
          }} /></label>
          <label>To <input type="date" value={dateTo} onChange={(event) => {
            setLoading(true)
            setError('')
            setDateTo(event.target.value)
          }} /></label>
        </div>
        {!vehicleId ? (
          <p className="trip-idle-copy">Select a vehicle to manage trip records.</p>
        ) : isLoading ? (
          <p className="trip-idle-copy">Loading trips…</p>
        ) : completedTrips.length ? (
          <div className="trip-history-list">
            {completedTrips.map((trip) => (
              <article className="trip-history-item" key={trip.id}>
                <div className="trip-history-row">
                  <span className="trip-history-date">{formatDate(trip.started_at)}</span>
                  <span className="trip-history-route">
                    <strong>{trip.start_location} → {trip.destination || 'Destination not recorded'}</strong>
                    <small>
                      {trip.distance_km} km · {formatDuration(trip.duration_seconds)}
                      {trip.fuel_consumed_liters != null ? ` · ${trip.fuel_consumed_liters} L fuel` : ''}
                    </small>
                  </span>
                </div>
                <div className="trip-expanded-details">
                  <span>START ODOMETER <b>{trip.start_odometer_km ?? '—'} km</b></span>
                  <span>END ODOMETER <b>{trip.end_odometer_km ?? '—'} km</b></span>
                  <span>AVG SPEED <b>{trip.average_speed_kmh == null ? '—' : `${trip.average_speed_kmh} km/h`}</b></span>
                  <span>FUEL ECONOMY <b>{trip.fuel_economy_l_per_100km == null ? '—' : `${trip.fuel_economy_l_per_100km} L/100 km`}</b></span>
                  <span>FUEL COST <b>{trip.fuel_cost == null ? '—' : `UGX ${Number(trip.fuel_cost).toLocaleString()}`}</b></span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="trip-idle-copy">
            {trips.some((trip) => !trip.ended_at)
              ? 'There are no completed trips in this date range yet.'
              : 'No saved trips yet. Start a trip above to begin recording journey history.'}
          </p>
        )}
      </section>

      {visibleSummary?.most_fuel_used && (
        <p className="trips-demo-note">
          Highest recorded fuel use: {visibleSummary.most_fuel_used.fuel_consumed_liters} L on
          {' '}{visibleSummary.most_fuel_used.start_location} → {visibleSummary.most_fuel_used.destination || 'an unspecified route'}.
        </p>
      )}
    </section>
  )
}
