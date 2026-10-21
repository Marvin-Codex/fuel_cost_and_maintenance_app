/** Simple Leaflet map component for the FuelMaintenance web dashboard.
 *
 * Usage:
 *   <MapView
 *     center={[lat, lng]}
 *     zoom={13}
 *     points={[{lat, lng, label}]}
 *     markers={[{lat, lng, popup, type}]}  // type: 'start' | 'current' | 'end'
 *     showMarker={true}
 *     minZoom={2}
 *     onMapClick={(lat, lng) => {}}
 *   />
 *
 * Uses custom CSS DivIcon markers (a pulsing blue dot for the current
 * position and labelled START/END pins) so icons never break under the
 * bundler, and a two-pass polyline (dark casing + bright route) so the
 * travel route is clearly visible against any map tiles.
 */
import { useEffect, useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './MapView.css'

// Helper component that attaches click events to the map instance.
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng)
      }
    },
  })
  return null
}

/* ── Custom DivIcon markers (pure CSS, bundler-safe) ───────────── */
const iconMe = L.divIcon({
  className: 'fm-map-me',
  html: '<span class="fm-map-me-dot"></span>',
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

const iconStart = L.divIcon({
  className: 'fm-map-pin',
  html: '<span class="fm-map-pin-dot fm-map-pin-dot--start"></span><span class="fm-map-pin-label fm-map-pin-label--start">START</span>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

const iconEnd = L.divIcon({
  className: 'fm-map-pin',
  html: '<span class="fm-map-pin-dot fm-map-pin-dot--end"></span><span class="fm-map-pin-label fm-map-pin-label--end">END</span>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
})

function makeSelectionPin(label) {
  const text = (label || 'SELECTED').toUpperCase().slice(0, 14)
  return L.divIcon({
    className: 'fm-map-pin',
    html: `<span class="fm-map-pin-dot fm-map-pin-dot--sel"></span><span class="fm-map-pin-label fm-map-pin-label--sel">${text}</span>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  })
}

// Pick the right icon based on marker type (explicit) or its label text.
function iconForMarker(marker) {
  const kind = String(marker.type || marker.popup || marker.label || '').toLowerCase()
  if (kind.includes('current') || kind.includes('here') || kind.includes('live')) return iconMe
  if (kind.includes('start')) return iconStart
  if (kind.includes('end') || kind.includes('stop') || kind.includes('dest')) return iconEnd
  return makeSelectionPin(marker.popup || marker.label)
}

export function MapView({
  center = [51.505, -0.09],
  zoom = 13,
  points = [],
  markers = [],
  showMarker = true,
  minZoom = 2,
  maxZoom = 19,
  height = '300px',
  width = '100%',
  onMapClick,
}) {
  const mapRef = useRef(null)

  const routePath = useMemo(() => points.map((p) => [p.lat, p.lng]), [points])

  // Fit bounds to points when they change
  useEffect(() => {
    if (mapRef.current && points.length > 0) {
      const bounds = points.map((p) => [p.lat, p.lng])
      mapRef.current.flyToBounds(bounds, { padding: [40, 40], maxZoom: 16 })
    }
  }, [points])

  return (
    <div style={{ height, width, borderRadius: 9, overflow: 'hidden', border: '1px solid #1c2943' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        ref={mapRef}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="/osm-tiles/{z}/{x}/{y}.png"
        />
        <MapClickHandler onMapClick={onMapClick} />
        {markers.map((marker, i) => (
          <Marker key={i} position={[marker.lat, marker.lng]} icon={iconForMarker(marker)}>
            <Popup>{marker.popup || marker.label}</Popup>
          </Marker>
        ))}
        {/* Fallback live pointer on the newest GPS point */}
        {showMarker && markers.length === 0 && points.length > 0 && (
          <Marker position={[points[points.length - 1].lat, points[points.length - 1].lng]} icon={iconMe}>
            <Popup>Current position</Popup>
          </Marker>
        )}
        {/* Route: dark casing underneath + bright line on top for contrast */}
        {routePath.length > 1 && (
          <>
            <Polyline
              positions={routePath}
              pathOptions={{ color: '#061019', weight: 10, opacity: 0.7, lineCap: 'round', lineJoin: 'round' }}
            />
            <Polyline
              positions={routePath}
              pathOptions={{ color: '#22d3ee', weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round' }}
            />
          </>
        )}
      </MapContainer>
    </div>
  )
}

/** Minimal standalone map for the "Log trip" form so users can pick
 *  start / destination by clicking the map. Returns lat/lng on click. */
export function MapPicker({ onSelect, initialCenter = [0, 0], zoom = 13, width = '100%', height = '200px', label = 'SELECTED' }) {
  return (
    <div style={{ height, width, borderRadius: 9, overflow: 'hidden', border: '1px solid #1c2943' }}>
      <MapContainer
        center={initialCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="/osm-tiles/{z}/{x}/{y}.png"
        />
        <MapClickHandler onMapClick={onSelect} />
        <Marker position={initialCenter} icon={makeSelectionPin(label)} />
      </MapContainer>
    </div>
  )
}