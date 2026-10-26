import { useEffect, useRef, useState } from 'react'

/** Fade/slide sections in once when scrolled into view. */
export function Reveal({ children, delay = 0, className = '', as: Tag = 'div', ...rest }) {
  const ref = useRef(null)
  // Show immediately when IntersectionObserver is unavailable (older browsers/SSR).
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined')
  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true)
            observer.disconnect()
          }
        })
      },
      { threshold: 0.1, rootMargin: '0px 0px 120px 0px' },
    )
    observer.observe(node)
    // Fallback so content is never stuck invisible if the observer never fires
    // (e.g. sections that render below the fold in some browsers).
    const fallback = setTimeout(() => setVisible(true), 1500)
    return () => {
      observer.disconnect()
      clearTimeout(fallback)
    }
  }, [])
  return (
    <Tag ref={ref} className={`fm-reveal${visible ? ' is-visible' : ''} ${className}`.trim()} data-delay={delay || undefined} {...rest}>
      {children}
    </Tag>
  )
}

/** Animated integer counter that runs once visible. */
export function Counter({ to = 0, duration = 1200, format = (n) => String(Math.round(n)) }) {
  const ref = useRef(null)
  const [value, setValue] = useState(0)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    let raf = 0
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const run = () => {
      if (reduce) {
        setValue(to)
        return
      }
      const start = performance.now()
      const tick = (now) => {
        const progress = Math.min(1, (now - start) / duration)
        setValue(to * (1 - Math.pow(1 - progress, 3)))
        if (progress < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }
    if (typeof IntersectionObserver === 'undefined') {
      run()
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            run()
            observer.disconnect()
          }
        })
      },
      { threshold: 0.4 },
    )
    observer.observe(node)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(raf)
    }
  }, [to, duration])
  return <span ref={ref}>{format(value)}</span>
}

/** Animated GPS route with a travelling marker + floating stat chips. */
export function RouteAnimation({ chips = [] }) {
  return (
    <div className="fm-route" role="img" aria-label="Animated GPS route with trip statistics">
      <svg viewBox="0 0 340 220" className="fm-route-svg" aria-hidden="true">
        <defs>
          <path id="fm-route-path" d="M24 190 C 70 170, 60 120, 120 124 S 170 60, 230 74 S 280 110, 316 44" fill="none" />
        </defs>
        <g stroke="currentColor" opacity="0.12">
          {Array.from({ length: 11 }, (_, i) => (
            <line key={`v${i}`} x1={i * 34} y1="0" x2={i * 34} y2="220" strokeWidth="1" />
          ))}
          {Array.from({ length: 7 }, (_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 34} x2="340" y2={i * 34} strokeWidth="1" />
          ))}
        </g>
        <use href="#fm-route-path" stroke="currentColor" strokeWidth="10" opacity="0.1" strokeLinecap="round" />
        <use href="#fm-route-path" className="fm-route-draw" stroke="var(--fm-accent)" strokeWidth="3" strokeLinecap="round" />
        <circle r="5" fill="var(--fm-accent)">
          <animateMotion dur="6s" repeatCount="indefinite">
            <mpath href="#fm-route-path" />
          </animateMotion>
        </circle>
        <circle cx="24" cy="190" r="6" fill="none" stroke="var(--fm-ok)" strokeWidth="2.5" />
        <g transform="translate(316 44)">
          <path d="M0 -14 C 7 -14, 11 -9, 11 -3 C 11 4, 0 12, 0 12 C 0 12, -11 4, -11 -3 C -11 -9, -7 -14, 0 -14 Z" fill="var(--fm-danger)" />
          <circle r="3.5" cy="-4" fill="#fff" />
        </g>
      </svg>
      <div className="fm-route-chips">
        {chips.map((chip, index) => (
          <span key={chip} className={`fm-chip fm-chip-float${index % 2 ? '--alt' : ''}`}>{chip}</span>
        ))}
      </div>
    </div>
  )
}

/** Speedometer-style dial whose needle animates into view. */
export function Gauge({ label, value = 0, max = 200, unit = '', display }) {
  const ref = useRef(null)
  // Activate immediately when IntersectionObserver is unavailable (older browsers/SSR).
  const [active, setActive] = useState(() => typeof IntersectionObserver === 'undefined')
  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(true)
            observer.disconnect()
          }
        })
      },
      { threshold: 0.4 },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  const clamped = Math.min(Math.max(value, 0), max) / max
  const angle = -70 + clamped * 140
  return (
    <div ref={ref} className="fm-gauge" role="img" aria-label={`${label}: ${display ?? `${value} ${unit}`}`}>
      <svg viewBox="0 0 120 76" aria-hidden="true">
        <path d="M12 64 A 52 52 0 0 1 108 64" fill="none" stroke="currentColor" strokeWidth="8" opacity="0.15" strokeLinecap="round" />
        <path d="M12 64 A 52 52 0 0 1 108 64" fill="none" stroke="var(--fm-accent)" strokeWidth="8" strokeLinecap="round" strokeDasharray="164" strokeDashoffset={active ? 164 - 164 * clamped : 164} style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.3,1.3,.5,1)' }} />
        <line x1="60" y1="60" x2="60" y2="22" className="fm-gauge-needle" stroke="var(--fm-warn)" strokeWidth="3" strokeLinecap="round" style={active ? { transform: `rotate(${angle}deg)` } : undefined} />
        <circle cx="60" cy="60" r="5" fill="var(--fm-ink)" />
      </svg>
      <strong>{display ?? value}</strong>
      <span>{label}{unit ? ` · ${unit}` : ''}</span>
    </div>
  )
}

/** Line-art engine with moving pistons + one pulsing warning light. */
export function EngineLine() {
  return (
    <svg viewBox="0 0 200 120" className="fm-engine" role="img" aria-label="Line-art engine with moving pistons">
      <g fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="30" y="18" width="140" height="84" rx="10" opacity="0.5" />
        <g className="fm-piston">
          <rect x="52" y="40" width="28" height="34" rx="4" />
          <line x1="66" y1="74" x2="66" y2="94" />
        </g>
        <g className="fm-piston" style={{ animationDelay: '-0.8s' }}>
          <rect x="120" y="40" width="28" height="34" rx="4" />
          <line x1="134" y1="74" x2="134" y2="94" />
        </g>
        <line x1="30" y1="34" x2="170" y2="34" opacity="0.5" />
        <circle cx="100" cy="26" r="4" fill="var(--fm-warn)" stroke="none" className="fm-blink" />
      </g>
    </svg>
  )
}

/** Offline to online sync indicator (pure CSS pulse). */
export function SyncIndicator({ state = 'synced', pending = 0 }) {
  const copy = state === 'offline' ? 'Offline' : state === 'syncing' ? 'Syncing' : pending > 0 ? `${pending} pending` : 'Synced'
  return (
    <span className={`fm-sync fm-sync--${state}`} role="status" aria-live="polite" aria-label={`Sync status: ${copy}`}>
      <span className="fm-sync-dot" aria-hidden="true" />
      {copy}
    </span>
  )
}
