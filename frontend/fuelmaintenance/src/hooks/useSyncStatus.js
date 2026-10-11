import { useEffect, useState } from 'react'

/** Online/offline + pending-sync state for the sync-status pill. */
export function useSyncStatus() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine)
  const [pending, setPending] = useState(() => {
    try {
      return Number(localStorage.getItem('fuelmaintenance.pendingSync') ?? 0) || 0
    } catch {
      return 0
    }
  })

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  const state = !online ? 'offline' : pending > 0 ? 'syncing' : 'synced'
  return { online, pending, state, setPending }
}
