import { useSearchParams } from 'react-router-dom'
import { GRIND_LEVELS, grindInfo } from '../data/grind'
import { findGrinder, GRINDERS, type GrinderId } from '../data/grinders'
import { findMethod, METHODS } from '../data/methods'
import { useI18n } from '../i18n/useI18n'
import { usePersistentState } from '../lib/usePersistentState'
import { BackHeader, Card, Screen } from '../components/layout'
import { Segmented } from '../components/Segmented'

/** Grind sizes are listed from finest to coarsest. */
const fineness = (level: string) => GRIND_LEVELS.findIndex((g) => g.id === level)
const BY_FINENESS = [...METHODS].sort((a, b) => fineness(a.grind) - fineness(b.grind))

export default function GrindGuide() {
  const { t } = useI18n()
  const [params] = useSearchParams()
  const fromMethod = findMethod(params.get('metode') ?? undefined)
  const [savedChoice, setGrinderId] = usePersistentState<string>('cb.grinder', 'c40')
  // "custom" (or an unknown id) has no table, so show the first grinder instead.
  const grinder = findGrinder(savedChoice) ?? GRINDERS[0]!

  return (
    <Screen>
      <BackHeader to={fromMethod ? `/seduh/${fromMethod.id}` : '/'} title={t('grind.guide')} />
      <div className="flex flex-col gap-3.5 px-5">
        <Segmented<GrinderId>
          label={t('grind.pickGrinder')}
          value={grinder.id}
          onChange={setGrinderId}
          columns={3}
          options={GRINDERS.map((g) => ({ value: g.id, label: g.shortName }))}
        />
        <p className="m-0 font-semibold">{grinder.name}</p>
        <Card>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="text-left text-xs tracking-wide text-muted uppercase">
                <th className="border-b border-line px-3.5 py-2.5 font-semibold">{t('grind.table.method')}</th>
                <th className="border-b border-line py-2.5 font-semibold">{t('grind.table.grind')}</th>
                <th className="border-b border-line px-3.5 py-2.5 text-right font-semibold">{t('grind.table.clicks')}</th>
              </tr>
            </thead>
            <tbody>
              {BY_FINENESS.map((m) => {
                const [min, max] = grinder.clicks[m.id]
                const current = m.id === fromMethod?.id
                return (
                  <tr key={m.id} className={current ? 'bg-accent-soft/30' : undefined} aria-current={current ? 'true' : undefined}>
                    <th scope="row" className="border-b border-line-soft px-3.5 py-3 text-left font-semibold">
                      {t(m.nameKey)}
                    </th>
                    <td className="border-b border-line-soft py-3 text-muted">{t(grindInfo(m.grind).nameKey)}</td>
                    <td className="border-b border-line-soft px-3.5 py-3 text-right font-mono">
                      {min}–{max}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
        <p className="m-0 text-xs leading-relaxed text-muted">
          {grinder.clicksPerRotation && `${t('grind.rotations', { n: grinder.clicksPerRotation })}. `}
          {grinder.notForEspresso && `${t('grind.notForEspresso')}. `}
          {t('grind.fromZero')} {t('grind.validationNote')}
        </p>
      </div>
    </Screen>
  )
}
