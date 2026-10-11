import { useTheme } from '../../styles/useTheme'

/** Sun/moon toggle — cycles light → dark → system. */
export default function ThemeToggle({ className = '' }) {
  const { theme, resolved, setTheme } = useTheme()
  const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'
  const label = `Theme: ${theme}. Activate to switch to ${next}.`
  return (
    <button
      type="button"
      className={`fm-theme-toggle ${className}`.trim()}
      onClick={() => setTheme(next)}
      aria-label={label}
      title={label}
    >
      <span aria-hidden="true">{resolved === 'dark' ? '☾' : '☀'}</span>
      <span className="fm-theme-toggle-text">{theme === 'system' ? 'Auto' : resolved === 'dark' ? 'Dark' : 'Light'}</span>
    </button>
  )
}
