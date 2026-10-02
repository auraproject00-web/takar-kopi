import { findMethod } from '../data/methods'
import type { I18nValue } from '../i18n/I18nProvider'
import { calcAmounts, formatNumber, formatRatio } from './brew'
import { brewQuery } from './brewParams'
import type { Recipe } from './recipes'

type Brewable = Pick<Recipe, 'methodId' | 'coffee' | 'ratio' | 'style'>

/** "15 g · 240 ml · 1:16" (espresso: "18 g → 36 g · 1:2"). */
export function brewSummary(t: I18nValue['t'], r: Brewable): string {
  const method = findMethod(r.methodId)
  if (!method) return ''
  const { water } = calcAmounts(method.kind, 'coffee', r.coffee, r.ratio)
  const g = t('unit.gram')
  const amounts =
    method.kind === 'espresso'
      ? `${formatNumber(r.coffee)} ${g} → ${formatNumber(water)} ${g}`
      : `${formatNumber(r.coffee)} ${g} · ${water} ${t('unit.ml')}`
  const style = r.style === '46' ? ' · 4:6' : ''
  return `${amounts} · ${formatRatio(r.ratio)}${style}`
}

/** Opens the calculator with the recipe's numbers. */
export function brewLink(r: Brewable): string {
  return `/seduh/${r.methodId}${brewQuery({ coffee: r.coffee, ratio: r.ratio, style: r.style })}`
}
