import type { MessageKey } from '../i18n/I18nProvider'

/**
 * Bean reference for the "Beans" tab: how species, process and roast level
 * shift the water temperature for hot manual brews. Temperatures are a
 * starting point (°C), centred on the roast level and nudged per bean.
 */
export type RoastId = 'light' | 'medium' | 'dark'
export type SpeciesId = 'arabica' | 'robusta' | 'liberica'
export type ProcessId = 'washed' | 'natural' | 'honey' | 'wetHulled' | 'anaerobic'

export interface BeanInfo<T extends string> {
  id: T
  nameKey: MessageKey
  descKey: MessageKey
  flavorKey: MessageKey
  /** Degrees added to the roast level's centre temperature. */
  offset: number
}

export const ROASTS: { id: RoastId; nameKey: MessageKey; hintKey: MessageKey; centreC: number }[] = [
  { id: 'light', nameKey: 'beans.roast.light', hintKey: 'beans.roast.lightHint', centreC: 94 },
  { id: 'medium', nameKey: 'beans.roast.medium', hintKey: 'beans.roast.mediumHint', centreC: 92 },
  { id: 'dark', nameKey: 'beans.roast.dark', hintKey: 'beans.roast.darkHint', centreC: 88 },
]

export const SPECIES: BeanInfo<SpeciesId>[] = [
  { id: 'arabica', nameKey: 'beans.arabica', descKey: 'beans.arabica.desc', flavorKey: 'beans.arabica.flavor', offset: 0 },
  { id: 'robusta', nameKey: 'beans.robusta', descKey: 'beans.robusta.desc', flavorKey: 'beans.robusta.flavor', offset: -3 },
  { id: 'liberica', nameKey: 'beans.liberica', descKey: 'beans.liberica.desc', flavorKey: 'beans.liberica.flavor', offset: -2 },
]

export const PROCESSES: BeanInfo<ProcessId>[] = [
  { id: 'washed', nameKey: 'beans.washed', descKey: 'beans.washed.desc', flavorKey: 'beans.washed.flavor', offset: 0 },
  { id: 'natural', nameKey: 'beans.natural', descKey: 'beans.natural.desc', flavorKey: 'beans.natural.flavor', offset: -1 },
  { id: 'honey', nameKey: 'beans.honey', descKey: 'beans.honey.desc', flavorKey: 'beans.honey.flavor', offset: -1 },
  { id: 'wetHulled', nameKey: 'beans.wetHulled', descKey: 'beans.wetHulled.desc', flavorKey: 'beans.wetHulled.flavor', offset: -1 },
  { id: 'anaerobic', nameKey: 'beans.anaerobic', descKey: 'beans.anaerobic.desc', flavorKey: 'beans.anaerobic.flavor', offset: -2 },
]

export function findRoast(id: string | null | undefined) {
  return ROASTS.find((r) => r.id === id)
}

/** Suggested range (°C) for a bean at a roast level: centre ±1. */
export function beanTempRange(roast: RoastId, offset: number): [number, number] {
  const centre = (findRoast(roast) ?? ROASTS[1]!).centreC + offset
  return [centre - 1, centre + 1]
}
