import { useParams, useSearchParams } from 'react-router-dom'
import { beanTempRange, PROCESSES, SPECIES, type ProcessId } from '../data/beans'
import { findOrigin, flavorName } from '../data/origins'
import { useI18n } from '../i18n/useI18n'
import { useBean } from '../lib/bean'
import { useUnitFormat } from '../lib/units'
import { BackHeader, Card, Screen, SectionLabel } from '../components/layout'
import NotFound from './NotFound'

export default function OriginDetail() {
  const { t, lang } = useI18n()
  const u = useUnitFormat()
  const { originId } = useParams()
  const [params] = useSearchParams()
  const { bean, chosen, setBean } = useBean()
  const origin = findOrigin(originId)
  if (!origin) return <NotFound titleKey="origin.notFound" />

  const q = params.get('q')
  const species = SPECIES.find((s) => s.id === origin.species)!
  // Most common processes first, then the rest in the usual order.
  const processes = [...PROCESSES].sort(
    (a, b) => rank(origin.common, a.id) - rank(origin.common, b.id),
  )
  const facts: [string, string][] = [
    [t('origin.country'), origin.country[lang]],
    [t('origin.region'), origin.region],
    [t('origin.altitude'), t('origin.altitudeValue', { m: origin.altitude })],
    [t('origin.species'), t(species.nameKey)],
    [t('origin.varieties'), origin.varieties.join(', ')],
    [t('origin.body'), t(`origin.body.${origin.body}`)],
    [t('origin.acidity'), t(`origin.acidity.${origin.acidity}`)],
  ]

  return (
    <Screen>
      <BackHeader to={`/cari-biji${q ? `?q=${encodeURIComponent(q)}` : ''}`} title={origin.name} />
      <div className="flex flex-col gap-4 px-5">
        <p className="m-0 text-[15px] leading-relaxed">{origin.about[lang]}</p>
        <Card>
          <dl className="m-0">
            {facts.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[108px_minmax(0,1fr)] gap-2 border-b border-line-soft px-3.5 py-2.5 text-sm last:border-b-0">
                <dt className="text-muted">{label}</dt>
                <dd className="m-0 font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <section className="flex flex-col gap-2">
          <SectionLabel>{t('origin.byProcess')}</SectionLabel>
          {processes.map((p) => {
            const [min, max] = beanTempRange(bean.roast, species.offset + p.offset)
            const inUse = chosen && bean.species === origin.species && bean.process === p.id
            return (
              <Card key={p.id} className="flex flex-col gap-2 p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="m-0 text-base font-bold">{t(p.nameKey)}</h3>
                  {origin.common.includes(p.id) && (
                    <span className="shrink-0 rounded-full bg-track px-2 py-0.5 text-xs font-semibold">{t('origin.common')}</span>
                  )}
                </div>
                <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label={t('beans.flavor')}>
                  {origin.notes[p.id].map((f) => (
                    <li key={f} className="rounded-full border border-line px-2.5 py-1 text-[13px]">
                      {flavorName(f, lang)}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[13px] text-muted">
                    {t('beans.temp')}: <span className="font-mono font-semibold text-accent">{u.fmtTemp(min)}–{u.fmtTemp(max)}</span>
                  </span>
                  <button
                    type="button"
                    aria-pressed={inUse}
                    aria-label={`${t('origin.use')}: ${t(p.nameKey)}`}
                    onClick={() => setBean({ ...bean, species: origin.species, process: p.id })}
                    className={`min-h-11 shrink-0 rounded-[10px] px-3 text-sm font-semibold ${inUse ? 'bg-inverse text-on-inverse' : 'text-accent'}`}
                  >
                    {inUse ? `✓ ${t('origin.inUse')}` : t('origin.use')}
                  </button>
                </div>
              </Card>
            )
          })}
        </section>
        <p className="m-0 pb-2 text-xs leading-relaxed text-muted">{t('origin.disclaimer')}</p>
      </div>
    </Screen>
  )
}

function rank(common: ProcessId[], id: ProcessId): number {
  const i = common.indexOf(id)
  return i === -1 ? common.length : i
}
