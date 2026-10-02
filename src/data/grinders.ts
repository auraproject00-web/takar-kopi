import type { MethodId } from './methods'

export type GrinderId = 'c40' | 'timemore' | 'k6' | 'q2' | 'jx' | 'skerton'

/** [min, max] clicks counted from zero (burrs touching). */
export type ClickRange = readonly [number, number]

export interface Grinder {
  id: GrinderId
  name: string
  /** Fits a three-column tab bar. */
  shortName: string
  /** Set for grinders whose owners usually think in rotations (1Zpresso). */
  clicksPerRotation?: number
  notForEspresso?: boolean
  clicks: Record<MethodId, ClickRange>
}

// Starting estimates; pending validation with grinder owners (TK-07).
export const GRINDERS: Grinder[] = [
  {
    id: 'c40',
    name: 'Comandante C40',
    shortName: 'Comandante',
    clicks: {
      espresso: [7, 12],
      moka: [12, 16],
      aeropress: [14, 20],
      japaneseIced: [18, 24],
      v60: [20, 28],
      kalita: [22, 28],
      chemex: [25, 32],
      frenchPress: [28, 34],
      coldBrew: [30, 35],
    },
  },
  {
    id: 'timemore',
    name: 'Timemore C2 / C3',
    shortName: 'Timemore',
    notForEspresso: true,
    clicks: {
      espresso: [7, 9],
      moka: [9, 12],
      aeropress: [10, 14],
      japaneseIced: [13, 17],
      v60: [14, 19],
      kalita: [15, 19],
      chemex: [18, 21],
      frenchPress: [20, 24],
      coldBrew: [22, 26],
    },
  },
  {
    id: 'k6',
    name: 'Kingrinder K6',
    shortName: 'Kingrinder',
    clicks: {
      espresso: [30, 60],
      moka: [60, 80],
      aeropress: [70, 100],
      japaneseIced: [85, 110],
      v60: [90, 120],
      kalita: [95, 120],
      chemex: [110, 130],
      frenchPress: [120, 150],
      coldBrew: [140, 160],
    },
  },
  {
    id: 'q2',
    name: '1Zpresso Q2',
    shortName: '1Zpresso Q2',
    clicksPerRotation: 30,
    clicks: {
      espresso: [18, 30],
      moka: [30, 45],
      aeropress: [36, 54],
      japaneseIced: [45, 60],
      v60: [50, 66],
      kalita: [54, 70],
      chemex: [60, 78],
      frenchPress: [72, 90],
      coldBrew: [78, 96],
    },
  },
  {
    id: 'jx',
    name: '1Zpresso JX-Pro',
    shortName: '1Zpresso JX',
    clicksPerRotation: 40,
    clicks: {
      espresso: [30, 60],
      moka: [55, 75],
      aeropress: [60, 90],
      japaneseIced: [75, 95],
      v60: [80, 105],
      kalita: [85, 110],
      chemex: [95, 120],
      frenchPress: [110, 140],
      coldBrew: [120, 150],
    },
  },
  {
    id: 'skerton',
    name: 'Hario Skerton Pro',
    shortName: 'Hario Skerton',
    notForEspresso: true,
    clicks: {
      espresso: [2, 4],
      moka: [4, 6],
      aeropress: [5, 7],
      japaneseIced: [6, 8],
      v60: [7, 10],
      kalita: [8, 10],
      chemex: [9, 11],
      frenchPress: [11, 14],
      coldBrew: [12, 15],
    },
  },
]

export function findGrinder(id: string | undefined): Grinder | undefined {
  return GRINDERS.find((g) => g.id === id)
}

/**
 * 1Zpresso notation "rotation.number.click": the dial has numbers 0–9, so each
 * number spans clicksPerRotation / 10 clicks. 96 clicks at 40/rotation → "2.4.0".
 */
export function toRotationNotation(clicks: number, clicksPerRotation: number): string {
  const clicksPerNumber = clicksPerRotation / 10
  const rotations = Math.floor(clicks / clicksPerRotation)
  const rest = clicks % clicksPerRotation
  return `${rotations}.${Math.floor(rest / clicksPerNumber)}.${rest % clicksPerNumber}`
}
