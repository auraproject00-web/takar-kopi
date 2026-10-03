import { beanTempRange, PROCESSES, ROASTS, SPECIES, type BeanInfo, type RoastId } from '../data/beans'
import { useI18n } from '../i18n/useI18n'
import { useUnitFormat } from '../lib/units'
import { usePersistentState } from '../lib/usePersistentState'
import { Card, Screen, SectionLabel } from '../components/layout'
import { Segmented } from '../components/Segmented'

function BeanCard({ bean, temp }: { bean: BeanInfo<string>; temp: string }) {
  const { t } = useI18n()
  return (
    <Card className="flex flex-col gap-2 p-3.5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="m-0 text-base font-bold">{t(bean.nameKey)}</h3>
        <p className="m-0 flex shrink-0 flex-col items-end">
          <span className="text-[11px] font-semibold tracking-wide text-muted uppercase">{t('beans.temp')}</span>
          <span className="font-mono text-[15px] font-semibold text-accent">{temp}</span>
        </p>
      </div>
      <p className="m-0 text-sm leading-relaxed text-muted">{t(bean.descKey)}</p>
      <p className="m-0 text-sm">
        <span className="font-semibold">{t('beans.flavor')}:</span> {t(bean.flavorKey)}
      </p>
    </Card>
  )
}

export default function BeanGuide() {
  const { t } = useI18n()
  const u = useUnitFormat()
  const [savedRoast, setRoast] = usePersistentState<RoastId>('cb.roast', 'medium')
  const roast = ROASTS.find((r) => r.id === savedRoast) ?? ROASTS[1]!
  const range = (offset: number) => {
    const [min, max] = beanTempRange(roast.id, offset)
    return `${u.fmtTemp(min)}–${u.fmtTemp(max)}`
  }

  return (
    <Screen nav>
      <header className="flex flex-col gap-1.5 px-5 pt-7 pb-2">
        <h1 className="m-0 font-display text-[28px] font-bold">{t('beans.title')}</h1>
        <p className="m-0 text-sm leading-relaxed text-muted">{t('beans.intro')}</p>
      </header>
      <div className="flex flex-col gap-5 px-5 pt-2">
        <section className="flex flex-col gap-2">
          <SectionLabel>{t('beans.roast.label')}</SectionLabel>
          <Segmented<RoastId>
            label={t('beans.roast.label')}
            value={roast.id}
            onChange={setRoast}
            options={ROASTS.map((r) => ({ value: r.id, label: t(r.nameKey) }))}
          />
          <p className="m-0 text-sm text-muted">{t(roast.hintKey)}</p>
        </section>

        <section className="flex flex-col gap-2">
          <SectionLabel>{t('beans.species')}</SectionLabel>
          {SPECIES.map((b) => (
            <BeanCard key={b.id} bean={b} temp={range(b.offset)} />
          ))}
        </section>

        <section className="flex flex-col gap-2">
          <SectionLabel>{t('beans.process')}</SectionLabel>
          <p className="m-0 text-sm text-muted">{t('beans.processNote')}</p>
          {PROCESSES.map((b) => (
            <BeanCard key={b.id} bean={b} temp={range(b.offset)} />
          ))}
        </section>

        <p className="m-0 pb-2 text-xs leading-relaxed text-muted">
          {t('beans.note', { esp: `${u.fmtTemp(90)}–${u.fmtTemp(94)}` })}
        </p>
      </div>
    </Screen>
  )
}
