import { describe, expect, it } from 'vitest'
import { calcAmounts } from '../lib/brew'
import { findMethod, METHODS, type MethodId } from './methods'
import { cleanChoice, defaultChoice, guidedAmounts, guidedInput, PORTIONS } from './portions'

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

  it('rounds guided coffee to whole grams and keeps the water exact', () => {
    // 500 ml at 1:16 = 31.25 g → 31 g, sent on as 1:16.129 so the timer still pours 500 ml
    expect(guidedAmounts(m('v60'), { sizeId: 'm', count: 2, strength: 'normal' })).toEqual({
      amounts: { coffee: 31, water: 500 },
      ratio: 16.129,
    })
    for (const method of METHODS) {
      for (const size of PORTIONS[method.id].sizes) {
        for (const strength of ['light', 'normal', 'strong'] as const) {
          for (let count = 1; count <= PORTIONS[method.id].maxCount; count++) {
            const { amounts, ratio } = guidedAmounts(method, { sizeId: size.id, count, strength })
            expect(Number.isInteger(amounts.coffee), `${method.id} ${size.id}`).toBe(true)
            if (PORTIONS[method.id].basis === 'water') expect(amounts.water).toBe(size.amount * count)
            // Stays a valid ratio for the timer/recipe URL
            expect(ratio).toBeGreaterThanOrEqual(method.ratio.min)
            expect(ratio).toBeLessThanOrEqual(method.ratio.max)
            // What the timer recomputes from coffee + ratio matches
            expect(calcAmounts(method.kind, 'coffee', amounts.coffee, ratio).water).toBe(amounts.water)
          }
        }
      }
    }
  })

  it('splits Japanese iced into hot water and ice from the rounded dose', () => {
    expect(guidedAmounts(m('japaneseIced'), { sizeId: 'm', count: 1, strength: 'normal' }).amounts).toEqual({
      coffee: 17,
      water: 250,
      hotWater: 150,
      ice: 100,
    })
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
