import { describe, expect, it } from 'vitest'
import { findMethod } from '../data/methods'
import { brewEndSec } from './brew'
import { cleanCustom, customQuery, decodeSteps, encodeSteps, orderSteps, parseClock, readCustom } from './custom'

describe('parseClock', () => {
  it('reads m:ss and plain seconds', () => {
    expect(parseClock('3:30')).toBe(210)
    expect(parseClock('0:45')).toBe(45)
    expect(parseClock('3.05')).toBe(185)
    expect(parseClock('90')).toBe(90)
  })

  it('rejects junk', () => {
    expect(parseClock('')).toBeNull()
    expect(parseClock('1:75')).toBeNull()
    expect(parseClock('a:b')).toBeNull()
  })
})

describe('custom steps', () => {
  const steps = [
    { type: 'bloom' as const, atSec: 0, targetG: 45 },
    { type: 'pour' as const, atSec: 40, n: 1, targetG: 150 },
    { type: 'pour' as const, atSec: 80, n: 2, targetG: 250.5 },
    { type: 'drawdown' as const, atSec: 150 },
  ]

  it('round-trips through the URL', () => {
    expect(encodeSteps(steps)).toBe('b0-45_p40-150_p80-250.5_d150')
    expect(decodeSteps(encodeSteps(steps))).toEqual(steps)
  })

  it('sorts by time and renumbers pours', () => {
    const ordered = orderSteps([
      { type: 'pour', atSec: 60, targetG: 200 },
      { type: 'bloom', atSec: 0, targetG: 40 },
      { type: 'pour', atSec: 30, targetG: 100 },
    ])
    expect(ordered.map((s) => [s.type, s.atSec, s.n])).toEqual([
      ['bloom', 0, undefined],
      ['pour', 30, 1],
      ['pour', 60, 2],
    ])
  })

  it('drops invalid steps and targets on steps that pour nothing', () => {
    expect(decodeSteps('x5_p10-100_s20-50')).toEqual([
      { type: 'pour', atSec: 10, n: 1, targetG: 100 },
      { type: 'stir', atSec: 20 },
    ])
    expect(decodeSteps('nonsense')).toBeUndefined()
  })
})

describe('cleanCustom', () => {
  it('keeps valid fields only', () => {
    expect(cleanCustom({ tempC: 90, grind: 'coarse', time: 200, steps: 'no' })).toEqual({ tempC: 90, grind: 'coarse', time: 200 })
    expect(cleanCustom({ tempC: 150, grind: 'dust', time: -5 })).toBeUndefined()
    expect(cleanCustom(null)).toBeUndefined()
  })

  it('round-trips through the URL query', () => {
    const custom = { tempC: 88, grind: 'medium' as const, time: 240, steps: [{ type: 'pourAll' as const, atSec: 0, targetG: 300 }] }
    expect(readCustom(new URLSearchParams(customQuery(custom)))).toEqual(custom)
    expect(customQuery(undefined)).toBe('')
  })
})

describe('brewEndSec with an own time', () => {
  it('uses the time in the method unit, never before the last step', () => {
    const v60 = findMethod('v60')!
    expect(brewEndSec(v60, [{ type: 'pour', atSec: 100 }], 'standard', 240)).toBe(240)
    expect(brewEndSec(v60, [{ type: 'pour', atSec: 300 }], 'standard', 240)).toBe(300)
    expect(brewEndSec(findMethod('espresso')!, [{ type: 'pourAll', atSec: 0 }])).toBe(30)
    expect(brewEndSec(findMethod('moka')!, [{ type: 'steep', atSec: 0 }], 'standard', 4)).toBe(240)
  })
})
