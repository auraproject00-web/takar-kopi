import type { MethodId } from '../data/methods'
import type { I18nValue } from '../i18n/I18nProvider'
import type { BrewStep } from './brew'

export function stepLabel(t: I18nValue['t'], step: BrewStep, methodId: MethodId): string {
  switch (step.type) {
    case 'bloom':
      return t('timer.bloom')
    case 'pour':
      return t('timer.pour', { n: step.n ?? 1 })
    case 'pourAll':
      return t('timer.pourAll')
    case 'stir':
      return t('timer.stir')
    case 'steep':
      return t('timer.steep')
    case 'press':
      return methodId === 'frenchPress' ? t('timer.plunge') : t('timer.press')
    case 'drawdown':
      return t('timer.drawdown')
  }
}
