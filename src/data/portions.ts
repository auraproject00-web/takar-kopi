import type { MessageKey } from '../i18n/I18nProvider'
import type { BrewMethod, MethodId } from './methods'
import { calcAmounts, roundTo, type Amounts } from '../lib/brew'

/**
 * Guided mode: the user picks a cup size, how many cups and a strength, and the
 * app sets the numbers. Sizes are drink volume in ml, except espresso, where the
 * size is the dose in grams.
 */
export type Strength = 'light' | 'normal' | 'strong'
export type SizeLabel = 'small' | 'medium' | 'large' | 'single' | 'double' | 'cup' | 'volume'

export interface PortionSize {
  id: string
  label: SizeLabel
  /** ml of water (or grams of coffee when `basis` is "dose"). */
  amount: number
  /** For moka pots: the pot's rated cups. */
  cups?: number
}

export interface PortionConfig {
  basis: 'water' | 'dose'
  sizes: PortionSize[]
  defaultSize: string
  /** 1 hides the cup counter (one pot / one shot / one press at a time). */
  maxCount: number
  sizeKey: MessageKey
  /** Water (or yield) per gram of coffee for each strength. */
  ratios: Record<Strength, number>
}

const CUPS: PortionSize[] = [
  { id: 's', label: 'small', amount: 150 },
  { id: 'm', label: 'medium', amount: 250 },
  { id: 'l', label: 'large', amount: 350 },
]

const POUROVER_RATIOS: Record<Strength, number> = { strong: 15, normal: 16, light: 17 }

export const PORTIONS: Record<MethodId, PortionConfig> = {
  v60: { basis: 'water', sizes: CUPS, defaultSize: 'm', maxCount: 3, sizeKey: 'calc.size', ratios: POUROVER_RATIOS },
  kalita: { basis: 'water', sizes: CUPS, defaultSize: 'm', maxCount: 3, sizeKey: 'calc.size', ratios: POUROVER_RATIOS },
  chemex: { basis: 'water', sizes: CUPS, defaultSize: 'm', maxCount: 4, sizeKey: 'calc.size', ratios: POUROVER_RATIOS },
  japaneseIced: {
    basis: 'water',
    sizes: CUPS,
    defaultSize: 'm',
    maxCount: 3,
    sizeKey: 'calc.size',
    ratios: { strong: 14, normal: 15, light: 16 },
  },
  frenchPress: {
    basis: 'water',
    sizes: CUPS,
    defaultSize: 'm',
    maxCount: 4,
    sizeKey: 'calc.size',
    ratios: { strong: 12, normal: 14, light: 15 },
  },
  aeropress: {
    basis: 'water',
    sizes: [
      { id: 's', label: 'small', amount: 150 },
      { id: 'm', label: 'medium', amount: 200 },
      { id: 'l', label: 'large', amount: 250 },
    ],
    defaultSize: 'm',
    maxCount: 1,
    sizeKey: 'calc.size',
    ratios: { strong: 12, normal: 14, light: 16 },
  },
  espresso: {
    basis: 'dose',
    sizes: [
      { id: 'single', label: 'single', amount: 9 },
      { id: 'double', label: 'double', amount: 18 },
    ],
    defaultSize: 'double',
    maxCount: 1,
    sizeKey: 'calc.size.espresso',
    ratios: { strong: 1.5, normal: 2, light: 2.5 },
  },
  moka: {
    basis: 'water',
    sizes: [
      { id: '1', label: 'cup', amount: 60, cups: 1 },
      { id: '3', label: 'cup', amount: 150, cups: 3 },
      { id: '6', label: 'cup', amount: 300, cups: 6 },
    ],
    defaultSize: '3',
    maxCount: 1,
    sizeKey: 'calc.size.moka',
    ratios: { strong: 7, normal: 8, light: 10 },
  },
  coldBrew: {
    basis: 'water',
    sizes: [
      { id: '500', label: 'volume', amount: 500 },
      { id: '1000', label: 'volume', amount: 1000 },
      { id: '1500', label: 'volume', amount: 1500 },
    ],
    defaultSize: '1000',
    maxCount: 1,
    sizeKey: 'calc.size.batch',
    ratios: { strong: 8, normal: 10, light: 12 },
  },
}

export interface GuidedChoice {
  sizeId: string
  count: number
  strength: Strength
}

export function defaultChoice(method: BrewMethod): GuidedChoice {
  return { sizeId: PORTIONS[method.id].defaultSize, count: 1, strength: 'normal' }
}

/** Clamps a choice (e.g. from a URL) to what the method offers. */
export function cleanChoice(method: BrewMethod, raw: Partial<GuidedChoice>): GuidedChoice {
  const p = PORTIONS[method.id]
  const size = p.sizes.find((s) => s.id === raw.sizeId) ?? p.sizes.find((s) => s.id === p.defaultSize)!
  const count = Math.min(p.maxCount, Math.max(1, Math.round(Number(raw.count) || 1)))
  const strength: Strength = raw.strength === 'light' || raw.strength === 'strong' ? raw.strength : 'normal'
  return { sizeId: size.id, count, strength }
}

/** What to feed the calculator: which side is fixed, its amount, and the ratio. */
export function guidedInput(method: BrewMethod, choice: GuidedChoice) {
  const p = PORTIONS[method.id]
  const c = cleanChoice(method, choice)
  const size = p.sizes.find((s) => s.id === c.sizeId)!
  return {
    mode: p.basis === 'dose' ? ('coffee' as const) : ('water' as const),
    amount: size.amount * c.count,
    ratio: p.ratios[c.strength],
  }
}

/**
 * The guided result. Coffee is rounded to whole grams so it is easy to weigh,
 * and the water stays exactly the chosen volume; the ratio passed on is the real
 * one (e.g. 250 ml / 16 g = 1:15.625), so the timer and saved recipes keep 250 ml.
 */
export function guidedAmounts(method: BrewMethod, choice: GuidedChoice): { amounts: Amounts; ratio: number } {
  const g = guidedInput(method, choice)
  if (g.mode === 'coffee') return { amounts: calcAmounts(method.kind, 'coffee', g.amount, g.ratio), ratio: g.ratio }
  const coffee = Math.max(1, Math.round(g.amount / g.ratio))
  const ratio = roundTo(g.amount / coffee, 3)
  return { amounts: calcAmounts(method.kind, 'coffee', coffee, ratio), ratio }
}
