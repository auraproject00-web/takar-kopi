import type { BrewKind, BrewMethod, BrewTime, MethodId } from '../data/methods'

/** Share of a Japanese iced brew's total water that goes in as ice. */
export const ICE_SHARE = 0.4

export type InputMode = 'coffee' | 'water'

export interface Amounts {
  /** Grams of ground coffee (espresso: the dose). */
  coffee: number
  /** Total water in ml (espresso: the yield in grams). */
  water: number
  /** Japanese iced only: hot water poured through the bed, in ml. */
  hotWater?: number
  /** Japanese iced only: grams of ice in the server. */
  ice?: number
}

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

function clean(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0
}

/**
 * Two-way calculator. `value` is grams of coffee when mode is "coffee", or the
 * total water / espresso yield when mode is "water".
 */
export function calcAmounts(kind: BrewKind, mode: InputMode, value: number, ratio: number): Amounts {
  const safeRatio = clean(ratio)
  const input = clean(value)
  if (safeRatio === 0) return { coffee: 0, water: 0 }

  // Espresso yields are small, so they keep one decimal like the coffee dose.
  const waterDecimals = kind === 'espresso' ? 1 : 0
  const coffee = mode === 'coffee' ? roundTo(input, 1) : roundTo(input / safeRatio, 1)
  const water = mode === 'water' ? roundTo(input, waterDecimals) : roundTo(coffee * safeRatio, waterDecimals)

  if (kind === 'iced') {
    const ice = Math.round(water * ICE_SHARE)
    return { coffee, water, hotWater: water - ice, ice }
  }
  return { coffee, water }
}

export type StepType = 'bloom' | 'pour' | 'pourAll' | 'stir' | 'steep' | 'press' | 'drawdown'

export interface BrewStep {
  type: StepType
  /** Seconds from the start of the brew. */
  atSec: number
  /** Cumulative grams on the scale at the end of this step. */
  targetG?: number
  /** Pour number, for "Pour 2". */
  n?: number
}

const POUROVER_TIMING: Partial<Record<MethodId, { pours: number[]; drawdown: number }>> = {
  v60: { pours: [45, 75, 105], drawdown: 135 },
  kalita: { pours: [45, 75, 105], drawdown: 135 },
  chemex: { pours: [45, 90, 135], drawdown: 180 },
  japaneseIced: { pours: [45, 75], drawdown: 105 },
}

/**
 * Pour schedule with cumulative scale targets. `water` is what goes through the
 * coffee bed — for Japanese iced, the hot water only.
 */
export function brewSchedule(method: BrewMethod, coffee: number, water: number): BrewStep[] {
  const c = clean(coffee)
  const w = Math.round(clean(water))
  if (c === 0 || w === 0) return []

  switch (method.kind) {
    case 'pourover':
    case 'iced': {
      const timing = POUROVER_TIMING[method.id]
      if (!timing) return []
      // Bloom with 2–3× the coffee weight; iced brews have less hot water to spare.
      const bloomFactor = method.kind === 'iced' ? 2 : 3
      const bloom = Math.min(Math.round(c * bloomFactor), w)
      const perPour = (w - bloom) / timing.pours.length
      const steps: BrewStep[] = [{ type: 'bloom', atSec: 0, targetG: bloom }]
      timing.pours.forEach((atSec, i) => {
        const isLast = i === timing.pours.length - 1
        steps.push({
          type: 'pour',
          atSec,
          n: i + 1,
          targetG: isLast ? w : Math.round(bloom + perPour * (i + 1)),
        })
      })
      steps.push({ type: 'drawdown', atSec: timing.drawdown })
      return steps
    }
    case 'immersion': {
      if (method.id === 'aeropress') {
        return [
          { type: 'pourAll', atSec: 0, targetG: w },
          { type: 'stir', atSec: 10 },
          { type: 'steep', atSec: 20 },
          { type: 'press', atSec: 90 },
        ]
      }
      return [
        { type: 'pourAll', atSec: 0, targetG: w },
        { type: 'stir', atSec: 30 },
        { type: 'steep', atSec: 40 },
        { type: 'press', atSec: 240 },
      ]
    }
    default:
      // Espresso, moka and cold brew have no pour schedule; the screen shows a tip.
      return []
  }
}

export function formatClock(totalSec: number): string {
  const sec = Math.max(0, Math.round(totalSec))
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}

/** Number with up to `decimals` places, without trailing zeros: 16 → "16", 16.5 → "16.5". */
export function formatNumber(value: number, decimals = 1): string {
  return String(roundTo(value, decimals))
}

export function formatRatio(ratio: number): string {
  return `1:${formatNumber(ratio)}`
}

/** "3:00", or "25–30" plus the unit label the caller passes in. */
export function formatTime(time: BrewTime, unitLabel: string): string {
  if (time.unit === 'clock') return formatClock(time.min)
  const range = time.max !== undefined ? `${time.min}–${time.max}` : String(time.min)
  return `${range} ${unitLabel}`
}
