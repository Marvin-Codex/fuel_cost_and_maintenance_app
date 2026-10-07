import { useState } from 'react'
import './Services.css'

const initialHistory = [
  { id: 1, date: '2026-09-28', title: 'Oil & Filter Change', odometer: 43000, cost: 180000, parts: 'Oil filter, 5W-30 oil' },
  { id: 2, date: '2026-08-15', title: 'Brake Inspection', odometer: 41500, cost: 75000, parts: 'Brake pads checked' },
  { id: 3, date: '2026-07-02', title: 'Air Filter Replacement', odometer: 39800, cost: 65000, parts: 'Air filter' },
]

const upcomingServices = [
  { title: 'Oil Change', distance: '620 km', estimate: '7 days', icon: '◉' },
  { title: 'Brake Inspection', distance: '1,850 km', estimate: null, icon: '⌁' },
  { title: 'Air Filter', distance: '3,200 km', estimate: null, icon: '◌' },
]

const components = [
  { title: 'Engine Oil', status: 'GOOD', tone: 'good' },
  { title: 'Brake Pads', status: 'DUE SOON', tone: 'warning' },
  { title: 'Battery', status: 'GOOD', tone: 'good' },
  { title: 'Air Filter', status: 'GOOD', tone: 'good' },
  { title: 'Coolant', status: 'GOOD', tone: 'good' },
]

