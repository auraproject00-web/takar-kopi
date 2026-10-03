import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../lib/recipes'
import { brewLink, brewSummary } from '../lib/recipeView'
import { METHODS, type BrewMethod } from '../data/methods'
import { formatRatio, ICE_SHARE } from '../lib/brew'
import { useI18n } from '../i18n/useI18n'
import { useUnitFormat } from '../lib/units'
import { Screen } from '../components/layout'
import { LangToggle } from '../components/LangToggle'
import { InstallHint } from '../components/InstallHint'

function ratioLabel(method: BrewMethod, iceWord: string): string {
  const { recMin, recMax } = method.ratio
  const range = method.kind === 'espresso' ? formatRatio(method.ratio.default) : `${formatRatio(recMin)}–${recMax}`
  return method.kind === 'iced' ? `${range} · ${ICE_SHARE * 100}% ${iceWord}` : range
}

export default function MethodSelect() {
  const { t } = useI18n()
  const u = useUnitFormat()
  const recent = useLiveQuery(() => db.recipes.orderBy('updatedAt').last())
  return (
    <Screen nav>
      <header className="flex items-center justify-between gap-3 px-5 pt-7 pb-2">
        <span className="font-display text-2xl font-bold tracking-tight">{t('app.name')}</span>
        <LangToggle />
      </header>
      <div className="flex flex-col gap-4 px-5 pt-2">
        <h1 className="m-0 font-display text-2xl leading-tight font-medium">{t('method.select.title')}</h1>
        <ul className="m-0 grid list-none grid-cols-3 gap-2.5 p-0">
          {METHODS.map((m) => (
            <li key={m.id}>
              <Link
                to={`/seduh/${m.id}`}
                className="flex h-[104px] flex-col justify-between rounded-[14px] border border-line bg-surface p-3 text-ink no-underline hover:border-accent"
              >
                <span className="text-sm leading-tight font-semibold">{t(m.nameKey)}</span>
                <span className="font-mono text-xs text-muted">{ratioLabel(m, t('method.ice'))}</span>
              </Link>
            </li>
          ))}
        </ul>
        {recent && (
          <section className="flex flex-col gap-2">
            <h2 className="m-0 text-[13px] font-semibold tracking-wide text-muted uppercase">{t('method.recent')}</h2>
            <Link
              to={brewLink(recent)}
              className="flex items-center justify-between gap-3 rounded-[14px] bg-inverse px-4 py-3.5 text-on-inverse no-underline"
            >
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate text-[15px] font-semibold">{recent.name}</span>
                <span className="font-mono text-xs text-on-inverse-muted">{brewSummary(recent, u)}</span>
              </span>
              <span className="shrink-0 text-sm font-semibold text-on-inverse-accent">{t('method.brewAgain')}</span>
            </Link>
          </section>
        )}
        <InstallHint />
        <Link to="/gilingan" className="flex min-h-11 items-center text-sm font-semibold text-accent">
          {t('grind.guide')}
        </Link>
      </div>
    </Screen>
  )
}
