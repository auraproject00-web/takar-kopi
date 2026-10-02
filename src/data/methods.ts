import type { MessageKey } from '../i18n/I18nProvider'
import type { GrindLevel } from './grind'

export type MethodId =
  | 'v60'
  | 'kalita'
  | 'chemex'
  | 'frenchPress'
  | 'aeropress'
  | 'espresso'
  | 'moka'
  | 'coldBrew'
  | 'japaneseIced'

/** Decides which calculator fields and which brew schedule a method gets. */
export type BrewKind = 'pourover' | 'iced' | 'immersion' | 'espresso' | 'moka' | 'coldBrew'

export type TimeUnit = 'clock' | 'seconds' | 'minutes' | 'hours'

export interface BrewTime {
  /** In the unit given; `clock` is total seconds shown as m:ss. */
  min: number
  max?: number
  unit: TimeUnit
}

export interface BrewMethod {
  id: MethodId
  nameKey: MessageKey
  kind: BrewKind
  /** Water (or yield, for espresso) per gram of coffee. */
  ratio: {
    default: number
    /** Range the slider allows. */
    min: number
    max: number
    step: number
    /** Range we recommend, shown as the hint and on the method card. */
    recMin: number
    recMax: number
  }
  defaultCoffee: number
  /** null when the method has no single brew temperature. */
  tempC: number | null
  tempNoteKey?: MessageKey
  grind: GrindLevel
  time: BrewTime
}

export const METHODS: BrewMethod[] = [
  {
    id: 'v60',
    nameKey: 'method.v60',
    kind: 'pourover',
    ratio: { default: 16, min: 12, max: 18, step: 0.5, recMin: 15, recMax: 17 },
    defaultCoffee: 15,
    tempC: 93,
    grind: 'mediumFine',
    time: { min: 180, unit: 'clock' },
  },
  {
    id: 'kalita',
    nameKey: 'method.kalita',
    kind: 'pourover',
    ratio: { default: 16, min: 12, max: 18, step: 0.5, recMin: 15, recMax: 17 },
    defaultCoffee: 15,
    tempC: 93,
    grind: 'medium',
    time: { min: 180, unit: 'clock' },
  },
  {
    id: 'chemex',
    nameKey: 'method.chemex',
    kind: 'pourover',
    ratio: { default: 16, min: 12, max: 18, step: 0.5, recMin: 15, recMax: 17 },
    defaultCoffee: 30,
    tempC: 94,
    grind: 'mediumCoarse',
    time: { min: 240, unit: 'clock' },
  },
  {
    id: 'frenchPress',
    nameKey: 'method.frenchPress',
    kind: 'immersion',
    ratio: { default: 14, min: 10, max: 18, step: 0.5, recMin: 12, recMax: 15 },
    defaultCoffee: 30,
    tempC: 95,
    grind: 'coarse',
    time: { min: 240, unit: 'clock' },
  },
  {
    id: 'aeropress',
    nameKey: 'method.aeropress',
    kind: 'immersion',
    ratio: { default: 14, min: 10, max: 18, step: 0.5, recMin: 12, recMax: 16 },
    defaultCoffee: 15,
    tempC: 85,
    grind: 'mediumFine',
    time: { min: 120, unit: 'clock' },
  },
  {
    id: 'espresso',
    nameKey: 'method.espresso',
    kind: 'espresso',
    ratio: { default: 2, min: 1, max: 3, step: 0.1, recMin: 1.5, recMax: 2.5 },
    defaultCoffee: 18,
    tempC: 93,
    grind: 'fine',
    time: { min: 25, max: 30, unit: 'seconds' },
  },
  {
    id: 'moka',
    nameKey: 'method.moka',
    kind: 'moka',
    ratio: { default: 8, min: 5, max: 12, step: 0.5, recMin: 7, recMax: 10 },
    defaultCoffee: 15,
    tempC: null,
    tempNoteKey: 'calc.tempHot',
    grind: 'fine',
    time: { min: 4, max: 5, unit: 'minutes' },
  },
  {
    id: 'coldBrew',
    nameKey: 'method.coldBrew',
    kind: 'coldBrew',
    ratio: { default: 8, min: 4, max: 16, step: 0.5, recMin: 8, recMax: 15 },
    defaultCoffee: 100,
    tempC: null,
    tempNoteKey: 'calc.tempRoom',
    grind: 'coarse',
    time: { min: 12, max: 24, unit: 'hours' },
  },
  {
    id: 'japaneseIced',
    nameKey: 'method.japaneseIced',
    kind: 'iced',
    ratio: { default: 15, min: 12, max: 18, step: 0.5, recMin: 14, recMax: 16 },
    defaultCoffee: 20,
    tempC: 94,
    grind: 'mediumFine',
    time: { min: 150, unit: 'clock' },
  },
]

export function findMethod(id: string | undefined): BrewMethod | undefined {
  return METHODS.find((m) => m.id === id)
}
