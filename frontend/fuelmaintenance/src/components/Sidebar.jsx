import './Sidebar.css'

function Sidebar({
  items = [],
  activeTab,
  onTabChange,
  collapsed = false,
  onCollapsedChange,
  title,
  subtitle,
  footer,
  ariaLabel = 'Dashboard sections',
}) {
  const visibleItems = items.filter((item) => item.allowed !== false)

  return (
    <aside className={`dashboard-sidebar${collapsed ? ' collapsed' : ''}`}>
      {title ? (
        <div className="sidebar-head">
          <div className="sidebar-heading">
            <strong>{title}</strong>
            {subtitle ? <span>{subtitle}</span> : null}
          </div>
          {onCollapsedChange ? (
            <button
              type="button"
              className="sidebar-toggle"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!collapsed}
              onClick={() => onCollapsedChange(!collapsed)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
          ) : null}
        </div>
      ) : null}

      <nav className="sidebar-nav" aria-label={ariaLabel}>
        {visibleItems.map((item) => (
          <button
            key={item.id}
            type="button"
            title={item.label}
            className={activeTab === item.id ? 'selected' : ''}
            aria-pressed={activeTab === item.id}
            onClick={() => onTabChange?.(item.id)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {footer ? <div className="sidebar-footer">{footer}</div> : null}
    </aside>
  )
}

export default Sidebar
