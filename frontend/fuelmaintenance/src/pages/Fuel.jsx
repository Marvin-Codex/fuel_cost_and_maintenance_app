import { useState } from 'react'
import './Fuel.css'

const fuelHistory = [
  { date: 'Today', amount: '40 L', cost: 208000, odometer: '42,580 km' },
  { date: '29 Sep', amount: '35 L', cost: 182000, odometer: '42,120 km' },
  { date: '24 Sep', amount: '42 L', cost: 218400, odometer: '41,650 km' },
]

const efficiencyPeriods = {
  today: { label: 'Today', values: [8.2, 7.8, 8.4, 7.4, 7.8], labels: ['9am', '11am', '1pm', '3pm', '5pm'] },
  week: { label: '7 days', values: [8.5, 8.1, 7.9, 8.3, 7.6, 7.4, 7.8], labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
  month: { label: '30 days', values: [8.9, 8.4, 8.2, 7.8, 8.1, 7.7, 7.8], labels: ['1', '5', '10', '15', '20', '25', '30'] },
}

function formatUgx(value) {
  return `UGX ${Math.round(value).toLocaleString('en-UG')}`
}

function makeChartPath(values) {
  const width = 600
  const height = 180
  return values.map((value, index) => {
    const x = values.length === 1 ? 0 : index * width / (values.length - 1)
    const y = height - ((value - 6) / 4) * height
    return `${index === 0 ? 'M' : 'L'}${x},${y}`
  }).join(' ')
}

export default function Fuel({ onBack, vehicle }) {
  const [fuelPrice, setFuelPrice] = useState('5200')
  const [period, setPeriod] = useState('week')
  const fuelLevel = 68
  const litresRemaining = 40.8
  const tankCapacity = 60
  const averageConsumption = 7.8
  const targetConsumption = 7.2
  const estimatedRange = Math.round(litresRemaining / averageConsumption * 100)
  const parsedFuelPrice = Number(fuelPrice)
  const fillCost = Number.isFinite(parsedFuelPrice) && parsedFuelPrice > 0
    ? 40 * parsedFuelPrice
    : null
  const chart = efficiencyPeriods[period]
  const chartPath = makeChartPath(chart.values)
  const chartArea = `${chartPath} L600,180 L0,180 Z`

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
          <p className="fuel-vehicle-name">{vehicle ? `${vehicle.make} ${vehicle.model} · ${vehicle.registration}` : 'Toyota Premio · UBA 123A'}</p>
        </div>
        <span className="fuel-demo-badge"><i /> SAMPLE DATA</span>
      </div>

      <section className="fuel-panel fuel-level-panel" aria-labelledby="fuel-level-title">
        <div className="fuel-section-heading">
          <div>
            <p className="fuel-eyebrow">CURRENT FUEL LEVEL</p>
            <h3 id="fuel-level-title">Tank status</h3>
          </div>
          <span className="fuel-level-live"><i /> ESTIMATE</span>
        </div>
        <div className="fuel-level-value">
          <strong>{fuelLevel}%</strong>
          <span>{litresRemaining.toFixed(1)} L / {tankCapacity} L</span>
        </div>
        <div className="fuel-gauge" role="meter" aria-label="Current fuel level" aria-valuemin="0" aria-valuemax="100" aria-valuenow={fuelLevel}>
          <span style={{ width: `${fuelLevel}%` }} />
        </div>
        <div className="fuel-gauge-labels"><span>Empty</span><span>Full</span></div>
        <div className="fuel-range">
          <div><span>Estimated remaining range</span><small>Based on {averageConsumption.toFixed(1)} L/100 km average</small></div>
          <strong>{estimatedRange}<small> km</small></strong>
        </div>
      </section>

      <section className="fuel-metric-grid" aria-label="Fuel metrics">
        <article className="fuel-panel fuel-metric">
          <p className="fuel-eyebrow">CURRENT CONSUMPTION</p>
          <strong className="fuel-metric-value">{averageConsumption.toFixed(1)}<small> L/100 km</small></strong>
          <span className="fuel-metric-note">Target: {targetConsumption.toFixed(1)} L/100 km</span>
          <span className="fuel-trend high">+{(averageConsumption - targetConsumption).toFixed(1)} · HIGH</span>
          <div className="fuel-extra-stats">
            <span>Average <b>7.8</b></span><span>Best <b>6.9</b></span><span>Worst <b>9.4</b></span>
          </div>
        </article>
        <article className="fuel-panel fuel-metric">
          <p className="fuel-eyebrow">FUEL COST</p>
          <strong className="fuel-metric-value">UGX 320K</strong>
          <span className="fuel-metric-note">This month</span>
          <span className="fuel-trend">↑ 12% vs last month</span>
          <div className="fuel-extra-stats">
            <span>Today <b>UGX 0</b></span><span>Week <b>UGX 208K</b></span><span>Per trip <b>UGX 8K</b></span>
          </div>
        </article>
        <article className="fuel-panel fuel-metric">
          <p className="fuel-eyebrow">FUEL USED</p>
          <strong className="fuel-metric-value">286<small> L</small></strong>
          <span className="fuel-metric-note">This month</span>
          <div className="fuel-extra-stats fuel-usage-stats">
            <span>Today <b>12.4 L</b></span><span>This week <b>74.8 L</b></span>
          </div>
        </article>
        <article className="fuel-panel fuel-metric">
          <p className="fuel-eyebrow">FUEL PRICE</p>
          <label className="fuel-price-label" htmlFor="fuel-price">Petrol · price per litre</label>
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
              aria-label="Petrol price per litre in Ugandan shillings"
            />
            <span>/ L</span>
          </div>
          <span className="fuel-metric-note">40 L fill estimate</span>
          <strong className="fuel-fill-cost">{fillCost === null ? 'Enter a price' : formatUgx(fillCost)}</strong>
        </article>
      </section>

      <section className="fuel-panel fuel-efficiency-panel" aria-labelledby="fuel-efficiency-title">
        <div className="fuel-section-heading">
          <div>
            <p className="fuel-eyebrow">FUEL EFFICIENCY</p>
            <h3 id="fuel-efficiency-title">Consumption trend</h3>
          </div>
          <div className="fuel-period-switch" role="group" aria-label="Chart period">
            {Object.entries(efficiencyPeriods).map(([key, option]) => (
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
        <div className="fuel-chart-legend"><span><i /> Consumption · L/100 km</span><span><i /> Target · 7.2 L/100 km</span></div>
        <div className="fuel-chart">
          <div className="fuel-chart-grid" />
          <span className="fuel-chart-y y10">10</span>
          <span className="fuel-chart-y y8">8</span>
          <span className="fuel-chart-y y6">6</span>
          <svg viewBox="0 0 600 180" preserveAspectRatio="none" role="img" aria-label={`${chart.label} fuel consumption trend`}>
            <defs>
              <linearGradient id="fuel-area" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#42d8f4" stopOpacity=".3" />
                <stop offset="1" stopColor="#42d8f4" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={chartArea} fill="url(#fuel-area)" />
            <line x1="0" y1="126" x2="600" y2="126" stroke="#ffb957" strokeDasharray="6 6" />
            <path d={chartPath} fill="none" stroke="#42d8f4" strokeWidth="3" vectorEffect="non-scaling-stroke" />
            {chart.values.map((value, index) => {
              const x = chart.values.length === 1 ? 0 : index * 600 / (chart.values.length - 1)
              const y = 180 - ((value - 6) / 4) * 180
              return <circle key={`${period}-${chart.labels[index]}`} cx={x} cy={y} r="4" fill="#42d8f4" />
            })}
          </svg>
        </div>
        <div className="fuel-chart-labels">
          {chart.labels.map((label) => <span key={label}>{label}</span>)}
        </div>
        <p className="fuel-chart-caption">Average {averageConsumption.toFixed(1)} L/100 km · Target {targetConsumption.toFixed(1)} L/100 km</p>
      </section>

      <section className="fuel-panel fuel-history-panel" aria-labelledby="fuel-history-title">
        <div className="fuel-section-heading">
          <div>
            <p className="fuel-eyebrow">RECENT FUEL ACTIVITY</p>
            <h3 id="fuel-history-title">Fuel history</h3>
          </div>
          <span className="fuel-history-caption">3 recent fill-ups</span>
        </div>
        <div className="fuel-history-list">
          {fuelHistory.map((entry) => (
            <article className="fuel-history-row" key={entry.date}>
              <span className="fuel-history-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 21V5a2 2 0 0 1 2-2h8v18M4 21h12M8 7h4v5H8zM16 8h2l2 2v7a2 2 0 0 1-4 0" />
                </svg>
              </span>
              <div className="fuel-history-main">
                <strong>{entry.date}</strong>
                <span>Petrol · {entry.amount} · Odometer {entry.odometer}</span>
              </div>
              <strong className="fuel-history-cost">{formatUgx(entry.cost)}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className={`fuel-alert ${fuelLevel < 20 ? 'warning' : 'high'}`} role="status">
        <span className="fuel-alert-icon" aria-hidden="true">!</span>
        <div>
          <strong>{fuelLevel < 20 ? 'LOW FUEL' : 'HIGH CONSUMPTION'}</strong>
          <p>
            {fuelLevel < 20
              ? `Fuel is below 20%. ${litresRemaining.toFixed(1)} L remain in the tank.`
              : `Current consumption is ${averageConsumption.toFixed(1)} L/100 km, above the ${targetConsumption.toFixed(1)} L/100 km target.`}
          </p>
        </div>
      </section>
      <section className="fuel-alert improved" role="status">
        <span className="fuel-alert-icon" aria-hidden="true">✓</span>
        <div>
          <strong>EFFICIENCY IMPROVED</strong>
          <p>Fuel consumption improved by 8% compared with last week.</p>
        </div>
      </section>
      <p className="fuel-demo-note">Sample values for demonstration. Live fuel and trip data are not connected yet.</p>
    </section>
  )
}
