import { useEffect, useMemo, useRef, useState, Fragment } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import LocationSearchInput from './LocationSearchInput'
import * as auth from '../../api/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? '' : 'http://localhost:8000')

function iconStart() {
  return L.divIcon({
    className: 'fm-map-pin',
    html: '<span class="fm-map-pin-dot fm-map-pin-dot--start"></span><span class="fm-map-pin-label fm-map-pin-label--start">START</span>',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })
}
function iconEnd() {
  return L.divIcon({
    className: 'fm-map-pin',
    html: '<span class="fm-map-pin-dot fm-map-pin-dot--end"></span><span class="fm-map-pin-label fm-map-pin-label--end">END</span>',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick && onMapClick(e.latlng.lat, e.latlng.lng) })
  return null
}

function PlannerMap({ start, end, routes = [], selected = 0, onMapClick }) {
  const center = start ? [start.lat, start.lng] : end ? [end.lat, end.lng] : [0.3476, 32.5825]
  const zoom = start || end ? 11 : 6
  const mapRef = useRef(null)
  const selectedRoute = (Array.isArray(routes) ? routes[selected] : null) || null
  const selectedGeom = selectedRoute?.geometry || []
  useEffect(() => {
    if (!mapRef.current) return
    const pts = []
    if (start) pts.push([start.lat, start.lng])
    if (end) pts.push([end.lat, end.lng])
    if (selectedGeom && selectedGeom.length) pts.push(...selectedGeom)
    if (pts.length > 1) {
      const bounds = L.latLngBounds(pts)
      mapRef.current.flyToBounds(bounds, { padding: [30, 30], maxZoom: 15 })
    } else if (pts.length === 1) {
      mapRef.current.setView(pts[0], 14)
    }
  }, [start, end, selectedGeom])
  return (
    <div style={{ height: '260px', width: '100%', borderRadius: 9, overflow: 'hidden', border: '1px solid #1c2943' }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} ref={mapRef}>
        <TileLayer attribution='&copy; OpenStreetMap contributors' url="/osm-tiles/{z}/{x}/{y}.png" />
        <MapClickHandler onMapClick={onMapClick} />
        {start && <Marker position={[start.lat, start.lng]} icon={iconStart()} />}
        {end && <Marker position={[end.lat, end.lng]} icon={iconEnd()} />}
        {Array.isArray(routes) && routes.map((r, i) => {
          const geom = Array.isArray(r?.geometry) ? r.geometry : []
          if (geom.length < 2) return null
          const isSelected = i === selected
          if (isSelected) {
            return (
              <Fragment key={`route-${i}`}>
                <Polyline positions={geom} pathOptions={{ color: '#061019', weight: 9, opacity: 0.7, lineCap: 'round', lineJoin: 'round' }} />
                <Polyline positions={geom} pathOptions={{ color: '#22d3ee', weight: 4, opacity: 1, lineCap: 'round', lineJoin: 'round' }} />
              </Fragment>
            )
          }
          return (
            <Polyline key={`route-${i}`} positions={geom} pathOptions={{ color: '#94a3b8', weight: 3, opacity: 0.55, dashArray: '6 6', lineCap: 'round', lineJoin: 'round' }} />
          )
        })}
      </MapContainer>
    </div>
  )
}
function formatKm(km) {
  if (!Number.isFinite(km)) return '—'
  return km.toFixed(1)
}
function formatMin(sec) {
  if (!Number.isFinite(sec)) return '—'
  const m = Math.round(sec / 60)
  if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`
  return `${m} min`
}
function formatUgx(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `UGX ${Math.round(n).toLocaleString('en-UG')}`
}

export default function TripPlanner({ vehicle, onStartTrip }) {
  const [startText, setStartText] = useState('')
  const [destText, setDestText] = useState('')
  const [startCoords, setStartCoords] = useState(null)
  const [destCoords, setDestCoords] = useState(null)
  const [fuelPrice, setFuelPrice] = useState('')
  const [consumption, setConsumption] = useState('8')
  const [routes, setRoutes] = useState([])
  const [selected, setSelected] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [serviceNotice, setServiceNotice] = useState(null)
  const [locating, setLocating] = useState(null)
  const [picking, setPicking] = useState('start')
  const debounceRef = useRef(null)

  async function reverseGeocode(lat, lng) {
    try {
      const res = await fetch(`/osm-geocode/reverse?format=jsonv2&zoom=16&lat=${lat}&lon=${lng}`, { headers: { Accept: 'application/json' } })
      if (!res.ok) return null
      const data = await res.json()
      const a = data.address || {}
      const label = [a.road, a.suburb || a.village || a.town || a.city || a.county].filter(Boolean).slice(0, 2).join(', ')
      return label || (data.display_name ? data.display_name.split(',').slice(0, 2).join(',').trim() : null)
    } catch {
      return null
    }
  }

  function locateCurrentPosition(which) {
    if (!navigator.geolocation) {
      setError('Geolocation is not available in this browser.')
      return
    }
    setLocating(which)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        const coords = { lat: latitude, lng: longitude }
        const label = (await reverseGeocode(latitude, longitude)) || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
        if (which === 'start') {
          setStartCoords(coords)
          setStartText(label)
        } else {
          setDestCoords(coords)
          setDestText(label)
        }
        setLocating(null)
      },
      (err) => {
        setError(err.message || 'Unable to access current location.')
        setLocating(null)
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 },
    )
  }

  async function planRoute() {
    if (!startCoords || !destCoords) return
    setLoading(true)
    setError(null)
    setServiceNotice(null)
    try {
      const token = auth.readToken()
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const coords = `${startCoords.lng},${startCoords.lat};${destCoords.lng},${destCoords.lat}`
      const url = `${API_BASE_URL}/api/v1/route/?coordinates=${encodeURIComponent(coords)}&alternatives=true`
      let res = await fetch(url, { headers })
      if (res.status === 401) {
        const refreshed = await auth.refresh()
        if (refreshed) res = await fetch(url, { headers: { Authorization: `Bearer ${refreshed}` } })
      }
      if (!res.ok) throw new Error('Route request failed')
      const data = await res.json()
      if (data.fallback) {
        setServiceNotice(
          'Routing service unavailable — showing a direct line instead of a road route.'
        )
      }
      const osrmRoutes = Array.isArray(data.routes) ? data.routes : []
      const mapped = osrmRoutes.map((r, i) => ({
        index: i,
        distanceKm: (r.distance || 0) / 1000,
        durationSec: r.duration || 0,
        geometry: Array.isArray(r.geometry?.coordinates) ? r.geometry.coordinates.map(([lng, lat]) => [lat, lng]) : [],
        summary: (r.legs || []).map((l) => l.summary).filter(Boolean).join(' → ') || `Route ${i + 1}`,
      }))
      if (!mapped.length) throw new Error('No route found')
      setRoutes(mapped)
      setSelected(0)
    } catch (e) {
      setError(e.message || 'Failed to plan route')
      setRoutes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!startCoords || !destCoords) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      planRoute()
    }, 700)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startCoords, destCoords])

  function handleMapClick(lat, lng) {
    const coords = { lat, lng }
    if (picking === 'start') {
      setStartCoords(coords)
      reverseGeocode(lat, lng).then((label) => {
        if (label) setStartText(label)
      })
    } else {
      setDestCoords(coords)
      reverseGeocode(lat, lng).then((label) => {
        if (label) setDestText(label)
      })
    }
  }

  const selectedRoute = routes[selected] || null
  const fuelLiters = selectedRoute
    ? (selectedRoute.distanceKm * (Number(consumption) || 0)) / 100
    : null
  const tripCost = fuelLiters !== null && fuelPrice
    ? fuelLiters * Number(fuelPrice)
    : null

  return (
    <section className="trip-planner" aria-labelledby="trip-planner-title">
      <div className="trips-section-heading">
        <div>
          <p className="trips-eyebrow">ROUTE PLANNER</p>
          <h3 id="trip-planner-title">Plan a trip</h3>
        </div>
      </div>

      <div className="trip-planner-grid">
        <label>
          From
          <div className="trip-planner-input-row">
            <LocationSearchInput
              name="planner_start"
              value={startText}
              onChange={(e) => setStartText(e.target.value)}
              onSelect={(place) => {
                setStartText(place.label)
                setStartCoords({ lat: place.lat, lng: place.lng })
              }}
              placeholder="Type start location…"
            />
            <button type="button" className="trip-planner-locate" onClick={() => locateCurrentPosition('start')} disabled={locating === 'start'} title="Use current location">
              {locating === 'start' ? '…' : '📍'}
            </button>
          </div>
        </label>
        <label>
          To
          <div className="trip-planner-input-row">
            <LocationSearchInput
              name="planner_dest"
              value={destText}
              onChange={(e) => setDestText(e.target.value)}
              onSelect={(place) => {
                setDestText(place.label)
                setDestCoords({ lat: place.lat, lng: place.lng })
              }}
              placeholder="Type destination…"
            />
            <button type="button" className="trip-planner-locate" onClick={() => locateCurrentPosition('dest')} disabled={locating === 'dest'} title="Use current location">
              {locating === 'dest' ? '…' : '📍'}
            </button>
          </div>
        </label>
      </div>

      <div className="trip-planner-pick-row">
        <span>Map click sets:</span>
        <button type="button" className={picking === 'start' ? 'active' : ''} onClick={() => setPicking('start')}>Start</button>
        <button type="button" className={picking === 'dest' ? 'active' : ''} onClick={() => setPicking('dest')}>Destination</button>
      </div>

      <PlannerMap start={startCoords} end={destCoords} routes={routes} selected={selected} onMapClick={handleMapClick} />

      <div className="trip-planner-grid">
        <label>
          Fuel price (UGX / L)
          <input type="number" min="0" step="1" value={fuelPrice} onChange={(e) => setFuelPrice(e.target.value)} placeholder="e.g. 5200" />
        </label>
        <label>
          Consumption (L / 100 km)
          <input type="number" min="0" step="0.1" value={consumption} onChange={(e) => setConsumption(e.target.value)} placeholder="e.g. 8" />
        </label>
      </div>

      <div className="trip-planner-actions">
        <button type="button" className="trip-save-button" onClick={planRoute} disabled={loading || !startCoords || !destCoords}>
          {loading ? 'PLANNING…' : 'PLAN ROUTE'}
        </button>
        {selectedRoute && typeof onStartTrip === 'function' && (
          <button
            type="button"
            className="trip-save-button trip-start-button"
            onClick={() => {
              const liters = Number.isFinite(fuelLiters) && fuelLiters > 0 ? fuelLiters : null
              const cost = tripCost !== null && tripCost > 0 ? tripCost : null
              onStartTrip({
                startLocation: startText || `${startCoords.lat.toFixed(5)}, ${startCoords.lng.toFixed(5)}`,
                destination: destText || `${destCoords.lat.toFixed(5)}, ${destCoords.lng.toFixed(5)}`,
                estimatedDistanceKm: selectedRoute.distanceKm,
                estimatedDurationSec: selectedRoute.durationSec,
                estimatedFuelLiters: liters,
                estimatedCost: cost,
                fuelPrice: fuelPrice ? Number(fuelPrice) : null,
                consumption: consumption ? Number(consumption) : null,
              })
            }}
          >
            START TRIP
          </button>
        )}
      </div>

      {error && <p className="trip-notice" role="alert">{error}</p>}
      {serviceNotice && <p className="trip-notice" role="status">{serviceNotice}</p>}

      {routes.length > 0 && (
        <div className="trip-planner-routes">
          <p className="trips-eyebrow">POSSIBLE ROUTES ({routes.length})</p>
          {routes.map((route, i) => {
            const liters = (route.distanceKm * (Number(consumption) || 0)) / 100
            const cost = liters && fuelPrice ? liters * Number(fuelPrice) : null
            return (
              <button
                key={i}
                type="button"
                className={`trip-planner-route ${selected === i ? 'selected' : ''}`}
                onClick={() => setSelected(i)}
              >
                <span className="trip-planner-route-title">Route {i + 1}{route.summary ? ` · ${route.summary}` : ''}</span>
                <span className="trip-planner-route-meta">
                  {formatKm(route.distanceKm)} km · {formatMin(route.durationSec)} · {Number.isFinite(liters) ? liters.toFixed(1) : '—'} L
                  {cost !== null ? ` · ${formatUgx(cost)}` : ''}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {selectedRoute && (
        <div className="trip-planner-summary">
          <div className="trip-metric"><span>SELECTED DISTANCE</span><strong>{formatKm(selectedRoute.distanceKm)}</strong><small>KM</small></div>
          <div className="trip-metric"><span>DURATION</span><strong>{formatMin(selectedRoute.durationSec)}</strong><small>EST.</small></div>
          <div className="trip-metric"><span>FUEL REQUIRED</span><strong>{Number.isFinite(fuelLiters) ? fuelLiters.toFixed(1) : '—'}</strong><small>L</small></div>
          <div className="trip-metric"><span>TRIP COST</span><strong>{tripCost !== null ? formatUgx(tripCost) : '—'}</strong><small>UGX</small></div>
        </div>
      )}
    </section>
  )
}
