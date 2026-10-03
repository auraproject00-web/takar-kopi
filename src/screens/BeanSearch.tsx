import { Link, useSearchParams } from 'react-router-dom'
import { PROCESSES, SPECIES } from '../data/beans'
import { flavorName, ORIGINS, searchOrigins, type Origin } from '../data/origins'
import { useI18n } from '../i18n/useI18n'
import { BackHeader, Card, Screen, SectionLabel } from '../components/layout'

function OriginRow({ origin, query }: { origin: Origin; query: string }) {
  const { t, lang } = useI18n()
  const species = SPECIES.find((s) => s.id === origin.species)!
  const main = origin.common[0]!
  const process = PROCESSES.find((p) => p.id === main)!
  return (
    <li>
      <Link
        to={`/cari-biji/${origin.id}${query ? `?q=${encodeURIComponent(query)}` : ''}`}
        className="flex flex-col gap-1 rounded-[14px] border border-line bg-surface px-3.5 py-3 text-ink no-underline hover:border-accent"
      >
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-[15px] font-semibold">{origin.name}</span>
          <span className="shrink-0 text-xs text-muted">{t(species.nameKey)}</span>
        </span>
        <span className="text-[13px] text-muted">
          {origin.country[lang]} · {origin.region}
        </span>
        <span className="text-[13px]">
          <span className="font-semibold">{t(process.shortKey ?? process.nameKey)}:</span>{' '}
          {origin.notes[main].map((f) => flavorName(f, lang)).join(', ')}
        </span>
      </Link>
    </li>
  )
}

export default function BeanSearch() {
  const { t } = useI18n()
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const results = searchOrigins(query)
  const groups = [
    { label: t('search.indonesia'), list: ORIGINS.filter((o) => o.country.en === 'Indonesia') },
    { label: t('search.world'), list: ORIGINS.filter((o) => o.country.en !== 'Indonesia') },
  ]

  return (
    <Screen>
      <BackHeader to="/" title={t('search.title')} />
      <div className="flex flex-col gap-4 px-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="bean-search" className="text-[13px] font-semibold text-muted">
            {t('search.label')}
          </label>
          <input
            id="bean-search"
            type="search"
            autoComplete="off"
            enterKeyHint="search"
            placeholder={t('search.placeholder')}
            value={query}
            onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
            className="h-12 rounded-xl border border-field bg-surface px-3.5 text-base text-ink placeholder:text-muted"
          />
          <span className="text-xs text-muted">{t('search.hint')}</span>
        </div>

        {query.trim() ? (
          <section className="flex flex-col gap-2" aria-live="polite">
            {results.length > 0 ? (
              <>
                <SectionLabel>{t('search.results', { n: results.length })}</SectionLabel>
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {results.map((o) => (
                    <OriginRow key={o.id} origin={o} query={query} />
                  ))}
                </ul>
              </>
            ) : (
              <Card className="p-3.5 text-sm text-muted">{t('search.none', { q: query.trim() })}</Card>
            )}
          </section>
        ) : (
          groups.map((g) => (
            <section key={g.label} className="flex flex-col gap-2">
              <SectionLabel>{g.label}</SectionLabel>
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {g.list.map((o) => (
                  <OriginRow key={o.id} origin={o} query="" />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </Screen>
  )
}
