import { describe, expect, it } from 'vitest'
import { METRIC, unitFormat } from './units'

describe('units', () => {
  it('shows metric values unchanged', () => {
    const f = unitFormat(METRIC)
    expect(f.fmtWeight(15)).toBe('15 g')
    expect(f.fmtWeight(15.55)).toBe('15.6 g')
    expect(f.fmtVolume(240)).toBe('240 ml')
    expect(f.fmtTemp(93)).toBe('93°C')
    expect(f.toGrams(15)).toBe(15)
  })

  it('converts to imperial for display', () => {
    const f = unitFormat({ weight: 'oz', volume: 'floz', temp: 'f' })
    expect(f.fmtWeight(15)).toBe('0.53 oz')
    expect(f.fmtWeight(340)).toBe('11.99 oz')
    expect(f.fmtVolume(240)).toBe('8.1 fl oz')
    expect(f.fmtTemp(93)).toBe('199°F')
    expect(f.fmtTemp(100)).toBe('212°F')
  })

  it('round-trips typed values back to grams and ml', () => {
    const f = unitFormat({ weight: 'oz', volume: 'floz', temp: 'c' })
    expect(f.toGrams(1)).toBeCloseTo(28.35, 2)
    expect(f.toMl(8)).toBeCloseTo(236.59, 2)
    expect(f.weight(f.toGrams(0.53))).toBe(0.53)
  })
})
