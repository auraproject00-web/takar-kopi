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
  /** Short label for pickers; defaults to the full name. */
  shortKey?: MessageKey
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
  { id: 'washed', nameKey: 'beans.washed', descKey: 'beans.washed.desc', flavorKey: 'beans.washed.flavor', shortKey: 'beans.short.washed', offset: 0 },
  { id: 'natural', nameKey: 'beans.natural', descKey: 'beans.natural.desc', flavorKey: 'beans.natural.flavor', shortKey: 'beans.short.natural', offset: -1 },
  { id: 'honey', nameKey: 'beans.honey', descKey: 'beans.honey.desc', flavorKey: 'beans.honey.flavor', shortKey: 'beans.short.honey', offset: -1 },
  { id: 'wetHulled', nameKey: 'beans.wetHulled', descKey: 'beans.wetHulled.desc', flavorKey: 'beans.wetHulled.flavor', shortKey: 'beans.short.wetHulled', offset: -1 },
  { id: 'anaerobic', nameKey: 'beans.anaerobic', descKey: 'beans.anaerobic.desc', flavorKey: 'beans.anaerobic.flavor', shortKey: 'beans.short.anaerobic', offset: -2 },
]

export function findRoast(id: string | null | undefined) {
  return ROASTS.find((r) => r.id === id)
}

/** Suggested range (°C) for a bean at a roast level: centre ±1. */
export function beanTempRange(roast: RoastId, offset: number): [number, number] {
  const centre = (findRoast(roast) ?? ROASTS[1]!).centreC + offset
  return [centre - 1, centre + 1]
}

/** The beans picked before brewing; drives the suggested water temperature. */
export interface BeanChoice {
  species: SpeciesId
  process: ProcessId
  roast: RoastId
}

export const DEFAULT_BEAN: BeanChoice = { species: 'arabica', process: 'washed', roast: 'medium' }

/** Keeps a stored choice valid even if ids change or storage was edited. */
export function cleanBean(raw: unknown): BeanChoice | null {
  if (!raw || typeof raw !== 'object') return null
  const b = raw as Record<string, unknown>
  const pick = <T extends string>(list: { id: T }[], v: unknown, fallback: T) => list.find((x) => x.id === v)?.id ?? fallback
  return {
    species: pick(SPECIES, b.species, DEFAULT_BEAN.species),
    process: pick(PROCESSES, b.process, DEFAULT_BEAN.process),
    roast: pick(ROASTS, b.roast, DEFAULT_BEAN.roast),
  }
}

const MEDIUM_C = ROASTS.find((r) => r.id === 'medium')!.centreC

/**
 * A method's water temperature shifted for the beans: the method's own
 * temperature fits medium-roast washed arabica, and roast, species and
 * process nudge it from there. Methods brewed without hot water stay null.
 */
export function brewTempC(method: { tempC: number | null; kind: string }, bean: BeanChoice): number | null {
  if (method.tempC === null) return null
  const roast = (findRoast(bean.roast) ?? ROASTS[1]!).centreC - MEDIUM_C
  const species = SPECIES.find((s) => s.id === bean.species)?.offset ?? 0
  const process = PROCESSES.find((p) => p.id === bean.process)?.offset ?? 0
  const [lo, hi] = method.kind === 'espresso' ? [88, 95] : [80, 96]
  return Math.min(hi, Math.max(lo, method.tempC + roast + species + process))
}
