import { roundTo } from './brew'
import { usePersistentState } from './usePersistentState'

/** Everything is stored and calculated in grams, millilitres and °C; units only change what is shown and typed. */
export interface Units {
  weight: 'g' | 'oz'
  volume: 'ml' | 'floz'
  temp: 'c' | 'f'
}

export const METRIC: Units = { weight: 'g', volume: 'ml', temp: 'c' }

export const G_PER_OZ = 28.349523125
export const ML_PER_FLOZ = 29.5735295625

export function useUnits(): [Units, (units: Units) => void] {
  return usePersistentState<Units>('cb.units', METRIC)
}

/** A display-unit view of base values, with labels. */
export interface UnitFormat {
  units: Units
  weightLabel: string
  volumeLabel: string
  /** Grams → number in the display unit (oz keeps 2 decimals so a 15 g dose still reads 0.53). */
  weight: (g: number) => number
  volume: (ml: number) => number
  toGrams: (shown: number) => number
  toMl: (shown: number) => number
  fmtWeight: (g: number) => string
  fmtVolume: (ml: number) => string
  fmtTemp: (c: number) => string
}

export function unitFormat(units: Units): UnitFormat {
  const oz = units.weight === 'oz'
  const floz = units.volume === 'floz'
  const weightLabel = oz ? 'oz' : 'g'
  const volumeLabel = floz ? 'fl oz' : 'ml'
  const weight = (g: number) => (oz ? roundTo(g / G_PER_OZ, 2) : roundTo(g, 1))
  const volume = (ml: number) => (floz ? roundTo(ml / ML_PER_FLOZ, 1) : Math.round(ml))
  return {
    units,
    weightLabel,
    volumeLabel,
    weight,
    volume,
    toGrams: (shown) => (oz ? shown * G_PER_OZ : shown),
    toMl: (shown) => (floz ? shown * ML_PER_FLOZ : shown),
    fmtWeight: (g) => `${weight(g)} ${weightLabel}`,
    fmtVolume: (ml) => `${volume(ml)} ${volumeLabel}`,
    fmtTemp: (c) => (units.temp === 'f' ? `${Math.round((c * 9) / 5 + 32)}°F` : `${c}°C`),
  }
}

export function useUnitFormat(): UnitFormat {
  const [units] = useUnits()
  return unitFormat(units)
}
