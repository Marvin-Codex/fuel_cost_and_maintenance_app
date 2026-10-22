import { useEffect, useMemo, useRef, useState } from 'react'
import { createTrip, fetchTripSummary, listTrips } from '../api/resources'
import { MapView } from '../components/ui/MapView'
import TripPlanner from '../components/ui/TripPlanner'
import LocationSearchInput from '../components/ui/LocationSearchInput'
import './Trips.css'

function formatUgx(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  return `UGX ${Math.round(number).toLocaleString('en-UG')}`
}

function formatDuration(seconds) {
  const total = Number(seconds)
  if (!Number.isFinite(total) || total <= 0) return '—'
  const hours = Math.floor(total / 3600)
  const minutes = Math.round((total % 3600) / 60)
  if (hours && minutes) return `${hours}h ${minutes}m`
  if (hours) return `${hours}h`
  return `${minutes} min`
}

function formatDateTime(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function localDateTimeValue(date) {
  const pad = (part) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function tripConsumption(trip) {
  const liters = Number(trip.fuel_consumed_liters)
  const km = Number(trip.distance_km)
  if (Number.isFinite(liters) && Number.isFinite(km) && km > 0) return (liters / km) * 100
  return null
}

function dayKey(value) {
  return String(value ?? '').slice(0, 10)
}

function summarizeTrips(rows) {
  const distances = rows.map((trip) => Number(trip.distance_km)).filter(Number.isFinite)
  const fuels = rows.map((trip) => Number(trip.fuel_consumed_liters)).filter(Number.isFinite)
  const durations = rows.map((trip) => Number(trip.duration_seconds)).filter(Number.isFinite)
  const consumptions = rows.map(tripConsumption).filter(Number.isFinite)
  const sum = (values) => values.reduce((total, value) => total + value, 0)
  return {
    count: rows.length,
    distance: distances.length ? sum(distances) : null,
    fuel: fuels.length ? sum(fuels) : null,
    duration: durations.length ? sum(durations) : null,
    consumption: consumptions.length ? sum(consumptions) / consumptions.length : null,
  }
}

export default function Trips({ onBack, vehicle, access }) {
  const vehicleId = vehicle?.rawId ?? vehicle?.id ?? null
  const [trips, setTrips] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [expandedTrip, setExpandedTrip] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isPlannerOpen, setIsPlannerOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [savedMessage, setSavedMessage] = useState('')
  const [form, setForm] = useState(() => {
    const now = new Date()
    const earlier = new Date(now.getTime() - 60 * 60 * 1000)
    return {
      start_location: '',
      destination: '',
      started_at: localDateTimeValue(earlier),
      ended_at: localDateTimeValue(now),
      distance_km: '',
      fuel_consumed_liters: '',
      fuel_price_per_liter: '',
      notes: '',
    }
  })

  /* ── Map-based location picking ── */
  const [startMapCoords, setStartMapCoords] = useState(null)
  const [destMapCoords, setDestMapCoords] = useState(null)

  function handleStartMapSelect(lat, lng) {
    setStartMapCoords({ lat, lng })
    setForm((current) => ({ ...current, start_location: `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}` }))
  }

  function handleDestMapSelect(lat, lng) {
    setDestMapCoords({ lat, lng })
    setForm((current) => ({ ...current, destination: `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}` }))
  }

  /* Place-search picks (from the dropdown) also drop a pin on the form maps. */
  function handleStartSearchSelect(place) {
    setStartMapCoords({ lat: place.lat, lng: place.lng })
  }

  function handleDestSearchSelect(place) {
    setDestMapCoords({ lat: place.lat, lng: place.lng })
  }

  const canAddTrips = Boolean(access?.can('trips.add'))

  /* ── Real-time GPS trip recording ── */
  const [isRecording, setIsRecording] = useState(false)
  const [tripPoints, setTripPoints] = useState([])
  const [tripWatchId, setTripWatchId] = useState(null)
  const [tripStartTime, setTripStartTime] = useState(null)
  const [tripDestination, setTripDestination] = useState('')
  const [tripStartLocation, setTripStartLocation] = useState('')
  const [tripRecordingError, setTripRecordingError] = useState(null)
  const startPlaceResolvedRef = useRef(false)
  const restoredForMountRef = useRef(false)

  const TRIP_STORAGE_KEY = 'fuelmaintenance.inProgressTrip'

  // Persist the in-progress trip so a reload doesn't lose recorded points.
  useEffect(() => {
    if (!isRecording) return
    try {
      localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify({
        vehicleId,
        tripPoints,
        tripStartTime,
        tripDestination,
        tripStartLocation,
        isRecording: true,
      }))
    } catch {
      /* storage unavailable — ignore */
    }
  }, [isRecording, tripPoints, tripStartTime, tripDestination, tripStartLocation, vehicleId])

  // Restore an in-progress trip after a reload so the live journey isn't lost.
  useEffect(() => {
    if (restoredForMountRef.current) return
    if (!vehicleId) return
    restoredForMountRef.current = true
    let saved = null
    try {
      const raw = localStorage.getItem(TRIP_STORAGE_KEY)
      if (raw) saved = JSON.parse(raw)
    } catch {
      saved = null
    }
    if (!saved || saved.vehicleId !== vehicleId || !saved.isRecording) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (Array.isArray(saved.tripPoints)) setTripPoints(saved.tripPoints)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTripStartTime(saved.tripStartTime ?? null)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTripDestination(saved.tripDestination ?? '')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTripStartLocation(saved.tripStartLocation ?? '')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsRecording(true)
    setTripRecordingError(null)
    startPlaceResolvedRef.current = Boolean(saved.tripStartLocation)
    beginWatching()
  }, [vehicleId])

  const EARTH_RADIUS_KM = 6371

  /** Geolocation gives DOMHighResTimeStamp; older code/points may be epoch ms, undefined, or 0. */
  function toTripISO(value) {
    return toTripISOTime(value).toISOString()
  }

  function toTripISOTime(value) {
    const now = Date.now()
    const boot = now - (typeof performance !== 'undefined' ? performance.now() : 0)
    if (!Number.isFinite(value) || value <= 0) return new Date(now)
    // Epoch milliseconds (>= year 2001) convert directly; anything smaller is high-res relative to boot.
    if (value > 1e12) return new Date(value)
    return new Date(boot + value)
  }

  function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRad = (deg) => (deg * Math.PI) / 180
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a))
  }

  function formatDistance(km) {
    const n = Number(km)
    if (!Number.isFinite(n)) return '—'
    return n.toFixed(2)
  }

  /** "0.34760, 32.58250" — precise coordinate label used as fallback / suffix. */
  function formatCoords(lat, lng) {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`
  }

  /** Resolve a short place name for a coordinate via OSM Nominatim
   *  (free, no API key — same data source as the map tiles). */
  async function reverseGeocode(lat, lng) {
    try {
      const res = await fetch(
        `/osm-geocode/reverse?format=jsonv2&zoom=16&lat=${lat}&lon=${lng}`,
        { headers: { Accept: 'application/json' } },
      )
      if (!res.ok) return null
      const data = await res.json()
      const a = data.address || {}
      const label = [a.road, a.suburb || a.village || a.town || a.city || a.county]
        .filter(Boolean)
        .slice(0, 2)
        .join(', ')
      return label || (data.display_name ? data.display_name.split(',').slice(0, 2).join(',').trim() : null)
    } catch {
      return null
    }
  }

  function formatSpeed(kmh) {
    const n = Number(kmh)
    if (!Number.isFinite(n)) return '—'
    return n.toFixed(0)
  }

  function beginWatching() {
    if (!navigator.geolocation) return
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setTripPoints((prev) => [...prev, { latitude, longitude, timestamp: pos.timestamp }])
        // Resolve the real start place from the first GPS fix (keep user-typed text).
        if (!startPlaceResolvedRef.current) {
          startPlaceResolvedRef.current = true
          reverseGeocode(latitude, longitude).then((place) => {
            const label = place
              ? `${place} (${formatCoords(latitude, longitude)})`
              : formatCoords(latitude, longitude)
            setTripStartLocation((current) => current || label)
          })
        }
      },
      (err) => {
        setTripRecordingError(err.message || 'Unable to access GPS.')
        setIsRecording(false)
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 },
    )
    setTripWatchId(watchId)
  }

  function startTrip() {
    if (!navigator.geolocation) {
      setTripRecordingError('Geolocation is not available in this browser.')
      return
    }
    setTripRecordingError(null)
    setTripPoints([])
    setTripStartTime(Date.now())
    startPlaceResolvedRef.current = false
    setIsRecording(true)
    beginWatching()
  }

  async function stopTrip() {
    if (tripWatchId !== null) {
      navigator.geolocation.clearWatch(tripWatchId)
      setTripWatchId(null)
    }

    if (!vehicleId || tripPoints.length < 2) {
      setIsRecording(false)
      setTripRecordingError('Not enough GPS points recorded to save a trip.')
      return
    }

    const start = tripPoints[0]
    const end = tripPoints[tripPoints.length - 1]
    let totalDistance = 0
    for (let i = 1; i < tripPoints.length; i++) {
      totalDistance += haversineDistance(
        tripPoints[i - 1].latitude,
        tripPoints[i - 1].longitude,
        tripPoints[i].latitude,
        tripPoints[i].longitude,
      )
    }
    const startTimeMs = toTripISOTime(start.timestamp).getTime()
    const endTimeMs = toTripISOTime(end.timestamp).getTime()
    const durationSeconds = Math.max(0, (endTimeMs - startTimeMs) / 1000)
    // Keep end strictly after start — backend validates ended_at > started_at.
    const startedAt = toTripISO(start.timestamp)
    let endedAt = toTripISO(end.timestamp)
    if (endedAt <= startedAt) {
      endedAt = new Date(toTripISOTime(start.timestamp).getTime() + 1000).toISOString()
    }

    // Resolve real place names + coordinates from the map (keep user-typed text).
    const [startPlace, endPlace] = await Promise.all([
      tripStartLocation.trim() ? null : reverseGeocode(start.latitude, start.longitude),
      tripDestination.trim() ? null : reverseGeocode(end.latitude, end.longitude),
    ])
    const startLabel = tripStartLocation.trim()
      || (startPlace ? `${startPlace} (${formatCoords(start.latitude, start.longitude)})` : formatCoords(start.latitude, start.longitude))
    const destLabel = tripDestination.trim()
      || (endPlace ? `${endPlace} (${formatCoords(end.latitude, end.longitude)})` : formatCoords(end.latitude, end.longitude))

    setSaving(true)
    try {
      const gpsSummary = tripPoints.length
        ? `${tripPoints.length} GPS points. Start ${formatCoords(start.latitude, start.longitude)} → End ${formatCoords(end.latitude, end.longitude)}.`
        : ''
      const payload = {
        vehicle: vehicleId,
        start_location: startLabel,
        destination: destLabel,
        started_at: startedAt,
        ended_at: endedAt,
        distance_km: Math.round(totalDistance * 100) / 100,
      }
      if (gpsSummary) payload.notes = gpsSummary
      await createTrip(payload)
      const [rows, tripSummary] = await Promise.all([
        listTrips({ vehicle: vehicleId }),
        fetchTripSummary({ vehicle: vehicleId }),
      ])
      setTrips(rows)
      setSummary(tripSummary)
      setSavedMessage(
        `${startLabel} → ${destLabel} recorded (${formatDistance(totalDistance)} km).`,
      )
    } catch (err) {
      setTripRecordingError(err.message || 'Failed to save GPS trip.')
    } finally {
      setSaving(false)
      setIsRecording(false)
      setTripPoints([])
      setTripStartTime(null)
      setTripDestination('')
      setTripStartLocation('')
      setTripWatchId(null)
      startPlaceResolvedRef.current = false
      try { localStorage.removeItem(TRIP_STORAGE_KEY) } catch { /* ignore */ }
    }
  }

  useEffect(() => {
    return () => {
      if (tripWatchId !== null) {
        navigator.geolocation.clearWatch(tripWatchId)
      }
    }
  }, [tripWatchId])

  const totalDistanceKm = useMemo(() => {
    let d = 0
    for (let i = 1; i < tripPoints.length; i++) {
      d += haversineDistance(
        tripPoints[i - 1].latitude,
        tripPoints[i - 1].longitude,
        tripPoints[i].latitude,
        tripPoints[i].longitude,
      )
    }
    return d
  }, [tripPoints])

  const currentDurationSeconds = useMemo(() => {
    if (!tripStartTime || tripPoints.length === 0) return 0
    return (Date.now() - tripStartTime) / 1000
  }, [tripStartTime, tripPoints.length])

  const currentAvgSpeed = useMemo(() => {
    const hours = currentDurationSeconds / 3600
    return hours > 0 ? totalDistanceKm / hours : 0
  }, [totalDistanceKm, currentDurationSeconds])

  useEffect(() => {
    if (!vehicleId) {
      setTrips([])
      setSummary(null)
      setLoading(false)
      return undefined
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([listTrips({ vehicle: vehicleId }), fetchTripSummary({ vehicle: vehicleId })])
      .then(([rows, tripSummary]) => {
        if (cancelled) return
        setTrips(rows)
        setSummary(tripSummary)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [vehicleId, reloadKey])

  const orderedTrips = useMemo(
    () => [...trips].sort((a, b) => String(b.started_at || b.created_at).localeCompare(String(a.started_at || a.created_at))),
    [trips],
  )

  const todayTrips = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return orderedTrips.filter((trip) => dayKey(trip.started_at) === today)
  }, [orderedTrips])
  const yesterdayTrips = useMemo(() => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    return orderedTrips.filter((trip) => dayKey(trip.started_at) === yesterday)
  }, [orderedTrips])
  const todayStats = summarizeTrips(todayTrips)
  const yesterdayStats = summarizeTrips(yesterdayTrips)
  const comparisonReady = todayStats.count > 0 && yesterdayStats.count > 0
  const efficiencyGain = comparisonReady && yesterdayStats.consumption && todayStats.consumption
    ? Math.round(((yesterdayStats.consumption - todayStats.consumption) / yesterdayStats.consumption) * 100)
    : null

  function updateForm(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function saveTrip(event) {
    event.preventDefault()
    setFormError(null)
    if (!vehicleId) {
      setFormError('Select a vehicle before logging a trip.')
      return
    }
    const payload = {
      vehicle: vehicleId,
      start_location: form.start_location.trim(),
      destination: form.destination.trim(),
      started_at: form.started_at,
      ended_at: form.ended_at,
      distance_km: Number(form.distance_km),
    }
    if (Number(form.fuel_consumed_liters) > 0) payload.fuel_consumed_liters = Number(form.fuel_consumed_liters)
    if (Number(form.fuel_price_per_liter) > 0) payload.fuel_price_per_liter = Number(form.fuel_price_per_liter)
    if (form.notes.trim()) payload.notes = form.notes.trim()
    setSaving(true)
    try {
      await createTrip(payload)
      const [rows, tripSummary] = await Promise.all([
        listTrips({ vehicle: vehicleId }),
        fetchTripSummary({ vehicle: vehicleId }),
      ])
      setTrips(rows)
      setSummary(tripSummary)
      setSavedMessage(`${payload.start_location} → ${payload.destination} recorded.`)
      setStartMapCoords(null); setDestMapCoords(null)
      setForm((current) => ({ ...current, distance_km: '', fuel_consumed_liters: '', notes: '' }))
      setIsFormOpen(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

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
          <p className="trips-vehicle">{vehicle ? `${vehicle.make} ${vehicle.model} · ${vehicle.registration}` : 'Select a vehicle to see trips'}</p>
        </div>
        <div className="trips-header-actions">
          <button className="trips-add-toggle" type="button" onClick={() => { setIsPlannerOpen((open) => !open); setSavedMessage('') }}>
            {isPlannerOpen ? '− CLOSE PLANNER' : '🗺 PLAN TRIP'}
          </button>
          {canAddTrips && (
            <button className="trips-add-toggle" type="button" onClick={() => { setIsFormOpen((open) => !open); setSavedMessage(''); setFormError(null); setStartMapCoords(null); setDestMapCoords(null) }}>
              {isFormOpen ? '− CANCEL' : '+ LOG TRIP'}
            </button>
          )}
        </div>
      </header>

      {isRecording && (
        <section className="trips-panel current-trip-panel" aria-label="Current trip recording">
          <div className="trips-section-heading">
            <div>
              <p className="trips-eyebrow">LIVE GPS TRIP</p>
              <h3>Trip in progress</h3>
            </div>
            <span className={`trip-state ${isRecording ? 'active' : 'stopped'}`}>
              <i /> {isRecording ? 'RECORDING' : 'STOPPED'}
            </span>
          </div>

          {tripRecordingError && (
            <p className="trip-notice" role="alert">{tripRecordingError}</p>
          )}

          <div className="route-map-live">
            <MapView
              center={tripPoints.length > 0 ? [tripPoints[tripPoints.length - 1].latitude, tripPoints[tripPoints.length - 1].longitude] : [0, 0]}
              points={tripPoints.map((p, i) => ({ lat: p.latitude, lng: p.longitude, label: `Point ${i + 1}` }))}
              markers={[
                ...(tripPoints.length > 0
                  ? [
                      {
                        lat: tripPoints[0].latitude,
                        lng: tripPoints[0].longitude,
                        type: 'start',
                        popup: 'Trip start',
                      },
                    ]
                  : []),
                ...(tripPoints.length > 0
                  ? [
                      {
                        lat: tripPoints[tripPoints.length - 1].latitude,
                        lng: tripPoints[tripPoints.length - 1].longitude,
                        type: 'current',
                        popup: 'Current position',
                      },
                    ]
                  : []),
              ]}
              height="300px"
            />
            <p className="route-map-hint">
              {tripPoints.length} GPS point{tripPoints.length === 1 ? '' : 's'} captured
            </p>
          </div>

          <div className="current-trip-metrics">
            <div className="trip-metric">
              <span>DISTANCE</span>
              <strong>{formatDistance(totalDistanceKm)}</strong>
              <small>KM</small>
            </div>
            <div className="trip-metric">
              <span>DURATION</span>
              <strong>{formatDuration(currentDurationSeconds)}</strong>
              <small>ELAPSED</small>
            </div>
            <div className="trip-metric">
              <span>AVG SPEED</span>
              <strong>{formatSpeed(currentAvgSpeed)}</strong>
              <small>KM/H</small>
            </div>
          </div>

          <div className="trip-current-details">
            <div>
              <span>FROM</span>
              <b>{tripStartLocation || (tripPoints.length > 0 ? formatCoords(tripPoints[0].latitude, tripPoints[0].longitude) : 'Locating…')}</b>
            </div>
            <div>
              <span>TO</span>
              <b>{tripDestination || (tripPoints.length > 0 ? `Free destination (${formatCoords(tripPoints[tripPoints.length - 1].latitude, tripPoints[tripPoints.length - 1].longitude)})` : 'Free destination')}</b>
            </div>
          </div>

          <div className="trip-current-inputs">
            <label>
              Start location
              <LocationSearchInput
                name="trip_start_location"
                value={tripStartLocation}
                onChange={(e) => setTripStartLocation(e.target.value)}
                placeholder="Auto-filled from GPS — type to search instead"
              />
            </label>
            <label>
              Destination (set or free)
              <LocationSearchInput
                name="trip_destination"
                value={tripDestination}
                onChange={(e) => setTripDestination(e.target.value)}
                placeholder="Type to search — or leave blank for free"
              />
            </label>
          </div>

          <button
            className="trip-toggle-button end"
            type="button"
            onClick={stopTrip}
            disabled={saving}
          >
            {saving ? 'SAVING…' : 'END TRIP'}
          </button>
        </section>
      )}

      {!isRecording && canAddTrips && (
        <section className="trips-panel current-trip-panel" aria-label="Start GPS trip">
          <div className="trips-section-heading">
            <div>
              <p className="trips-eyebrow">START TRIP</p>
              <h3>Record a live journey</h3>
            </div>
          </div>
          <p className="trip-idle-copy">
            Tap <strong>START TRIP</strong> to begin recording your journey in real time using GPS.
            Your route, distance, duration and average speed will be tracked live on the map below.
            You can set a destination or leave it as a free destination.
          </p>
          <button
            className="trip-toggle-button start"
            type="button"
            onClick={startTrip}
            disabled={saving || !navigator.geolocation}
          >
            {saving ? 'STARTING…' : '▶ START TRIP'}
          </button>
          {!navigator.geolocation && (
            <p className="trip-notice" role="alert">
              Geolocation is not available in this browser.
            </p>
          )}
        </section>
      )}

      {error && (
        <p className="trip-notice" role="alert">
          {error} <button type="button" onClick={() => setReloadKey((key) => key + 1)}>Retry</button>
        </p>
      )}
      {savedMessage && <p className="trip-notice success" role="status">{savedMessage}</p>}
      {formError && <p className="trip-notice" role="alert">{formError}</p>}

      {isPlannerOpen && <TripPlanner vehicle={vehicle} />}

      {isFormOpen && (
        <section className="trips-panel trip-add-panel" aria-labelledby="trip-add-title">
          <div className="trips-section-heading">
            <div>
              <p className="trips-eyebrow">NEW RECORD</p>
              <h3 id="trip-add-title">Log a trip</h3>
            </div>
          </div>
          <form className="trip-add-form" onSubmit={saveTrip}>
            <label>From
              <LocationSearchInput
                name="start_location"
                value={form.start_location}
                onChange={updateForm}
                onSelect={handleStartSearchSelect}
                placeholder="e.g. Kampala — type to search"
                required
              />
            </label>
            <label>To
              <LocationSearchInput
                name="destination"
                value={form.destination}
                onChange={updateForm}
                onSelect={handleDestSearchSelect}
                placeholder="e.g. Entebbe — type to search"
                required
              />
            </label>
            <label>Start
              <input name="started_at" type="datetime-local" value={form.started_at} onChange={updateForm} required />
            </label>
            <label>End
              <input name="ended_at" type="datetime-local" value={form.ended_at} onChange={updateForm} required />
            </label>
            <label>Distance (km)
              <input name="distance_km" type="number" min="0.01" step="0.1" inputMode="decimal" value={form.distance_km} onChange={updateForm} required />
            </label>
            <label>Fuel used (L)
              <input name="fuel_consumed_liters" type="number" min="0" step="0.01" inputMode="decimal" value={form.fuel_consumed_liters} onChange={updateForm} />
            </label>
            <label>Fuel price (UGX / L)
              <input name="fuel_price_per_liter" type="number" min="0" step="1" inputMode="numeric" value={form.fuel_price_per_liter} onChange={updateForm} />
            </label>
            <label className="trip-form-wide">Notes
              <textarea name="notes" rows="2" placeholder="Optional notes" value={form.notes} onChange={updateForm} />
            </label>

            {/* Map pickers for start / destination */}
            <div className="trip-form-wide trip-map-picker-section">
              <h4 className="trip-map-picker-title">Pick locations on map</h4>
              <div className="trip-map-picker-grid">
                <div className="trip-map-picker-panel">
                  <span className="trip-map-picker-label">Start</span>
                  <MapView
                    center={startMapCoords ? [startMapCoords.lat, startMapCoords.lng] : [0, 0]}
                    zoom={startMapCoords ? 16 : 2}
                    markers={startMapCoords ? [{ lat: startMapCoords.lat, lng: startMapCoords.lng, type: 'start', popup: 'Start point' }] : []}
                    height="120px"
                    onMapClick={handleStartMapSelect}
                    showMarker={false}
                  />
                  {startMapCoords && (
                    <span className="trip-map-coords">
                      {startMapCoords.lat.toFixed(4)}, {startMapCoords.lng.toFixed(4)}
                    </span>
                  )}
                </div>
                <div className="trip-map-picker-panel">
                  <span className="trip-map-picker-label">Destination</span>
                  <MapView
                    center={destMapCoords ? [destMapCoords.lat, destMapCoords.lng] : [0, 0]}
                    zoom={destMapCoords ? 16 : 2}
                    markers={destMapCoords ? [{ lat: destMapCoords.lat, lng: destMapCoords.lng, type: 'end', popup: 'Destination' }] : []}
                    height="120px"
                    onMapClick={handleDestMapSelect}
                    showMarker={false}
                  />
                  {destMapCoords && (
                    <span className="trip-map-coords">
                      {destMapCoords.lat.toFixed(4)}, {destMapCoords.lng.toFixed(4)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button className="trip-save-button" type="submit" disabled={saving}>{saving ? 'SAVING…' : 'SAVE TRIP'}</button>
          </form>
        </section>
      )}

      <section className="trip-statistics" aria-label="Trip statistics">
        <div>
          <p className="trips-eyebrow">TODAY</p>
          <strong>{summary ? summary.today.trip_count : '—'}</strong>
          <span>{summary ? `${Number(summary.today.distance_km).toFixed(0)} km · ${formatDuration(summary.today.duration_seconds)}` : 'Loading…'}</span>
          <small>{summary ? `${Number(summary.today.fuel_used_liters).toFixed(1)} L fuel` : ''}</small>
        </div>
        <div>
          <p className="trips-eyebrow">THIS MONTH</p>
          <strong>{summary ? summary.this_month.trip_count : '—'}</strong>
          <span>{summary ? `${Number(summary.this_month.distance_km).toFixed(0)} km · ${formatDuration(summary.this_month.duration_seconds)}` : 'Loading…'}</span>
          <small>{summary ? `${Number(summary.this_month.fuel_used_liters).toFixed(1)} L fuel` : ''}</small>
        </div>
      </section>

      {comparisonReady && (
        <section className="trips-panel" aria-labelledby="trip-comparison-title">
          <div className="trips-section-heading">
            <div>
              <p className="trips-eyebrow">COMPARE JOURNEYS</p>
              <h3 id="trip-comparison-title">Today vs yesterday</h3>
            </div>
            {efficiencyGain !== null && (
              <span className={`comparison-tag ${efficiencyGain < 0 ? 'worse' : ''}`}>
                {efficiencyGain >= 0 ? '−' : '+'}{Math.abs(efficiencyGain)}% FUEL
              </span>
            )}
          </div>
          <div className="trip-comparison-table" role="table" aria-label="Trip comparison">
            <div className="comparison-row comparison-header" role="row"><span role="columnheader">METRIC</span><span role="columnheader">TODAY</span><span role="columnheader">YESTERDAY</span></div>
            <div className="comparison-row" role="row"><span role="cell">Trips</span><span role="cell">{todayStats.count}</span><span role="cell">{yesterdayStats.count}</span></div>
            <div className="comparison-row" role="row"><span role="cell">Distance</span><span role="cell">{todayStats.distance !== null ? `${todayStats.distance.toFixed(1)} km` : '—'}</span><span role="cell">{yesterdayStats.distance !== null ? `${yesterdayStats.distance.toFixed(1)} km` : '—'}</span></div>
            <div className="comparison-row" role="row"><span role="cell">Duration</span><span role="cell">{formatDuration(todayStats.duration)}</span><span role="cell">{formatDuration(yesterdayStats.duration)}</span></div>
            <div className="comparison-row" role="row"><span role="cell">Fuel</span><span role="cell">{todayStats.fuel !== null ? `${todayStats.fuel.toFixed(1)} L` : '—'}</span><span role="cell">{yesterdayStats.fuel !== null ? `${yesterdayStats.fuel.toFixed(1)} L` : '—'}</span></div>
            <div className="comparison-row" role="row"><span role="cell">Consumption</span><span role="cell">{todayStats.consumption !== null ? `${todayStats.consumption.toFixed(1)} L/100 km` : '—'}</span><span role="cell">{yesterdayStats.consumption !== null ? `${yesterdayStats.consumption.toFixed(1)} L/100 km` : '—'}</span></div>
          </div>
          {efficiencyGain !== null && (
            <p className="comparison-insight">
              Today {efficiencyGain >= 0
                ? <>was <strong>{efficiencyGain}% more fuel efficient</strong> than yesterday.</>
                : <>is <strong>{Math.abs(efficiencyGain)}% less fuel efficient</strong> than yesterday.</>}
            </p>
          )}
        </section>
      )}

      <section className="trips-panel" aria-labelledby="trip-history-title">
        <div className="trips-section-heading">
          <div>
            <p className="trips-eyebrow">JOURNEY LOG</p>
            <h3 id="trip-history-title">Recent trips</h3>
          </div>
          <span className="trip-history-count">{orderedTrips.length} TRIP{orderedTrips.length === 1 ? '' : 'S'}</span>
        </div>
        {loading ? (
          <p className="trips-empty">Loading trips…</p>
        ) : orderedTrips.length ? (
          <div className="trip-history-list">
            {orderedTrips.slice(0, 12).map((trip) => {
              const expanded = expandedTrip === trip.id
              const consumption = tripConsumption(trip)
              const distance = Number(trip.distance_km)
              const liters = Number(trip.fuel_consumed_liters)
              return (
                <article className={`trip-history-item ${expanded ? 'expanded' : ''}`} key={trip.id}>
                  <button className="trip-history-row" type="button" aria-expanded={expanded} onClick={() => setExpandedTrip(expanded ? null : trip.id)}>
                    <span className="trip-history-date">{formatDateTime(trip.started_at)}</span>
                    <span className="trip-history-route">
                      <strong>{trip.start_location} → {trip.destination}</strong>
                      <small>{[
                        Number.isFinite(distance) ? `${distance.toFixed(1)} km` : null,
                        formatDuration(trip.duration_seconds),
                        Number.isFinite(liters) ? `${liters.toFixed(1)} L` : null,
                      ].filter(Boolean).join(' · ')}</small>
                    </span>
                    <span className="trip-history-arrow" aria-hidden="true">{expanded ? '−' : '+'}</span>
                  </button>
                  {expanded && (
                    <div className="trip-expanded-details">
                      <span>AVG SPEED <b>{trip.average_speed_kmh !== null && trip.average_speed_kmh !== undefined ? `${Number(trip.average_speed_kmh).toFixed(0)} km/h` : '—'}</b></span>
                      <span>CONSUMPTION <b>{consumption !== null ? `${consumption.toFixed(1)} L/100 km` : '—'}</b></span>
                      <span>FUEL COST <b>{trip.fuel_cost !== null && trip.fuel_cost !== undefined ? formatUgx(trip.fuel_cost) : '—'}</b></span>
                      <span>START ODO <b>{trip.start_odometer_km !== null && trip.start_odometer_km !== undefined ? `${Number(trip.start_odometer_km).toLocaleString('en-UG')} km` : '—'}</b></span>
                      <span>END ODO <b>{trip.end_odometer_km !== null && trip.end_odometer_km !== undefined ? `${Number(trip.end_odometer_km).toLocaleString('en-UG')} km` : '—'}</b></span>
                      {trip.notes && <span>NOTES <b>{trip.notes}</b></span>}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        ) : (
          <p className="trips-empty">No trips recorded yet. Use “Log trip” to add your first journey.</p>
        )}
      </section>
    </section>
  )
}
