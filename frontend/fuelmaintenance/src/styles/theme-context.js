import { createContext } from 'react'

/** Shared theme context object — kept in its own module for React Fast Refresh. */
export const ThemeContext = createContext({ theme: 'system', resolved: 'light', setTheme: () => {} })
