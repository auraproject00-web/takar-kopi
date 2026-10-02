import type { BrewMethod } from '../data/methods'
import type { PourStyle } from './brew'

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
