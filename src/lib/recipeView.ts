import { findMethod } from '../data/methods'
import { beanParam } from './bean'
import { calcAmounts, formatRatio } from './brew'
import { brewQuery } from './brewParams'
import { customQuery } from './custom'
import type { Recipe } from './recipes'
import type { UnitFormat } from './units'

type Brewable = Pick<Recipe, 'methodId' | 'coffee' | 'ratio' | 'style' | 'beanChoice' | 'custom'>

/** "15 g · 240 ml · 1:16" (espresso: "18 g → 36 g · 1:2"), in the user's units. */
export function brewSummary(r: Brewable, u: UnitFormat): string {
  const method = findMethod(r.methodId)
  if (!method) return ''
  const { water } = calcAmounts(method.kind, 'coffee', r.coffee, r.ratio)
  const amounts =
    method.kind === 'espresso'
      ? `${u.fmtWeight(r.coffee)} → ${u.fmtWeight(water)}`
      : `${u.fmtWeight(r.coffee)} · ${u.fmtVolume(water)}`
  const style = r.style === '46' ? ' · 4:6' : ''
  return `${amounts} · ${formatRatio(r.ratio)}${style}`
}

/** Opens the calculator with the recipe's numbers (and its beans, if saved). */
export function brewLink(r: Brewable): string {
  const beans = r.beanChoice ? `&beans=${beanParam(r.beanChoice)}` : ''
  const own = customQuery(r.custom)
  return `/seduh/${r.methodId}${brewQuery({ coffee: r.coffee, ratio: r.ratio, style: r.style })}${beans}${own ? `&${own}` : ''}`
}