function formatCost(value) {
  return `UGX ${Number(value).toLocaleString('en-UG')}`
}

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function Services({ onBack, vehicle }) {
  const [history, setHistory] = useState(initialHistory)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')
  const [form, setForm] = useState({
    type: 'Oil Change',
    date: '2026-10-07',
    odometer: '42580',
    cost: '',
    parts: '',
    notes: '',
  })

  function updateForm(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  function saveService(event) {
    event.preventDefault()
    const newRecord = {
      id: Date.now(),
      title: form.type,
      date: form.date,
      odometer: Number(form.odometer),
      cost: Number(form.cost),
      parts: form.parts || 'No parts listed',
      notes: form.notes,
    }
    setHistory((current) => [newRecord, ...current])
    setSavedMessage(`${form.type} recorded successfully.`)
    setForm((current) => ({ ...current, cost: '', parts: '', notes: '' }))
    setIsFormOpen(false)
  }

  return (
    <section className="services-view" aria-labelledby="services-title">
      <header className="services-heading">
        <button className="services-back" type="button" onClick={onBack} aria-label="Back to dashboard" title="Back to dashboard">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m15 18-6-6 6-6M9 12h12" />
          </svg>
        </button>
        <div>
          <p className="services-eyebrow">VEHICLE MAINTENANCE</p>
          <h2 id="services-title">Services</h2>
          <p className="services-vehicle">{vehicle ? `${vehicle.make} ${vehicle.model} · ${vehicle.registration}` : 'Toyota Premio · UBA 123A'}</p>
        </div>
        <span className="services-system-status"><i /> SYSTEM OK</span>
      </header>

      <section className="services-panel service-health-panel" aria-labelledby="service-health-title">
        <div className="services-panel-heading">
          <div>
            <p className="services-eyebrow">SERVICE HEALTH</p>
            <h3 id="service-health-title">Vehicle maintenance</h3>
          </div>
          <span className="health-score">87<span>%</span></span>
        </div>
        <div className="health-score-caption"><span className="health-indicator" /> GOOD <span>Based on your latest service records</span></div>
        <div className="service-health-meter" role="meter" aria-label="Vehicle service health" aria-valuemin="0" aria-valuemax="100" aria-valuenow="87">
          <span />
        </div>
      </section>

      <div className="service-summary-grid">
        <article className="services-panel service-summary-card">
          <p className="services-eyebrow">NEXT SERVICE</p>
          <strong>1,240 <small>km</small></strong>
          <p>remaining · Due at 43,820 km</p>
          <span className="summary-date">About 12 days remaining</span>
        </article>
        <article className="services-panel service-summary-card cost-summary">
          <p className="services-eyebrow">SERVICE COST · THIS MONTH</p>
          <strong>UGX 450K</strong>
          <p>UGX 2.84M this year</p>
          <span className="summary-date">Average service · UGX 237K</span>
        </article>
      </div>

      <section className="services-panel" aria-labelledby="upcoming-services-title">
        <div className="services-panel-heading">
          <div>
            <p className="services-eyebrow">PLAN AHEAD</p>
            <h3 id="upcoming-services-title">Upcoming services</h3>
          </div>
          <span className="services-count">3 DUE</span>
        </div>
        <div className="upcoming-list">
          {upcomingServices.map((service) => (
            <article className="upcoming-row" key={service.title}>
              <span className="upcoming-icon" aria-hidden="true">{service.icon}</span>
              <div className="upcoming-copy">
                <strong>{service.title}</strong>
                {service.estimate && <small>Estimated in {service.estimate}</small>}
              </div>
              <span className="upcoming-distance">{service.distance}<small>remaining</small></span>
            </article>
          ))}
        </div>
      </section>

      <section className="services-panel" aria-labelledby="component-health-title">
        <div className="services-panel-heading">
          <div>
            <p className="services-eyebrow">VEHICLE CHECK</p>
            <h3 id="component-health-title">Component health</h3>
          </div>
          <span className="component-caption">5 components</span>
        </div>
        <div className="component-list">
          {components.map((component) => (
            <div className="component-row" key={component.title}>
              <span>{component.title}</span>
              <span className={`component-status ${component.tone}`}><i /> {component.status}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="services-panel" aria-labelledby="service-history-title">
        <div className="services-panel-heading service-history-heading">
          <div>
            <p className="services-eyebrow">YOUR MAINTENANCE LOG</p>
            <h3 id="service-history-title">Service history</h3>
          </div>
          <span className="component-caption">{history.length} records</span>
        </div>
        {savedMessage && <p className="service-saved-message" role="status">{savedMessage}</p>}
        <div className="service-history-list">
          {history.map((record) => (
            <article className="service-history-row" key={record.id}>
              <span className="history-date">{formatDate(record.date)}</span>
              <div className="history-service">
                <strong>{record.title}</strong>
                <small>{record.odometer.toLocaleString('en-UG')} km · {record.parts}</small>
                {record.notes && <small>{record.notes}</small>}
              </div>
              <strong className="history-cost">{formatCost(record.cost)}</strong>
            </article>
          ))}
        </div>
        <button className="add-service-button" type="button" onClick={() => { setIsFormOpen((open) => !open); setSavedMessage('') }}>
          <span aria-hidden="true">{isFormOpen ? '−' : '+'}</span> {isFormOpen ? 'CANCEL' : 'ADD SERVICE'}
        </button>
        {isFormOpen && (
          <form className="add-service-form" onSubmit={saveService}>
            <div className="form-grid">
              <label>
                Service type
                <select name="type" value={form.type} onChange={updateForm}>
                  <option>Oil Change</option>
                  <option>Brake Inspection</option>
                  <option>Air Filter Replacement</option>
                  <option>Battery Service</option>
                  <option>Other</option>
                </select>
              </label>
              <label>
                Date
                <input name="date" type="date" value={form.date} onChange={updateForm} required />
              </label>
              <label>
                Odometer (km)
                <input name="odometer" type="number" min="0" value={form.odometer} onChange={updateForm} required />
              </label>
              <label>
                Cost (UGX)
                <input name="cost" type="number" min="0" step="1" placeholder="180000" value={form.cost} onChange={updateForm} required />
              </label>
              <label className="form-wide">
                Parts replaced
                <input name="parts" type="text" placeholder="e.g. Oil filter, 5W-30 oil" value={form.parts} onChange={updateForm} />
              </label>
              <label className="form-wide">
                Notes
                <textarea name="notes" rows="3" placeholder="Add any notes about this service" value={form.notes} onChange={updateForm} />
              </label>
            </div>
            <button className="save-service-button" type="submit">SAVE SERVICE</button>
          </form>
        )}
      </section>
      <p className="services-demo-note">Service status and costs are sample vehicle data. New records are kept for this session.</p>
    </section>
  )
}
