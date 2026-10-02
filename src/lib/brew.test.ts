import { describe, expect, it } from 'vitest'
import { findMethod, METHODS, type BrewMethod, type MethodId } from '../data/methods'
import { brewEndSec, brewSchedule, calcAmounts, formatClock, formatRatio, formatTime, roundTo } from './brew'

function method(id: MethodId): BrewMethod {
  const m = findMethod(id)
  if (!m) throw new Error(id)
  return m
}

describe('calcAmounts', () => {
  it('computes water from coffee', () => {
    expect(calcAmounts('pourover', 'coffee', 15, 16)).toEqual({ coffee: 15, water: 240 })
    expect(calcAmounts('pourover', 'coffee', 15, 16.5)).toEqual({ coffee: 15, water: 248 })
  })

  it('computes coffee from water, rounded to 0.1 g', () => {
    expect(calcAmounts('pourover', 'water', 250, 16)).toEqual({ coffee: 15.6, water: 250 })
    expect(calcAmounts('immersion', 'water', 500, 15)).toEqual({ coffee: 33.3, water: 500 })
  })

  it('round-trips coffee → water → coffee', () => {
    const forward = calcAmounts('pourover', 'coffee', 20, 16)
    expect(calcAmounts('pourover', 'water', forward.water, 16).coffee).toBe(20)
  })

  it('treats espresso water as yield with one decimal', () => {
    expect(calcAmounts('espresso', 'coffee', 18, 2)).toEqual({ coffee: 18, water: 36 })
    expect(calcAmounts('espresso', 'coffee', 18.5, 2.1)).toEqual({ coffee: 18.5, water: 38.9 })
    expect(calcAmounts('espresso', 'water', 40, 2)).toEqual({ coffee: 20, water: 40 })
  })

  it('splits Japanese iced water into 60% hot and 40% ice', () => {
    const a = calcAmounts('iced', 'coffee', 20, 15)
    expect(a).toEqual({ coffee: 20, water: 300, hotWater: 180, ice: 120 })
  })

  it('keeps hot water + ice equal to the total even when rounding', () => {
    for (let coffee = 1; coffee <= 40; coffee += 0.7) {
      const a = calcAmounts('iced', 'coffee', coffee, 15.5)
      expect(a.hotWater! + a.ice!).toBe(a.water)
    }
  })

  it('returns zeros for empty, negative or invalid input', () => {
    expect(calcAmounts('pourover', 'coffee', Number.NaN, 16)).toEqual({ coffee: 0, water: 0 })
    expect(calcAmounts('pourover', 'coffee', -5, 16)).toEqual({ coffee: 0, water: 0 })
    expect(calcAmounts('pourover', 'water', 250, 0)).toEqual({ coffee: 0, water: 0 })
  })
})

