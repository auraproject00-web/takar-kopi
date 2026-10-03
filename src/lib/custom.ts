import { GRIND_LEVELS, type GrindLevel } from '../data/grind'
import type { BrewMethod } from '../data/methods'
import { roundTo, type BrewStep, type StepType } from './brew'

/**
 * Everything the Eksperimen tab lets you set beyond coffee, water and ratio.
 * Missing fields fall back to the method (or, for temperature, the beans).
 */
export interface BrewCustom {
  /** Water temperature in °C. */
  tempC?: number
  grind?: GrindLevel
  /** Total brew time in the method's time unit (clock methods: seconds). */
  time?: number
  /** Own step schedule; replaces the method's pour schedule. */
  steps?: BrewStep[]
}

export const TEMP_LIMITS = { min: 60, max: 100 }
export const MAX_STEPS = 20
/** A day: cold brew is the longest brew. */
const MAX_SEC = 24 * 60 * 60
const MAX_TARGET_G = 5000

export const STEP_TYPES: StepType[] = ['bloom', 'pour', 'pourAll', 'stir', 'steep', 'press', 'drawdown']
const CODES: Record<StepType, string> = {
  bloom: 'b',
  pour: 'p',
  pourAll: 'a',
  stir: 's',
  steep: 'r',
  press: 't',
  drawdown: 'd',
}

/** Steps that ask for water on the scale, so they carry a target. */
export function takesWater(type: StepType): boolean {
  return type === 'bloom' || type === 'pour' || type === 'pourAll'
}

/** "3:30" → 210, "45" → 45; null when it cannot be read. */
export function parseClock(raw: string): number | null {
  const m = raw.trim().match(/^(\d{1,4})(?:[:.](\d{1,2}))?$/)
  if (!m) return null
  if (m[2] === undefined) return Number(m[1])
  const sec = Number(m[2])
  return sec < 60 ? Number(m[1]) * 60 + sec : null
}

/** Sorted by time (stable), with pours numbered in order. */
export function orderSteps(steps: BrewStep[]): BrewStep[] {
  let n = 0
  return [...steps]
    .map((s, i) => ({ s, i }))
    .sort((a, b) => a.s.atSec - b.s.atSec || a.i - b.i)
    .map(({ s }) => {
      const { n: _old, ...rest } = s
      void _old
      return s.type === 'pour' ? { ...rest, n: ++n } : rest
    })
}

function cleanSteps(raw: unknown): BrewStep[] | undefined {
  if (!Array.isArray(raw)) return undefined
  const steps: BrewStep[] = []
  for (const item of raw.slice(0, MAX_STEPS)) {
    if (!item || typeof item !== 'object') continue
    const r = item as Record<string, unknown>
    const type = STEP_TYPES.find((t) => t === r.type)
    const atSec = Math.round(Number(r.atSec))
    if (!type || !Number.isFinite(atSec) || atSec < 0 || atSec > MAX_SEC) continue
    const target = roundTo(Number(r.targetG), 1)
    const step: BrewStep = { type, atSec }
    if (takesWater(type) && target > 0 && target <= MAX_TARGET_G) step.targetG = target
    steps.push(step)
  }
  return steps.length > 0 ? orderSteps(steps) : undefined
}

/** Keeps only valid fields; undefined when nothing is customised. */
export function cleanCustom(raw: unknown): BrewCustom | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const r = raw as Record<string, unknown>
  const out: BrewCustom = {}
  const temp = Math.round(Number(r.tempC))
  if (r.tempC !== undefined && temp >= TEMP_LIMITS.min && temp <= TEMP_LIMITS.max) out.tempC = temp
  const grind = GRIND_LEVELS.find((g) => g.id === r.grind)
  if (grind) out.grind = grind.id
  const time = roundTo(Number(r.time), 1)
  if (time > 0 && time <= MAX_SEC) out.time = time
  const steps = cleanSteps(r.steps)
  if (steps) out.steps = steps
  return Object.keys(out).length > 0 ? out : undefined
}

/** "b0-45_p45-150_d135": type code, seconds, optional target. */
export function encodeSteps(steps: BrewStep[]): string {
  return steps.map((s) => `${CODES[s.type]}${s.atSec}${s.targetG !== undefined ? `-${s.targetG}` : ''}`).join('_')
}

export function decodeSteps(raw: string): BrewStep[] | undefined {
  const parsed = raw.split('_').map((part) => {
    const m = part.match(/^([a-z])(\d+)(?:-(\d+(?:\.\d+)?))?$/)
    if (!m) return null
    const type = STEP_TYPES.find((t) => CODES[t] === m[1])
    return { type, atSec: Number(m[2]), targetG: m[3] !== undefined ? Number(m[3]) : undefined }
  })
  return cleanSteps(parsed)
}

/** URL form, without a leading "&"; empty when nothing is customised. */
export function customQuery(custom: BrewCustom | undefined): string {
  if (!custom) return ''
  const q = new URLSearchParams()
  if (custom.tempC !== undefined) q.set('suhu', String(custom.tempC))
  if (custom.grind) q.set('giling', custom.grind)
  if (custom.time !== undefined) q.set('waktu', String(custom.time))
  if (custom.steps?.length) q.set('langkah', encodeSteps(custom.steps))
  return q.toString()
}

export function readCustom(search: URLSearchParams): BrewCustom | undefined {
  const num = (key: string) => (search.has(key) ? Number(search.get(key)) : undefined)
  return cleanCustom({
    tempC: num('suhu'),
    grind: search.get('giling') ?? undefined,
    time: num('waktu'),
    steps: search.has('langkah') ? decodeSteps(search.get('langkah')!) : undefined,
  })
}

/** Grind level after the user's override. */
export function grindFor(method: BrewMethod, custom?: BrewCustom): GrindLevel {
  return custom?.grind ?? method.grind
}
