'use client'

import { useCallback, useEffect, useState } from 'react'

export interface GridDensity {
  mobile: 1 | 2
  desktop: 2 | 4
}

export const DEFAULT_DENSITY: GridDensity = { mobile: 2, desktop: 4 }
export const DENSITY_STORAGE_KEY = '7eno:grid-density'

/** localStorage, or null when the browser blocks it (private mode, blocked site data). */
function storage(): Storage | null {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/** The stored density; any missing, blocked or malformed value gives the defaults. */
export function readDensity(): GridDensity {
  try {
    const raw = storage()?.getItem(DENSITY_STORAGE_KEY)
    if (!raw) return DEFAULT_DENSITY
    const parsed: unknown = JSON.parse(raw)
    const value = (parsed !== null && typeof parsed === 'object' ? parsed : {}) as Record<string, unknown>
    return { mobile: value.mobile === 1 ? 1 : 2, desktop: value.desktop === 2 ? 2 : 4 }
  } catch {
    return DEFAULT_DENSITY
  }
}

function writeDensity(density: GridDensity): void {
  try {
    storage()?.setItem(DENSITY_STORAGE_KEY, JSON.stringify(density))
  } catch {
    // Blocked or full: the choice still applies, it just is not remembered.
  }
}

/** Products per row, remembered per browser. A convenience: it may silently forget. */
export function useGridDensity(): [GridDensity, (patch: Partial<GridDensity>) => void] {
  const [density, setDensity] = useState<GridDensity>(DEFAULT_DENSITY)

  useEffect(() => {
    // Read after mount: the server has no storage, so the first client render
    // must match the server (the defaults) before the stored choice applies.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDensity(readDensity())
  }, [])

  const update = useCallback((patch: Partial<GridDensity>) => {
    setDensity((prev) => {
      const next = { ...prev, ...patch }
      writeDensity(next)
      return next
    })
  }, [])

  return [density, update]
}
