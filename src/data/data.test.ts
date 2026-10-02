import { describe, expect, it } from 'vitest'
import { dictionaries, type MessageKey } from '../i18n/I18nProvider'
import { GRIND_LEVELS } from './grind'
import { GRINDERS, toRotationNotation } from './grinders'
import { METHODS } from './methods'

describe('methods', () => {
  it('has the nine MVP methods with unique ids', () => {
    expect(METHODS).toHaveLength(9)
    expect(new Set(METHODS.map((m) => m.id)).size).toBe(9)
  })

  it.each(METHODS)('$id keeps its ratio defaults inside the slider range', (m) => {
    const r = m.ratio
    expect(r.min).toBeLessThanOrEqual(r.recMin)
    expect(r.recMin).toBeLessThanOrEqual(r.default)
    expect(r.default).toBeLessThanOrEqual(r.recMax)
    expect(r.recMax).toBeLessThanOrEqual(r.max)
    // The default must be a position the slider can land on.
    expect(Number.isInteger(Math.round(((r.default - r.min) / r.step) * 1e6) / 1e6)).toBe(true)
  })

  it.each(METHODS)('$id has either a temperature or a note', (m) => {
    expect(m.tempC !== null || m.tempNoteKey !== undefined).toBe(true)
  })
})

describe('grinders', () => {
  it.each(GRINDERS)('$name has a sane click range for every method', (g) => {
    for (const m of METHODS) {
      const [min, max] = g.clicks[m.id]
      expect(min).toBeGreaterThan(0)
      expect(max).toBeGreaterThanOrEqual(min)
    }
  })

  it.each(GRINDERS)('$name gets coarser as the grind level gets coarser', (g) => {
    const level = (id: string) => GRIND_LEVELS.findIndex((l) => l.id === id)
    for (const a of METHODS) {
      for (const b of METHODS) {
        if (level(a.grind) < level(b.grind)) {
          expect(g.clicks[a.id][0]).toBeLessThanOrEqual(g.clicks[b.id][0])
        }
      }
    }
  })

  it('writes 1Zpresso settings as rotation.number.click', () => {
    expect(toRotationNotation(96, 40)).toBe('2.4.0')
    expect(toRotationNotation(60, 30)).toBe('2.0.0')
    expect(toRotationNotation(50, 30)).toBe('1.6.2')
    expect(toRotationNotation(0, 40)).toBe('0.0.0')
  })
})

describe('translations', () => {
  const idKeys = Object.keys(dictionaries.id).sort()
  const enKeys = Object.keys(dictionaries.en).sort()

  it('has the same keys in Indonesian and English', () => {
    expect(enKeys).toEqual(idKeys)
  })

  it('has no empty strings', () => {
    for (const lang of ['id', 'en'] as const) {
      for (const [key, value] of Object.entries(dictionaries[lang])) {
        expect(value.trim(), `${lang}:${key}`).not.toBe('')
      }
    }
  })

  it('uses the same {placeholders} in both languages', () => {
    const vars = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort()
    for (const key of idKeys as MessageKey[]) {
      expect(vars(dictionaries.en[key]), key).toEqual(vars(dictionaries.id[key]))
    }
  })
})
