import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SyncIndicator } from './animations'
import ThemeToggle from './ui/ThemeToggle'
import { APP_NAME } from '../config/brand'

function Icon({ children, size = 20 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
}

export default function DashboardHeader({
  subtitle = 'DASHBOARD',
  syncState,
  pending = 0,
  vehicle,
  profileName = 'Fleet User',
  roleLabel = 'No role',
  workspaceOptions = [],
  activeWorkspaceId,
  onSwitchWorkspace,
  profilePath = '/dashboard',
  onSignOut,
  showProfile = true,
}) {
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)

  function signOut() {
    onSignOut?.()
  }

  return (
    <header className="dashboard-topbar">
      <div className="wordmark"><span className="wordmark-mark"><Icon size={22}><path d="M4 15h16M6 15l1-5h10l1 5M8 10l1-3h6l1 3M7 18h.01M17 18h.01" /><circle cx="7" cy="17" r="1.5" /><circle cx="17" cy="17" r="1.5" /></Icon></span><span>{APP_NAME}<small>{subtitle}</small></span></div>
      <div className="topbar-actions">
        {syncState ? <SyncIndicator state={syncState} pending={pending} /> : null}
        <ThemeToggle />
        {vehicle ? <span className="vin"><Icon size={16}><path d="M4 17h16M5 17l1-6h12l1 6M8 11l1-3h6l1 3" /><circle cx="7" cy="18" r="1" /><circle cx="17" cy="18" r="1" /></Icon> VIN: {vehicle.vinSuffix} <span>⌄</span></span> : null}
        {showProfile ? <div className="profile-menu">
          <button className="profile-button" aria-label="Open profile menu" onClick={() => setProfileOpen((open) => !open)}><Icon size={19}><circle cx="12" cy="8" r="3" /><path d="M5 20c.6-3.2 2.8-5 7-5s6.4 1.8 7 5" /></Icon></button>
          {profileOpen ? <div className="profile-dropdown" role="menu" aria-label="Profile menu">
            <div className="profile-summary"><strong>{profileName}</strong><span>{roleLabel}</span></div>
            {workspaceOptions.length > 1 ? <div className="profile-workspaces" role="group" aria-label="Switch workspace">
              <small>SWITCH WORKSPACE</small>
              {workspaceOptions.map((option) => <button key={option.id} type="button" role="menuitemradio" aria-checked={option.id === activeWorkspaceId} className={option.id === activeWorkspaceId ? 'current' : ''} onClick={() => { onSwitchWorkspace?.(option.id); setProfileOpen(false) }}><strong>{option.name}</strong><span>{option.roleLabel} · {option.planName ?? 'No plan'}</span></button>)}
            </div> : null}
            <button type="button" role="menuitem" onClick={() => navigate(profilePath)}>Profile</button>
            <button type="button" role="menuitem" onClick={() => navigate(profilePath)}>Settings</button>
            <button type="button" role="menuitem" className="danger" onClick={signOut}>Log out</button>
          </div> : null}
        </div> : null}
      </div>
    </header>
  )
}
