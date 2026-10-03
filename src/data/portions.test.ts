import { describe, expect, it } from 'vitest'
import { calcAmounts } from '../lib/brew'
import { findMethod, METHODS, type MethodId } from './methods'
import { cleanChoice, defaultChoice, guidedInput, PORTIONS } from './portions'

const m = (id: MethodId) => findMethod(id)!

describe('portions', () => {
  it.each(METHODS)('$id: every strength stays inside the ratio slider range, strong < normal < light', (method) => {
    const { ratios } = PORTIONS[method.id]
    expect(ratios.strong).toBeLessThan(ratios.normal)
    expect(ratios.normal).toBeLessThan(ratios.light)
    for (const r of Object.values(ratios)) {
      expect(r).toBeGreaterThanOrEqual(method.ratio.min)
      expect(r).toBeLessThanOrEqual(method.ratio.max)
    }
  })

  it.each(METHODS)('$id: the default size exists', (method) => {
    const p = PORTIONS[method.id]
    expect(p.sizes.some((s) => s.id === p.defaultSize)).toBe(true)
  })

  it('makes two medium V60 cups at normal strength: 500 ml at 1:16', () => {
    const input = guidedInput(m('v60'), { sizeId: 'm', count: 2, strength: 'normal' })
    expect(input).toEqual({ mode: 'water', amount: 500, ratio: 16 })
    expect(calcAmounts('pourover', input.mode, input.amount, input.ratio)).toEqual({ coffee: 31.3, water: 500 })
  })

  it('uses the dose for espresso: a strong double is 18 g → 27 g', () => {
    const input = guidedInput(m('espresso'), { sizeId: 'double', count: 1, strength: 'strong' })
    expect(calcAmounts('espresso', input.mode, input.amount, input.ratio)).toEqual({ coffee: 18, water: 27 })
  })

  it('clamps bad choices from a URL', () => {
    expect(cleanChoice(m('v60'), { sizeId: 'xxl', count: 99, strength: 'normal' })).toEqual({ sizeId: 'm', count: 3, strength: 'normal' })
    expect(cleanChoice(m('aeropress'), { sizeId: 's', count: 3 })).toEqual({ sizeId: 's', count: 1, strength: 'normal' })
    expect(cleanChoice(m('moka'), { count: -2, strength: 'weird' as never })).toEqual({ sizeId: '3', count: 1, strength: 'normal' })
    expect(defaultChoice(m('coldBrew'))).toEqual({ sizeId: '1000', count: 1, strength: 'normal' })
  })
})
