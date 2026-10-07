import { useState } from 'react'
import './Trips.css'

const initialTrips = [
  {
    id: 1,
    date: 'Today',
    start: 'Kampala',
    destination: 'Entebbe',
    distance: 32.4,
    duration: '48 min',
    avgSpeed: 52,
    maxSpeed: 86,
    fuel: 2.7,
    rpm: 2180,
    maxRpm: 3920,
    engineLoad: 38,
  },
  {
    id: 2,
    date: 'Yesterday',
    start: 'Entebbe',
    destination: 'Kampala',
    distance: 34.1,
    duration: '52 min',
    avgSpeed: 48,
    maxSpeed: 82,
    fuel: 3.1,
    rpm: 2260,
    maxRpm: 4050,
    engineLoad: 41,
  },
  {
    id: 3,
    date: '02 Oct',
    start: 'Kampala',
    destination: 'Jinja',
    distance: 82.6,
    duration: '1h 42m',
    avgSpeed: 49,
    maxSpeed: 91,
    fuel: 6.8,
    rpm: 2340,
    maxRpm: 4180,
    engineLoad: 44,
  },
]

const fuelPrice = 5200
const yesterdayTrip = initialTrips.find((trip) => trip.date === 'Yesterday')

function formatUgx(value) {
  return `UGX ${Math.round(value).toLocaleString('en-UG')}`
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

export default function Trips({ onBack, vehicle }) {
  const [isActive, setIsActive] = useState(true)
  const [trips, setTrips] = useState(initialTrips)
  const [expandedTrip, setExpandedTrip] = useState(null)
  const [notice, setNotice] = useState('')

  const currentTrip = {
    start: 'Kampala',
    destination: 'Entebbe',
    distance: 32.4,
    duration: '48 min',
    avgSpeed: 52,
    maxSpeed: 86,
    fuel: 2.7,
  }
  const currentCost = currentTrip.fuel * fuelPrice

  function toggleTrip() {
    if (isActive) {
      const completedTrip = {
        id: Date.now(),
        date: 'Just now',
        ...currentTrip,
        rpm: 2180,
        maxRpm: 3920,
        engineLoad: 38,
      }
      setTrips((current) => [completedTrip, ...current])
      setNotice('Trip ended and added to your trip history.')
      setIsActive(false)
    } else {
      setNotice('New simulated trip started from Kampala.')
      setIsActive(true)
    }
  }

  const todayEfficiency = currentTrip.fuel / currentTrip.distance * 100
  const yesterdayEfficiency = yesterdayTrip.fuel / yesterdayTrip.distance * 100
  const efficiencyGain = Math.round((yesterdayEfficiency - todayEfficiency) / yesterdayEfficiency * 100)

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
          <p className="trips-vehicle">{vehicle ? `${vehicle.make} ${vehicle.model} · ${vehicle.registration}` : 'Toyota Premio · UBA 123A'}</p>
        </div>
        <span className={`trip-live-pill ${isActive ? 'active' : 'stopped'}`}><i /> {isActive ? 'LIVE' : 'IDLE'}</span>
      </header>

      {notice && <p className="trip-notice" role="status">{notice}</p>}

      <section className="trips-panel current-trip-panel" aria-labelledby="current-trip-title">
        <div className="trips-section-heading">
          <div>
            <p className="trips-eyebrow">CURRENT TRIP</p>
            <h3 id="current-trip-title">{isActive ? `${currentTrip.start} → ${currentTrip.destination}` : 'No active trip'}</h3>
          </div>
          <span className={`trip-state ${isActive ? 'active' : 'stopped'}`}><i /> {isActive ? 'ACTIVE' : 'ENDED'}</span>
        </div>
        {isActive ? (
          <>
            <div className="current-trip-metrics">
              <TripMetric label="DISTANCE" value={`${currentTrip.distance} km`} />
              <TripMetric label="DURATION" value={currentTrip.duration} />
              <TripMetric label="AVG SPEED" value={`${currentTrip.avgSpeed} km/h`} />
            </div>
            <div className="trip-current-details">
              <span>MAX SPEED <b>{currentTrip.maxSpeed} km/h</b></span>
              <span>FUEL USED <b>{currentTrip.fuel.toFixed(1)} L</b></span>
              <span>ARRIVAL <b>11:48 AM</b></span>
            </div>
          </>
        ) : (
          <p className="trip-idle-copy">Start a simulated trip to begin tracking distance, time, speed and fuel use.</p>
        )}
        <button className={`trip-toggle-button ${isActive ? 'end' : 'start'}`} type="button" onClick={toggleTrip}>
          {isActive ? 'END TRIP' : 'START TRIP'}
        </button>
      </section>

      <section className="trips-panel route-panel" aria-labelledby="route-title">
        <div className="trips-section-heading">
          <div>
            <p className="trips-eyebrow">SIMULATED ROUTE</p>
            <h3 id="route-title">Route overview</h3>
          </div>
          <span className="route-distance">{currentTrip.distance} KM</span>
        </div>
        <div className="route-map" role="img" aria-label="Illustrated route from Kampala to Entebbe via Kira">
          <div className="map-grid" />
          <div className="map-road road-one" />
          <div className="map-road road-two" />
          <div className="map-road road-three" />
          <svg className="route-path" viewBox="0 0 600 190" preserveAspectRatio="none" aria-hidden="true">
            <path d="M110 40 C118 65 130 74 196 94 S310 123 380 110 S470 104 515 151" />
          </svg>
          <span className="route-stop route-start"><i /> <b>KAMPALA</b></span>
          <span className="route-stop route-kira"><i /> <b>KIRA</b></span>
          <span className="route-stop route-end"><i /> <b>ENTEBBE</b></span>
          <span className="route-map-caption">Kampala · Central Region</span>
        </div>
        <div className="route-info"><span>Current location <b>Entebbe Road</b></span><span>Estimated arrival <b>11:48 AM</b></span></div>
      </section>

      <div className="trip-highlight-grid">
        <section className="trips-panel trip-highlight">
          <p className="trips-eyebrow">TRIP FUEL</p>
          <strong>{currentTrip.fuel.toFixed(1)} <small>L</small></strong>
          <p>{formatUgx(currentCost)} estimated cost</p>
          <span>{todayEfficiency.toFixed(1)} L/100 km · {formatUgx(currentCost / currentTrip.distance)}/km</span>
        </section>
        <section className="trips-panel trip-highlight score-highlight">
          <p className="trips-eyebrow">TRIP EFFICIENCY</p>
          <strong>84<small>%</small></strong>
          <p className="score-good"><i /> GOOD</p>
          <span>Fuel and speed behaviour</span>
        </section>
      </div>

      <section className="trips-panel" aria-labelledby="trip-performance-title">
        <div className="trips-section-heading">
          <div>
            <p className="trips-eyebrow">HOW THE VEHICLE PERFORMED</p>
            <h3 id="trip-performance-title">Trip performance</h3>
          </div>
        </div>
        <div className="performance-metrics">
          <TripMetric label="CURRENT SPEED" value="64 km/h" />
          <TripMetric label="FUEL EFFICIENCY" value={`${todayEfficiency.toFixed(1)} L/100 km`} />
          <TripMetric label="AVERAGE RPM" value="2,180" />
          <TripMetric label="MAXIMUM RPM" value="3,920" />
          <TripMetric label="ENGINE LOAD" value="38%" />
          <TripMetric label="MAX SPEED" value={`${currentTrip.maxSpeed} km/h`} />
        </div>
      </section>

      <section className="trips-panel" aria-labelledby="driving-behaviour-title">
        <div className="trips-section-heading">
          <div>
            <p className="trips-eyebrow">DRIVER INSIGHTS</p>
            <h3 id="driving-behaviour-title">Driving behaviour</h3>
          </div>
          <span className="smooth-score">86% smooth</span>
        </div>
        <div className="driving-events">
          <div><span className="event-warning">!</span><span>Hard acceleration</span><b>3</b></div>
          <div><span className="event-warning">!</span><span>Hard braking</span><b>2</b></div>
          <div><span className="event-warning">!</span><span>Overspeed</span><b>1</b></div>
          <div><span className="event-good">✓</span><span>Excessive idle</span><b>0</b></div>
          <div><span className="event-good">✓</span><span>Smooth driving</span><b>86%</b></div>
        </div>
      </section>

      <section className="trips-panel" aria-labelledby="trip-history-title">
        <div className="trips-section-heading">
          <div>
            <p className="trips-eyebrow">JOURNEY LOG</p>
            <h3 id="trip-history-title">Recent trips</h3>
          </div>
          <span className="trip-history-count">{trips.length} TRIPS</span>
        </div>
        <div className="trip-history-list">
          {trips.map((trip) => {
            const expanded = expandedTrip === trip.id
            const consumption = trip.fuel / trip.distance * 100
            return (
              <article className={`trip-history-item ${expanded ? 'expanded' : ''}`} key={trip.id}>
                <button className="trip-history-row" type="button" aria-expanded={expanded} onClick={() => setExpandedTrip(expanded ? null : trip.id)}>
                  <span className="trip-history-date">{trip.date}</span>
                  <span className="trip-history-route"><strong>{trip.start} → {trip.destination}</strong><small>{trip.distance.toFixed(1)} km · {trip.duration} · {trip.fuel.toFixed(1)} L</small></span>
                  <span className="trip-history-arrow" aria-hidden="true">{expanded ? '−' : '+'}</span>
                </button>
                {expanded && (
                  <div className="trip-expanded-details">
                    <span>AVG SPEED <b>{trip.avgSpeed} km/h</b></span>
                    <span>MAX SPEED <b>{trip.maxSpeed} km/h</b></span>
                    <span>CONSUMPTION <b>{consumption.toFixed(1)} L/100 km</b></span>
                    <span>FUEL COST <b>{formatUgx(trip.fuel * fuelPrice)}</b></span>
                    <span>AVG RPM <b>{trip.rpm.toLocaleString('en-UG')}</b></span>
                    <span>ENGINE LOAD <b>{trip.engineLoad}%</b></span>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>

      <section className="trips-panel" aria-labelledby="trip-comparison-title">
        <div className="trips-section-heading">
          <div>
            <p className="trips-eyebrow">COMPARE JOURNEYS</p>
            <h3 id="trip-comparison-title">Today vs yesterday</h3>
          </div>
          <span className="comparison-tag">−{efficiencyGain}% FUEL</span>
        </div>
        <div className="trip-comparison-table" role="table" aria-label="Trip comparison">
          <div className="comparison-row comparison-header" role="row"><span role="columnheader">METRIC</span><span role="columnheader">TODAY</span><span role="columnheader">YESTERDAY</span></div>
          <div className="comparison-row" role="row"><span role="cell">Distance</span><span role="cell">32.4 km</span><span role="cell">34.1 km</span></div>
          <div className="comparison-row" role="row"><span role="cell">Duration</span><span role="cell">48 min</span><span role="cell">52 min</span></div>
          <div className="comparison-row" role="row"><span role="cell">Fuel</span><span role="cell">2.7 L</span><span role="cell">3.1 L</span></div>
          <div className="comparison-row" role="row"><span role="cell">Consumption</span><span role="cell">{todayEfficiency.toFixed(1)} L/100 km</span><span role="cell">{yesterdayEfficiency.toFixed(1)} L/100 km</span></div>
          <div className="comparison-row" role="row"><span role="cell">Avg speed</span><span role="cell">52 km/h</span><span role="cell">48 km/h</span></div>
        </div>
        <p className="comparison-insight">Today's trip was <strong>{efficiencyGain}% more fuel efficient</strong> than yesterday.</p>
      </section>

      <section className="trip-statistics" aria-label="Trip statistics">
        <div><p className="trips-eyebrow">TODAY</p><strong>3</strong><span>trips · 86 km · 2h 14m</span><small>7.2 L fuel</small></div>
        <div><p className="trips-eyebrow">THIS MONTH</p><strong>48</strong><span>trips · 1,240 km · 31h</span><small>96 L fuel</small></div>
      </section>
      <p className="trips-demo-note">Trip routes, driving events and vehicle performance are simulated sample data.</p>
    </section>
  )
}
