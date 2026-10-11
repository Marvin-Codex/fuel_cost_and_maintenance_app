import { useCallback, useEffect, useState } from 'react'
import { ThemeContext } from './theme-context'

const STORAGE_KEY = 'fuelmaintenance.theme'

function resolveTheme(choice) {
  if (choice === 'light' || choice === 'dark') return choice
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

/** Theme provider: light/dark tokens + prefers-color-scheme fallback. */
export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) ?? 'system'
    } catch {
      return 'system'
    }
  })
  const resolved = resolveTheme(theme)

  useEffect(() => {
    document.documentElement.dataset.theme = resolved
    document.documentElement.style.colorScheme = resolved
  }, [resolved])

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!media) return
    const onChange = () => {
      // Re-resolve only when the user has not picked an explicit theme.
      try {
        if ((localStorage.getItem(STORAGE_KEY) ?? 'system') === 'system') {
          document.documentElement.dataset.theme = media.matches ? 'dark' : 'light'
          document.documentElement.style.colorScheme = media.matches ? 'dark' : 'light'
        }
      } catch {
        /* offline/private mode — keep current theme */
      }
    }
    media.addEventListener?.('change', onChange)
    return () => media.removeEventListener?.('change', onChange)
  }, [])

  const setTheme = useCallback((next) => {
    setThemeState(next)
    try {
      if (next === 'system') localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, next)
    } catch {
      /* storage unavailable — theme still applies for this session */
    }
  }, [])

  return <ThemeContext.Provider value={{ theme, resolved, setTheme }}>{children}</ThemeContext.Provider>
}
