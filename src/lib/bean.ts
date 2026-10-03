import { cleanBean, DEFAULT_BEAN, PROCESSES, ROASTS, SPECIES, type BeanChoice } from '../data/beans'
import type { MessageKey } from '../i18n/I18nProvider'
import { usePersistentState } from './usePersistentState'

export const BEAN_KEY = 'cb.bean'

/**
 * The beans picked before brewing, shared by the calculator, timer, recipe
 * form and Beans tab. `chosen` is false until the user has picked once.
 */
export function useBean(): { bean: BeanChoice; chosen: boolean; setBean: (bean: BeanChoice) => void } {
  const [raw, setBean] = usePersistentState<unknown>(BEAN_KEY, null)
  const clean = cleanBean(raw)
  return { bean: clean ?? DEFAULT_BEAN, chosen: clean !== null, setBean }
}

/** "Arabika · Washed · Medium" */
export function beanSummary(bean: BeanChoice, t: (key: MessageKey) => string): string {
  const species = SPECIES.find((s) => s.id === bean.species)!
  const process = PROCESSES.find((p) => p.id === bean.process)!
  const roast = ROASTS.find((r) => r.id === bean.roast)!
  return [t(species.nameKey), t(process.shortKey ?? process.nameKey), t(roast.nameKey)].join(' · ')
}

/** URL form of a bean choice: "arabica-washed-medium". */
export function beanParam(bean: BeanChoice): string {
  return `${bean.species}-${bean.process}-${bean.roast}`
}

export function readBeanParam(value: string | null): BeanChoice | null {
  const [species, process, roast] = (value ?? '').split('-')
  const bean = cleanBean({ species, process, roast })
  // Only accept a fully valid value, not one patched up with defaults.
  return bean && bean.species === species && bean.process === process && bean.roast === roast ? bean : null
}
