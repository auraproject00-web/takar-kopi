import { describe, expect, it } from 'vitest'
import type { BrewStep } from './brew'
import { currentStepIndex, elapsedMs, initialTimer, nextStepMs, pause, reset, seek, settle, start } from './timer'

const steps: BrewStep[] = [
  { type: 'bloom', atSec: 0, targetG: 45 },
  { type: 'pour', atSec: 45, n: 1, targetG: 110 },
  { type: 'pour', atSec: 75, n: 2, targetG: 175 },
  { type: 'drawdown', atSec: 135 },
]

describe('timer state', () => {
  it('measures elapsed time from the clock, across pauses', () => {
    let s = start(initialTimer, 1000)
    expect(elapsedMs(s, 6000)).toBe(5000)
    s = pause(s, 6000)
    // Time passing while paused does not count.
    expect(elapsedMs(s, 60_000)).toBe(5000)
    s = start(s, 60_000)
    expect(elapsedMs(s, 62_500)).toBe(7500)
  })

  it('stays exact over a long gap with no ticks (phone locked)', () => {
    const s = start(initialTimer, 0)
    expect(elapsedMs(s, 180_000)).toBe(180_000)
  })

  it('ignores pause when not running and start when done', () => {
    expect(pause(initialTimer, 10)).toBe(initialTimer)
    const done = { status: 'done' as const, runningSince: null, bankedMs: 5 }
    expect(start(done, 10)).toBe(done)
  })

  it('seeks while running or paused', () => {
    const running = seek(start(initialTimer, 0), 3000, 45_000)
    expect(running.status).toBe('running')
    expect(elapsedMs(running, 4000)).toBe(46_000)
    const paused = seek(pause(start(initialTimer, 0), 2000), 9000, 75_000)
    expect(paused).toEqual({ status: 'paused', runningSince: null, bankedMs: 75_000 })
  })

  it('finishes exactly at the end time', () => {
    const s = start(initialTimer, 0)
    expect(settle(s, 179_999, 180_000)).toBe(s)
    expect(settle(s, 200_000, 180_000)).toEqual({ status: 'done', runningSince: null, bankedMs: 180_000 })
  })

  it('resets to idle', () => {
    expect(reset()).toEqual(initialTimer)
  })
})

describe('steps', () => {
  it('finds the step in progress', () => {
    expect(currentStepIndex(steps, 0)).toBe(0)
    expect(currentStepIndex(steps, 44.9)).toBe(0)
    expect(currentStepIndex(steps, 45)).toBe(1)
    expect(currentStepIndex(steps, 200)).toBe(3)
    expect(currentStepIndex([], 10)).toBe(-1)
  })

  it('jumps to the next step, then to the end', () => {
    expect(nextStepMs(steps, 10, 180)).toBe(45_000)
    expect(nextStepMs(steps, 75, 180)).toBe(135_000)
    expect(nextStepMs(steps, 140, 180)).toBe(180_000)
  })
})
