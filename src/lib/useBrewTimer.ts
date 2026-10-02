import { useCallback, useEffect, useState } from 'react'
import { elapsedMs, initialTimer, pause, reset, seek, settle, start, type TimerState } from './timer'

const now = () => performance.now()
const TICK_MS = 200

export function useBrewTimer(endMs: number) {
  const [state, setState] = useState<TimerState>(initialTimer)
  const [clock, setClock] = useState(now)

  useEffect(() => {
    if (state.status !== 'running') return
    const id = setInterval(() => {
      const t = now()
      setClock(t)
      setState((s) => settle(s, t, endMs))
    }, TICK_MS)
    return () => clearInterval(id)
  }, [state.status, endMs])

  const act = useCallback(
    (fn: (s: TimerState, t: number) => TimerState) => {
      const t = now()
      setClock(t)
      setState((s) => settle(fn(s, t), t, endMs))
    },
    [endMs],
  )

  return {
    status: state.status,
    elapsedMs: Math.min(elapsedMs(state, clock), endMs),
    start: () => act(start),
    pause: () => act(pause),
    reset: () => act(() => reset()),
    seek: (targetMs: number) => act((s, t) => seek(s, t, targetMs)),
  }
}
