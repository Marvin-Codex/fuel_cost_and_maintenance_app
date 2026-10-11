/** Shimmering placeholder block. Compose several to build skeleton cards. */
export function Skeleton({ width = '100%', height = 16, radius, className = '', style }) {
  return (
    <span
      className={`fm-skeleton ${className}`.trim()}
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  )
}

/** A generic skeleton card: heading line + a few body bars. */
export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="fm-card fm-skeleton-card" aria-hidden="true">
      <Skeleton width="45%" height={18} />
      <Skeleton width="30%" height={26} radius="var(--fm-radius-sm)" />
      <div className="fm-skeleton-card-body">
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton key={i} width={i === lines - 1 ? '70%' : '100%'} height={12} />
        ))}
      </div>
    </div>
  )
}

/** Friendly empty state: icon, message and an optional call to action. */
export function EmptyState({ icon, title, message, action }) {
  return (
    <div className="fm-empty" role="status">
      {icon ? <span className="fm-empty-icon" aria-hidden="true">{icon}</span> : null}
      <h3>{title}</h3>
      {message ? <p>{message}</p> : null}
      {action}
    </div>
  )
}
