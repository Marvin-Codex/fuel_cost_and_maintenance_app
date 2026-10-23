/* Temporary manual probe harness for LocationSearchInput.
   Reproduces the live-trip panel's `overflow: hidden` ancestor and stubs the
   Nominatim response so the suggestion panel can be inspected in a browser.
   Not part of the app bundle — delete after verification. */
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import LocationSearchInput from './components/ui/LocationSearchInput'
import LocationSearchInputOld from './components/ui/LocationSearchInputOld'
import './pages/Trips.css'
import './styles/tokens.css'
import './index.css'

const SAMPLE = [
  { name: 'Kampala', display_name: 'Kampala, Kampala, Central, Uganda', lat: '0.3476', lon: '32.5825', type: 'city', category: 'place' },
  { name: 'Kampala', display_name: 'Kampala Central, Kampala, Central, Uganda', lat: '0.3116', lon: '32.5725', type: 'suburb', category: 'place' },
  { name: 'Kampala Road', display_name: 'Kampala Road, Jinja, Uganda', lat: '0.4000', lon: '33.2000', type: 'road', category: 'highway' },
  { name: 'Kampala', display_name: 'Kampala, Wakiso, Central, Uganda', lat: '0.5350', lon: '32.6500', type: 'town', category: 'place' },
  { name: 'Kampala Market', display_name: 'Kampala Market, Kampala, Uganda', lat: '0.3450', lon: '32.5800', type: 'amenity', category: 'shop' },
]

const origFetch = window.fetch.bind(window)
window.__fetchCalls = []
window.fetch = async (url, opts) => {
  window.__fetchCalls.push(String(url))
  if (String(url).includes('/osm-geocode/search')) {
    await new Promise((resolve) => setTimeout(resolve, 50))
    return { ok: true, json: async () => SAMPLE }
  }
  return origFetch(url, opts)
}

function Probe() {
  const [value, setValue] = useState('')
  const [oldValue, setOldValue] = useState('')
  return (
    <div className="dashboard-shell" style={{ padding: 24 }}>
      <section className="dashboard-content">
        <div className="trips-view">
          {/* Mirrors the live-trip panel: `overflow: hidden` clips a
              normally-positioned dropdown. */}
          <section className="trips-panel current-trip-panel" aria-label="Current trip recording">
            <div className="trips-section-heading">
              <div>
                <p className="trips-eyebrow">LIVE GPS TRIP</p>
                <h3>Trip in progress</h3>
              </div>
            </div>
            <div className="trip-current-inputs">
              <label>
                Start location
                <LocationSearchInput
                  name="trip_start_location"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Auto-filled from GPS — type to search instead"
                />
              </label>
              <label>
                Destination (set or free)
                <LocationSearchInput
                  name="trip_destination"
                  value=""
                  onChange={() => {}}
                  placeholder="Type to search — or leave blank for free"
                />
              </label>
            </div>
          </section>

          {/* Same panel, but using the ORIGINAL component for comparison. */}
          <section className="trips-panel current-trip-panel" aria-label="Old component comparison">
            <div className="trips-section-heading">
              <div>
                <p className="trips-eyebrow">OLD BEHAVIOUR</p>
                <h3>Pre-fix dropdown</h3>
              </div>
            </div>
            <div className="trip-current-inputs">
              <label>
                Start location
                <LocationSearchInputOld
                  name="old_start_location"
                  value={oldValue}
                  onChange={(e) => setOldValue(e.target.value)}
                  placeholder="Auto-filled from GPS — type to search instead"
                />
              </label>
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Probe />
  </StrictMode>,
)
