import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  fetchAccessSnapshot,
  getActiveWorkspaceId,
  getCachedSnapshot,
  setActiveWorkspaceId,
} from '../api/access'
import { accessFromSnapshot, roleLabel, selectWorkspace } from '../utils/permissions'

/**
 * Loads the access snapshot and exposes the active workspace's rights.
 *
 * state: 'loading' (first load, no cache) | 'ready' | 'error'.
 * The cached snapshot is used immediately so the dashboard works offline;
 * `version` tells us whether the fresh download changed anything.
 */
export function useAccess() {
  const [state, setState] = useState('loading')
  const [error, setError] = useState(null)
  const [isSuperuser, setIsSuperuser] = useState(() => Boolean(getCachedSnapshot()?.is_superuser))
  const [workspaces, setWorkspaces] = useState(() => getCachedSnapshot()?.workspaces ?? [])
  const [activeId, setActiveId] = useState(getActiveWorkspaceId)

  const refresh = useCallback(async () => {
    try {
      const { workspaces: fresh, activeWorkspace, isSuperuser: su } = await fetchAccessSnapshot()
      setWorkspaces(fresh)
      setIsSuperuser(su)
      // Adopt the server's default workspace when there is no stored choice,
      // or when the stored choice is not one of this user's workspaces
      // (e.g. a stale ID left over from a previous user/session).
      const stored = getActiveWorkspaceId()
      const storedIsValid = stored && fresh.some((entry) => entry.workspace?.id === stored)
      if (!storedIsValid && activeWorkspace) setActiveId(setActiveWorkspaceId(activeWorkspace))
      setError(null)
      setState('ready')
      return fresh
    } catch (err) {
      setError(err.message)
      // Keep rendering from the cache — offline is a normal state here.
      setState((current) => (current === 'ready' ? current : workspaces.length ? 'ready' : 'error'))
      return null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!workspaces.length) {
        const fresh = await refresh()
        if (mounted && !fresh && !getCachedSnapshot()) setState('error')
      } else {
        setState('ready')
      }
      // Background refresh on every mount so `version` changes are picked up.
      await refresh()
    }
    load()
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const activeEntry = useMemo(
    () => selectWorkspace(workspaces, activeId),
    [workspaces, activeId],
  )

  const access = useMemo(() => accessFromSnapshot(activeEntry), [activeEntry])

  const switchWorkspace = useCallback((id) => {
    setActiveId(setActiveWorkspaceId(id))
  }, [])

  const options = useMemo(
    () =>
      workspaces.map((entry) => ({
        id: entry.workspace?.id,
        name: entry.workspace?.name ?? 'Workspace',
        kind: entry.workspace?.kind,
        planName: entry.plan?.name,
        roleLabel: roleLabel(entry.role?.key),
      })),
    [workspaces],
  )

  return {
    state,
    error,
    refresh,
    workspaces: options,
    active: activeEntry,
    access,
    switchWorkspace,
    isSuperuser,
    roleLabel: roleLabel(activeEntry?.role?.key),
  }
}
