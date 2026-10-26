// VehicleCRUD.jsx - Vehicle creation, editing, and listing page
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as auth from '../api/auth'
import { listVehicles, createVehicle, updateVehicle, deleteVehicle } from '../api/resources'
import Sidebar from '../components/Sidebar'
import DashboardHeader from '../components/DashboardHeader'
import './Dashboard.css'

// Vehicle form component
function VehicleForm({ isOpen, setIsOpen, vehicle, setVehicle, isEditing, id, onSave }) {
  const [form, setForm] = useState({
    license_plate: vehicle.license_plate || '',
    make: vehicle.make || '',
    model: vehicle.model || '',
    year: vehicle.year || '',
    odometer_km: vehicle.odometer_km || '',
    color: vehicle.color || '',
  })

  useEffect(() => {
    setForm({
      license_plate: vehicle.license_plate || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || '',
      odometer_km: vehicle.odometer_km || '',
      color: vehicle.color || '',
    })
  }, [vehicle])

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      if (isEditing) {
        await updateVehicle(id, form)
      } else {
        await createVehicle(form)
      }
      onSave()
      setIsOpen(false)
    } catch (err) {
      console.error('Vehicle save error:', err)
    }
  }

  return (
    <div className="fm-form-container">
      <h2 className="fm-form-title">{isEditing ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
      <form onSubmit={handleSave} className="fm-form">
        <div className="fm-form-group">
          <label className="fm-form-label">License Plate <span className="fm-form-required">*</span></label>
          <input
            type="text"
            value={form.license_plate}
            onChange={(e) => setForm({ ...form, license_plate: e.target.value.trim() })}
            maxLength={20}
            required
            className="fm-form-input"
          />
        </div>

        <div className="fm-form-group">
          <label className="fm-form-label">Make <span className="fm-form-required">*</span></label>
          <input
            type="text"
            value={form.make}
            onChange={(e) => setForm({ ...form, make: e.target.value.trim() })}
            required
            className="fm-form-input"
          />
        </div>

        <div className="fm-form-group">
          <label className="fm-form-label">Model <span className="fm-form-required">*</span></label>
          <input
            type="text"
            value={form.model}
            onChange={(e) => setForm({ ...form, model: e.target.value.trim() })}
            required
            className="fm-form-input"
          />
        </div>

        <div className="fm-form-group">
          <label className="fm-form-label">Year</label>
          <input
            type="number"
            value={form.year || ''}
            onChange={(e) => setForm({ ...form, year: e.target.value })}
            className="fm-form-input"
            placeholder="e.g., 2020"
          />
        </div>

        <div className="fm-form-group">
          <label className="fm-form-label">Odometer (km)</label>
          <input
            type="number"
            value={form.odometer_km || ''}
            onChange={(e) => setForm({ ...form, odometer_km: e.target.value })}
            className="fm-form-input"
            placeholder="e.g., 15000"
          />
        </div>

        <div className="fm-form-group">
          <label className="fm-form-label">Color</label>
          <input
            type="text"
            value={form.color || ''}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
            className="fm-form-input"
            placeholder="e.g., Red"
          />
        </div>

        <div className="fm-form-actions">
          <button type="button" onClick={onCancel} className="fm-btn-secondary">Cancel</button>
          <button type="submit" disabled={isSaving} className="fm-btn-primary">{isEditing ? 'Save changes' : 'Create'}</button>
        </div>
      </form>
    </div>
  )
}

// Vehicle row component
function VehicleRow({ vehicle }) {
  const [isEditing, setIsEditing] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="fm-vehicle-card">
      <div className="fm-vehicle-header">
        <span className="fm-vehicle-license">{vehicle.license_plate}</span>
        <span className="fm-vehicle-actions">
          {isEditing ? (
            <button onClick={() => saveVehicle(vehicle)} className="fm-btn-small fm-btn-save">✓</button>
          ) : (
            <button onClick={() => setIsEditing(true)} className="fm-btn-small fm-btn-edit">Edit</button>
          )}
          <Link to={`/super-admin/vehicles/${vehicle.id}`} className="fm-btn-small fm-btn-details">Details</Link>
        </span>
      </div>

      <div className="fm-vehicle-details">
        <p><strong>Make:</strong> {vehicle.make}</p>
        <p><strong>Model:</strong> {vehicle.model}</p>
        <p><strong>Year:</strong> {vehicle.year || '—'}</p>
        <p><strong>Odometer:</strong> {vehicle.odometer_km || '—'} km</p>
        <p><strong>Color:</strong> {vehicle.color || '—'}</p>
      </div>
    </div>
  )
}
