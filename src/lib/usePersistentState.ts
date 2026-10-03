import { useCallback, useSyncExternalStore } from 'react'

/**
 * Small per-device preferences in localStorage. Every hook using the same key
 * shares one value, so a change on the Settings screen shows up everywhere at once.
 */

const listeners = new Map<string, Set<() => void>>()
const parsed = new Map<string, { raw: string | null; value: unknown }>()
// Used when localStorage is blocked (private mode): values then last for the session.
const memory = new Map<string, string>()

function readRaw(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return memory.get(key) ?? null
  }
}

function read<T>(key: string, initial: T): T {
  const raw = readRaw(key)
  const cached = parsed.get(key)
  if (cached && cached.raw === raw) return cached.value as T
  let value: T = initial
  if (raw !== null) {
    try {
      value = JSON.parse(raw) as T
    } catch {
      value = initial
    }
  }
  parsed.set(key, { raw, value })
  return value
}

function notify(key: string) {
  listeners.get(key)?.forEach((l) => l())
}

export function writePersistent<T>(key: string, value: T): void {
  const raw = JSON.stringify(value)
  try {
    localStorage.setItem(key, raw)
  } catch {
    memory.set(key, raw)
  }
  notify(key)
}

function subscribe(key: string, cb: () => void) {
  let set = listeners.get(key)
  if (!set) listeners.set(key, (set = new Set()))
  set.add(cb)
  // Another tab changed it.
  const onStorage = (e: StorageEvent) => {
    if (e.key === key || e.key === null) cb()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    set.delete(cb)
    window.removeEventListener('storage', onStorage)
  }
}

export function usePersistentState<T>(key: string, initial: T): [T, (value: T) => void] {
  const value = useSyncExternalStore(
    useCallback((cb: () => void) => subscribe(key, cb), [key]),
    () => read(key, initial),
    () => initial,
  )
  const set = useCallback((next: T) => writePersistent(key, next), [key])
  return [value, set]
}
