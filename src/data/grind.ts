import type { MessageKey } from '../i18n/I18nProvider'

export type GrindLevel = 'extraFine' | 'fine' | 'mediumFine' | 'medium' | 'mediumCoarse' | 'coarse'

export interface GrindInfo {
  id: GrindLevel
  nameKey: MessageKey
  textureKey: MessageKey
  microns: string
}

export const GRIND_LEVELS: GrindInfo[] = [
  { id: 'extraFine', nameKey: 'grind.extraFine', textureKey: 'grind.texture.extraFine', microns: '100–200' },
  { id: 'fine', nameKey: 'grind.fine', textureKey: 'grind.texture.fine', microns: '200–400' },
  { id: 'mediumFine', nameKey: 'grind.mediumFine', textureKey: 'grind.texture.mediumFine', microns: '400–600' },
  { id: 'medium', nameKey: 'grind.medium', textureKey: 'grind.texture.medium', microns: '600–800' },
  { id: 'mediumCoarse', nameKey: 'grind.mediumCoarse', textureKey: 'grind.texture.mediumCoarse', microns: '800–1000' },
  { id: 'coarse', nameKey: 'grind.coarse', textureKey: 'grind.texture.coarse', microns: '1000–1300' },
]

export function grindInfo(level: GrindLevel): GrindInfo {
  const info = GRIND_LEVELS.find((g) => g.id === level)
  if (!info) throw new Error(`Unknown grind level: ${level}`)
  return info
}
