import { useCallback, useState } from 'react'

/** useState that also remembers the value in localStorage, for small per-device preferences. */
export function usePersistentState<T>(key: string, initial: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? initial : (JSON.parse(raw) as T)
    } catch {
      return initial
    }
  })

  const set = useCallback(
    (next: T) => {
      setValue(next)
      try {
        localStorage.setItem(key, JSON.stringify(next))
      } catch {
        // Storage unavailable; keep the value for this session only.
      }
    },
    [key],
  )

  return [value, set]
}