describe('brewSchedule', () => {
  it('builds the V60 schedule from the wireframe: 15 g / 240 ml', () => {
    expect(brewSchedule(method('v60'), 15, 240)).toEqual([
      { type: 'bloom', atSec: 0, targetG: 45 },
      { type: 'pour', atSec: 45, n: 1, targetG: 110 },
      { type: 'pour', atSec: 75, n: 2, targetG: 175 },
      { type: 'pour', atSec: 105, n: 3, targetG: 240 },
      { type: 'drawdown', atSec: 135 },
    ])
  })

  it('ends every pour-over on exactly the total water, with rising targets and times', () => {
    for (const m of METHODS.filter((x) => x.kind === 'pourover' || x.kind === 'iced')) {
      for (const coffee of [8, 15, 22.5, 40]) {
        const water = Math.round(coffee * m.ratio.default)
        const steps = brewSchedule(m, coffee, water)
        const targets = steps.flatMap((s) => (s.targetG !== undefined ? [s.targetG] : []))
        expect(targets.at(-1)).toBe(water)
        expect(targets).toEqual([...targets].sort((a, b) => a - b))
        const times = steps.map((s) => s.atSec)
        expect(times).toEqual([...times].sort((a, b) => a - b))
      }
    }
  })

  it('never blooms with more water than the total', () => {
    const steps = brewSchedule(method('v60'), 30, 60)
    expect(steps[0]).toMatchObject({ type: 'bloom', targetG: 60 })
  })

  it('uses a smaller bloom for Japanese iced (hot water only)', () => {
    const steps = brewSchedule(method('japaneseIced'), 20, 180)
    expect(steps[0]).toMatchObject({ type: 'bloom', targetG: 40 })
    expect(steps.at(-2)).toMatchObject({ type: 'pour', targetG: 180 })
  })

  it('pours everything at once for immersion and presses at the end', () => {
    const fp = brewSchedule(method('frenchPress'), 30, 420)
    expect(fp[0]).toEqual({ type: 'pourAll', atSec: 0, targetG: 420 })
    expect(fp.at(-1)).toEqual({ type: 'press', atSec: 240 })
    expect(brewSchedule(method('aeropress'), 15, 210).at(-1)).toEqual({ type: 'press', atSec: 90 })
  })

  it('has no schedule for espresso, moka or cold brew, or for zero amounts', () => {
    expect(brewSchedule(method('espresso'), 18, 36)).toEqual([])
    expect(brewSchedule(method('moka'), 15, 120)).toEqual([])
    expect(brewSchedule(method('coldBrew'), 100, 800)).toEqual([])
    expect(brewSchedule(method('v60'), 0, 0)).toEqual([])
  })
})

describe('4:6 pour style', () => {
  it('splits the water into five equal pours 45 s apart (20 g / 300 ml)', () => {
    expect(brewSchedule(method('v60'), 20, 300, '46')).toEqual([
      { type: 'pour', atSec: 0, n: 1, targetG: 60 },
      { type: 'pour', atSec: 45, n: 2, targetG: 120 },
      { type: 'pour', atSec: 90, n: 3, targetG: 180 },
      { type: 'pour', atSec: 135, n: 4, targetG: 240 },
      { type: 'pour', atSec: 180, n: 5, targetG: 300 },
    ])
    expect(brewEndSec(method('v60'), [], '46')).toBe(210)
  })

  it('puts 40% of the water in the first two pours', () => {
    const steps = brewSchedule(method('v60'), 17, 255, '46')
    expect(steps[1]!.targetG).toBe(102)
    expect(steps.at(-1)!.targetG).toBe(255)
  })

  it('is ignored for methods other than V60', () => {
    const chemex = method('chemex')
    expect(brewSchedule(chemex, 30, 480, '46')).toEqual(brewSchedule(chemex, 30, 480))
  })
})

describe('brewEndSec', () => {
  it('uses the method total time, or the last step if later', () => {
    const v60 = method('v60')
    expect(brewEndSec(v60, brewSchedule(v60, 15, 240))).toBe(180)
    const fp = method('frenchPress')
    expect(brewEndSec(fp, brewSchedule(fp, 30, 420))).toBe(240)
    const ap = method('aeropress')
    expect(brewEndSec(ap, brewSchedule(ap, 15, 210))).toBe(120)
  })
})

describe('formatting', () => {
  it('formats clock times', () => {
    expect(formatClock(0)).toBe('0:00')
    expect(formatClock(75)).toBe('1:15')
    expect(formatClock(240)).toBe('4:00')
  })

  it('formats ratios without trailing zeros', () => {
    expect(formatRatio(16)).toBe('1:16')
    expect(formatRatio(16.5)).toBe('1:16.5')
    expect(formatRatio(2.1000000001)).toBe('1:2.1')
  })

  it('formats brew times by unit', () => {
    expect(formatTime({ min: 180, unit: 'clock' }, '')).toBe('3:00')
    expect(formatTime({ min: 25, max: 30, unit: 'seconds' }, 'dtk')).toBe('25–30 dtk')
    expect(formatTime({ min: 12, max: 24, unit: 'hours' }, 'jam')).toBe('12–24 jam')
  })

  it('rounds half up', () => {
    expect(roundTo(15.55, 1)).toBe(15.6)
    expect(roundTo(239.5, 0)).toBe(240)
  })
})
