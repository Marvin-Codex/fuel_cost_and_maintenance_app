import { useEffect, useMemo, useState } from 'react'
import {
  completeMaintenanceReminder,
  createMaintenanceRecord,
  fetchMaintenanceSummary,
  listMaintenanceRecords,
  listMaintenanceReminders,
} from '../api/resources'
import './Services.css'

function formatCost(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  return `UGX ${Math.round(number).toLocaleString('en-UG')}`
}

function formatKm(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  return `${Math.round(number).toLocaleString('en-UG')} km`
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

function reminderUrgency(reminder) {
  const status = reminder.computed_status || reminder.status
  if (status === 'overdue') return 0
  if (status === 'due_soon') return 1
  return 2
}

function reminderDetail(reminder) {
  const parts = []
  if (reminder.km_remaining !== null && reminder.km_remaining !== undefined) {
    parts.push(reminder.km_remaining >= 0 ? `Due in ${formatKm(reminder.km_remaining)}` : `${formatKm(-reminder.km_remaining)} overdue`)
  }
  if (reminder.due_date) parts.push(`By ${formatDate(reminder.due_date)}`)
  if (reminder.notes) parts.push(reminder.notes)
  return parts.join(' · ') || 'Scheduled maintenance'
}

export default function Services({ onBack, vehicle, access }) {
  const vehicleId = vehicle?.rawId ?? vehicle?.id ?? null
  const [history, setHistory] = useState([])
  const [reminders, setReminders] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [completingId, setCompletingId] = useState(null)
  const [formError, setFormError] = useState(null)
  const [savedMessage, setSavedMessage] = useState('')
  const [form, setForm] = useState({
    service_type: 'Oil Change',
    service_date: todayIso(),
    odometer_km: '',
    cost: '',
    parts: '',
    notes: '',
  })

  const canAdd = Boolean(access?.can('maintenance.add'))
  const canEdit = Boolean(access?.can('maintenance.edit'))

  useEffect(() => {
    if (!vehicleId) {
      setHistory([])
      setReminders([])
      setSummary(null)
      setLoading(false)
      return undefined
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([
      listMaintenanceRecords({ vehicle: vehicleId }),
      listMaintenanceReminders({ vehicle: vehicleId }),
      fetchMaintenanceSummary({ vehicle: vehicleId }),
    ])
      .then(([records, reminderRows, maintSummary]) => {
        if (cancelled) return
        setHistory(records)
        setReminders(reminderRows)
        setSummary(maintSummary)
        setForm((current) => ({ ...current, odometer_km: String(records[0]?.odometer_km ?? vehicle?.odometer ?? '') }))
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.message)
        setLoading(false)
      })
    return () => { cancelled = true }
  }, [vehicleId, vehicle?.odometer, reloadKey])

  const openReminders = useMemo(
    () => reminders
      .filter((reminder) => {
        const status = reminder.computed_status || reminder.status
        return status !== 'completed' && status !== 'done'
      })
      .sort((a, b) => reminderUrgency(a) - reminderUrgency(b)),
    [reminders],
  )
  const nextReminder = openReminders[0] ?? null
  const overdueCount = openReminders.filter((reminder) => (reminder.computed_status || reminder.status) === 'overdue').length
  const dueSoonCount = openReminders.filter((reminder) => (reminder.computed_status || reminder.status) === 'due_soon').length
  const healthScore = Math.max(0, Math.min(100, 100 - overdueCount * 25 - dueSoonCount * 10))
  const healthTone = overdueCount ? 'attention' : dueSoonCount ? 'watch' : 'good'

  function updateForm(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
  }

  async function reload() {
    const [records, reminderRows, maintSummary] = await Promise.all([
      listMaintenanceRecords({ vehicle: vehicleId }),
      listMaintenanceReminders({ vehicle: vehicleId }),
      fetchMaintenanceSummary({ vehicle: vehicleId }),
    ])
    setHistory(records)
    setReminders(reminderRows)
    setSummary(maintSummary)
  }

  async function saveService(event) {
    event.preventDefault()
    setFormError(null)
    if (!vehicleId) {
      setFormError('Select a vehicle before logging a service.')
      return
    }
    const payload = {
      vehicle: vehicleId,
      service_type: form.service_type,
      service_date: form.service_date,
      odometer_km: Number(form.odometer_km),
      cost: Number(form.cost),
    }
    const parts = form.parts.split(',').map((part) => part.trim()).filter(Boolean)
    if (parts.length) payload.parts_replaced = parts
    if (form.notes.trim()) payload.notes = form.notes.trim()
    setSaving(true)
    try {
      await createMaintenanceRecord(payload)
      await reload()
      setSavedMessage(`${form.service_type} on ${formatDate(form.service_date)} recorded.`)
      setForm((current) => ({ ...current, cost: '', parts: '', notes: '' }))
      setIsFormOpen(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function markComplete(reminder) {
    setFormError(null)
    setCompletingId(reminder.id)
    try {
      await completeMaintenanceReminder(reminder.id)
      await reload()
      setSavedMessage(`${reminder.service_type || 'Reminder'} marked complete.`)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setCompletingId(null)
    }
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
          <p className="services-vehicle">{vehicle ? `${vehicle.make} ${vehicle.model} · ${vehicle.registration}` : 'Select a vehicle to see service data'}</p>
        </div>
        <span className="services-system-status"><i className={healthTone} /> {loading ? 'LOADING' : `${openReminders.length} OPEN`}</span>
      </header>

      {error && (
        <p className="services-demo-note" role="alert">
          {error} <button type="button" onClick={() => setReloadKey((key) => key + 1)}>Retry</button>
        </p>
      )}
      {savedMessage && <p className="service-saved-message" role="status">{savedMessage}</p>}
      {formError && <p className="services-demo-note" role="alert">{formError}</p>}

      <section className="services-panel service-health-panel" aria-labelledby="service-health-title">
        <div className="services-panel-heading">
          <div>
            <p className="services-eyebrow">SERVICE HEALTH</p>
            <h3 id="service-health-title">Vehicle maintenance</h3>
          </div>
          <span className="health-score">{loading ? '—' : healthScore}<span>%</span></span>
        </div>
        <div className="health-score-caption">
          <span className={`health-indicator ${healthTone}`} /> {overdueCount ? `${overdueCount} OVERDUE` : dueSoonCount ? 'DUE SOON' : 'GOOD'}
          <span>Based on your open reminders</span>
        </div>
        <div className="service-health-meter" role="meter" aria-label="Vehicle service health" aria-valuemin="0" aria-valuemax="100" aria-valuenow={healthScore}>
          <span style={{ width: `${loading ? 0 : healthScore}%` }} />
        </div>
      </section>

      <div className="service-summary-grid">
        <article className="services-panel service-summary-card">
          <p className="services-eyebrow">NEXT SERVICE</p>
          {loading ? (
            <strong>…</strong>
          ) : nextReminder ? (
            <>
              <strong>{nextReminder.km_remaining !== null && nextReminder.km_remaining !== undefined
                ? `${Math.abs(Math.round(nextReminder.km_remaining)).toLocaleString('en-UG')} ${nextReminder.km_remaining >= 0 ? 'km' : 'km over'}`
                : nextReminder.due_date ? formatDate(nextReminder.due_date) : 'Due soon'}</strong>
              <p>{nextReminder.service_type || 'Service reminder'}</p>
              <span className="summary-date">{reminderDetail(nextReminder)}</span>
            </>
          ) : (
            <>
              <strong>None</strong>
              <p>No open reminders for this vehicle.</p>
              <span className="summary-date">Add a service or create a reminder from your backend.</span>
            </>
          )}
        </article>
        <article className="services-panel service-summary-card cost-summary">
          <p className="services-eyebrow">SERVICE COST · THIS MONTH</p>
          <strong>{summary ? formatCost(summary.this_month_cost) : '—'}</strong>
          <p>{summary ? `${formatCost(summary.this_year_cost)} this year` : 'Loading…'}</p>
          <span className="summary-date">{summary && summary.average_cost ? `Average service · ${formatCost(summary.average_cost)}` : 'No services yet'}</span>
        </article>
      </div>

      <section className="services-panel" aria-labelledby="upcoming-services-title">
        <div className="services-panel-heading">
          <div>
            <p className="services-eyebrow">PLAN AHEAD</p>
            <h3 id="upcoming-services-title">Upcoming services</h3>
          </div>
          <span className="services-count">{openReminders.length} DUE</span>
        </div>
        {openReminders.length ? (
          <div className="upcoming-list">
            {openReminders.map((reminder) => (
              <article className="upcoming-row" key={reminder.id}>
                <span className="upcoming-icon" aria-hidden="true">◉</span>
                <div className="upcoming-copy">
                  <strong>{reminder.service_type || 'Service reminder'}</strong>
                  <small>{reminderDetail(reminder)}</small>
                </div>
                <span className={`upcoming-distance ${reminderUrgency(reminder) === 0 ? 'overdue' : ''}`}>
                  {(reminder.computed_status || reminder.status || 'open').replace('_', ' ')}
                  <small>{reminder.km_remaining !== null && reminder.km_remaining !== undefined ? `${formatKm(Math.abs(reminder.km_remaining))} ${reminder.km_remaining >= 0 ? 'left' : 'over'}` : reminder.due_date ? formatDate(reminder.due_date) : ''}</small>
                </span>
                {canEdit && (
                  <button
                    className="services-complete-button"
                    type="button"
                    disabled={completingId === reminder.id}
                    onClick={() => markComplete(reminder)}
                  >
                    {completingId === reminder.id ? '…' : 'DONE'}
                  </button>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="services-empty">Nothing due right now. Completed reminders disappear from this list.</p>
        )}
      </section>

      <section className="services-panel" aria-labelledby="service-history-title">
        <div className="services-panel-heading service-history-heading">
          <div>
            <p className="services-eyebrow">YOUR MAINTENANCE LOG</p>
            <h3 id="service-history-title">Service history</h3>
          </div>
          <span className="component-caption">{history.length} record{history.length === 1 ? '' : 's'}</span>
        </div>
        {loading ? (
          <p className="services-empty">Loading service records…</p>
        ) : history.length ? (
          <div className="service-history-list">
            {history.map((record) => (
              <article className="service-history-row" key={record.id}>
                <span className="history-date">{formatDate(record.service_date)}</span>
                <div className="history-service">
                  <strong>{record.service_type || 'Service'}</strong>
                  <small>{Number(record.odometer_km).toLocaleString('en-UG')} km · {Array.isArray(record.parts_replaced) && record.parts_replaced.length ? record.parts_replaced.join(', ') : 'No parts listed'}</small>
                  {record.notes && <small>{record.notes}</small>}
                </div>
                <strong className="history-cost">{formatCost(record.cost)}</strong>
              </article>
            ))}
          </div>
        ) : (
          <p className="services-empty">No service records yet. Your completed services will appear here.</p>
        )}
        {canAdd && (
          <>
            <button className="add-service-button" type="button" onClick={() => { setIsFormOpen((open) => !open); setSavedMessage(''); setFormError(null) }}>
              <span aria-hidden="true">{isFormOpen ? '−' : '+'}</span> {isFormOpen ? 'CANCEL' : 'ADD SERVICE'}
            </button>
            {isFormOpen && (
              <form className="add-service-form" onSubmit={saveService}>
                <div className="form-grid">
                  <label>
                    Service type
                    <select name="service_type" value={form.service_type} onChange={updateForm}>
                      <option>Oil Change</option>
                      <option>Brake Inspection</option>
                      <option>Air Filter Replacement</option>
                      <option>Battery Service</option>
                      <option>Tyre Service</option>
                      <option>Other</option>
                    </select>
                  </label>
                  <label>
                    Date
                    <input name="service_date" type="date" max={todayIso()} value={form.service_date} onChange={updateForm} required />
                  </label>
                  <label>
                    Odometer (km)
                    <input name="odometer_km" type="number" min="0" step="1" value={form.odometer_km} onChange={updateForm} required />
                  </label>
                  <label>
                    Cost (UGX)
                    <input name="cost" type="number" min="0" step="1" placeholder="180000" value={form.cost} onChange={updateForm} required />
                  </label>
                  <label className="form-wide">
                    Parts replaced
                    <input name="parts" type="text" placeholder="e.g. Oil filter, 5W-30 oil (comma separated)" value={form.parts} onChange={updateForm} />
                  </label>
                  <label className="form-wide">
                    Notes
                    <textarea name="notes" rows="3" placeholder="Add any notes about this service" value={form.notes} onChange={updateForm} />
                  </label>
                </div>
                <button className="save-service-button" type="submit" disabled={saving}>{saving ? 'SAVING…' : 'SAVE SERVICE'}</button>
              </form>
            )}
          </>
        )}
      </section>
    </section>
  )
}
