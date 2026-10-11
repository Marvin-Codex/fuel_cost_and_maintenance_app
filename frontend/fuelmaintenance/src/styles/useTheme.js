import { useContext } from 'react'
import { ThemeContext } from './theme-context'

/** Read the current theme choice and resolved mode. */
export function useTheme() {
  return useContext(ThemeContext)
}
