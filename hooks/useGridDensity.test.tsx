import { renderHook, act } from '@testing-library/react'
import { DEFAULT_DENSITY, DENSITY_STORAGE_KEY, useGridDensity } from './useGridDensity'

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  jest.restoreAllMocks()
})

/** Make every read of window.localStorage throw, like a browser with storage blocked. */
function blockStorageAccessor(): () => void {
  const own = Object.getOwnPropertyDescriptor(window, 'localStorage')
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    get() {
      throw new DOMException('The operation is insecure.', 'SecurityError')
    },
  })
  return () => {
    if (own) Object.defineProperty(window, 'localStorage', own)
    else delete (window as unknown as Record<string, unknown>).localStorage
  }
}

describe('useGridDensity', () => {
  it('starts at 2 per row on mobile and 4 on desktop', () => {
    const { result } = renderHook(() => useGridDensity())
    expect(result.current[0]).toEqual(DEFAULT_DENSITY)
    expect(DEFAULT_DENSITY).toEqual({ mobile: 2, desktop: 4 })
  })

  it('restores a stored choice after mount', () => {
    window.localStorage.setItem(DENSITY_STORAGE_KEY, JSON.stringify({ mobile: 1, desktop: 2 }))
    const { result } = renderHook(() => useGridDensity())
    expect(result.current[0]).toEqual({ mobile: 1, desktop: 2 })
  })

  it('remembers a change', () => {
    const { result } = renderHook(() => useGridDensity())
    act(() => result.current[1]({ desktop: 2 }))
    expect(result.current[0]).toEqual({ mobile: 2, desktop: 2 })
    expect(JSON.parse(window.localStorage.getItem(DENSITY_STORAGE_KEY) ?? '{}')).toEqual({ mobile: 2, desktop: 2 })
  })

  it.each(['not json', '{"mobile":3,"desktop":5}', 'null', '7', '[]'])(
    'falls back to the defaults for a stored %s',
    (stored) => {
      window.localStorage.setItem(DENSITY_STORAGE_KEY, stored)
      const { result } = renderHook(() => useGridDensity())
      expect(result.current[0]).toEqual(DEFAULT_DENSITY)
    }
  )

  it('keeps working when the storage accessor itself throws', () => {
    const restore = blockStorageAccessor()
    try {
      const { result } = renderHook(() => useGridDensity())
      expect(result.current[0]).toEqual(DEFAULT_DENSITY)
      act(() => result.current[1]({ mobile: 1 }))
      expect(result.current[0]).toEqual({ mobile: 1, desktop: 4 })
    } finally {
      restore()
    }
  })

  it('keeps the new density when writing fails', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError')
    })
    const { result } = renderHook(() => useGridDensity())
    act(() => result.current[1]({ desktop: 2 }))
    expect(result.current[0]).toEqual({ mobile: 2, desktop: 2 })
  })
})
