import type { BrewStep } from './brew'

/**
 * Brew timer as plain data. Elapsed time is always derived from a clock reading,
 * never counted up by an interval, so it stays exact when the tab is throttled
 * or the phone is locked.
 */
export type TimerStatus = 'idle' | 'running' | 'paused' | 'done'

export interface TimerState {
  status: TimerStatus
  /** Clock reading (ms) when the current running stretch began; null unless running. */
  runningSince: number | null
  /** Milliseconds banked from earlier running stretches. */
  bankedMs: number
}

export const initialTimer: TimerState = { status: 'idle', runningSince: null, bankedMs: 0 }

export function elapsedMs(state: TimerState, now: number): number {
  return state.runningSince === null ? state.bankedMs : state.bankedMs + (now - state.runningSince)
}

export function start(state: TimerState, now: number): TimerState {
  if (state.status === 'running' || state.status === 'done') return state
  return { status: 'running', runningSince: now, bankedMs: state.bankedMs }
}

export function pause(state: TimerState, now: number): TimerState {
  if (state.status !== 'running') return state
  return { status: 'paused', runningSince: null, bankedMs: elapsedMs(state, now) }
}

export function reset(): TimerState {
  return initialTimer
}

/** Moves to `targetMs`, keeping the timer running or paused as it was. */
export function seek(state: TimerState, now: number, targetMs: number): TimerState {
  const bankedMs = Math.max(0, targetMs)
  if (state.status === 'running') return { status: 'running', runningSince: now, bankedMs }
  return { status: state.status === 'idle' ? 'paused' : state.status, runningSince: null, bankedMs }
}

/** Marks the brew finished once the end time is reached. */
export function settle(state: TimerState, now: number, endMs: number): TimerState {
  if (state.status === 'done' || elapsedMs(state, now) < endMs) return state
  return { status: 'done', runningSince: null, bankedMs: endMs }
}

/** Index of the step in progress at `elapsedSec`, or -1 before the first step. */
export function currentStepIndex(steps: BrewStep[], elapsedSec: number): number {
  let index = -1
  steps.forEach((s, i) => {
    if (s.atSec <= elapsedSec) index = i
  })
  return index
}

/** Where "Next step" jumps to: the next step's start, or the end of the brew. */
export function nextStepMs(steps: BrewStep[], elapsedSec: number, endSec: number): number {
  const next = steps.find((s) => s.atSec > elapsedSec)
  return (next ? next.atSec : endSec) * 1000
}
