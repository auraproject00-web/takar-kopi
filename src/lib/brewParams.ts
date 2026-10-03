import type { BrewMethod } from '../data/methods'
import type { PourStyle } from './brew'
import { cleanChoice, type GuidedChoice, type Strength } from '../data/portions'

/** What the calculator hands to the timer (and back), carried in the URL. */
export interface BrewParams {
  coffee: number
  ratio: number
  style: PourStyle
}

export function readBrewParams(method: BrewMethod, search: URLSearchParams): BrewParams {
  const coffee = Number.parseFloat(search.get('kopi') ?? '')
  const ratio = Number.parseFloat(search.get('rasio') ?? '')
  return {
    coffee: Number.isFinite(coffee) && coffee > 0 ? coffee : method.defaultCoffee,
    ratio:
      Number.isFinite(ratio) && ratio >= method.ratio.min && ratio <= method.ratio.max ? ratio : method.ratio.default,
    style: search.get('gaya') === '46' ? '46' : 'standard',
  }
}

export function brewQuery(params: BrewParams): string {
  const q = new URLSearchParams({ kopi: String(params.coffee), rasio: String(params.ratio) })
  if (params.style !== 'standard') q.set('gaya', params.style)
  return `?${q.toString()}`
}

/** Guided-mode choice from the URL, or null when the page was opened with custom numbers or none. */
export function readGuidedChoice(method: BrewMethod, search: URLSearchParams): GuidedChoice | null {
  if (!search.has('ukuran')) return null
  return cleanChoice(method, {
    sizeId: search.get('ukuran') ?? undefined,
    count: Number(search.get('gelas') ?? 1),
    strength: (search.get('kekuatan') ?? 'normal') as Strength,
  })
}

export function guidedQuery(choice: GuidedChoice): string {
  return new URLSearchParams({ ukuran: choice.sizeId, gelas: String(choice.count), kekuatan: choice.strength }).toString()
}
