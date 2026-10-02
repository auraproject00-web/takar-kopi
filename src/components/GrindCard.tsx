import { Link } from 'react-router-dom'
import { GRIND_LEVELS, grindInfo } from '../data/grind'
import { findGrinder, GRINDERS, toRotationNotation, type GrinderId } from '../data/grinders'
import type { BrewMethod } from '../data/methods'
import { useI18n } from '../i18n/useI18n'
import { usePersistentState } from '../lib/usePersistentState'
import { Card } from './layout'

type GrinderChoice = GrinderId | 'custom'

export function GrindCard({ method }: { method: BrewMethod }) {
  const { t } = useI18n()
  const [savedChoice, setGrinderId] = usePersistentState<GrinderChoice>('cb.grinder', 'c40')
  const [customClicks, setCustomClicks] = usePersistentState<Record<string, string>>('cb.customClicks', {})
  const level = grindInfo(method.grind)
  const methodName = t(method.nameKey)
  // A stored id from an older version may no longer exist; fall back to the first grinder.
  const grinder = savedChoice === 'custom' ? undefined : (findGrinder(savedChoice) ?? GRINDERS[0])
  const grinderId: GrinderChoice = grinder?.id ?? 'custom'

  return (
    <Card className="flex flex-col gap-3 p-3.5">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-semibold">{t('grind.title')}</span>
        <span className="text-sm font-semibold text-accent">{t(level.nameKey)}</span>
      </div>

      <ol className="m-0 grid list-none grid-cols-6 gap-1 p-0" aria-label={t('grind.forMethod', { method: methodName })}>
        {GRIND_LEVELS.map((g) => {
          const active = g.id === level.id
          return (
            <li key={g.id} className="flex flex-col gap-1.5" aria-current={active ? 'true' : undefined}>
              <span className={`h-2.5 rounded-full ${active ? 'bg-accent' : 'bg-track'}`} />
              <span className={`text-center text-[11px] leading-tight ${active ? 'font-semibold text-ink' : 'text-muted'}`}>
                {t(g.nameKey)}
              </span>
            </li>
          )
        })}
      </ol>
      <span className="text-[13px] text-muted">
        {t(level.textureKey)} · {t('grind.microns', { range: level.microns })}
      </span>

      <div className="h-px bg-line-soft" />

      <label htmlFor="grinder" className="text-[13px] font-semibold text-muted">
        {t('grind.manualGrinder')}
      </label>
      <select
        id="grinder"
        value={grinderId}
        onChange={(e) => setGrinderId(e.target.value as GrinderChoice)}
        className="h-11 rounded-[10px] border border-field bg-surface px-3 text-[15px] font-medium text-ink"
      >
        {GRINDERS.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
        <option value="custom">{t('grind.otherGrinder')}</option>
      </select>

      {grinder ? (
        <div className="flex flex-col gap-1 rounded-xl bg-ink px-3.5 py-3 text-white">
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-line">{t('grind.setTo')}</span>
            <span className="font-mono text-[22px]" data-testid="clicks">
              {grinder.clicks[method.id][0]}–{grinder.clicks[method.id][1]} {t('unit.clicks')}
            </span>
          </div>
          {grinder.clicksPerRotation && (
            <span className="text-right font-mono text-xs text-line">
              {toRotationNotation(grinder.clicks[method.id][0], grinder.clicksPerRotation)} –{' '}
              {toRotationNotation(grinder.clicks[method.id][1], grinder.clicksPerRotation)} ·{' '}
              {t('grind.rotations', { n: grinder.clicksPerRotation })}
            </span>
          )}
        </div>
      ) : (
        <label className="flex items-center justify-between gap-3 rounded-xl bg-ink py-2 pr-2 pl-3.5 text-white">
          <span className="text-[13px] text-line">{t('grind.yourClicks', { method: methodName })}</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="18"
            value={customClicks[method.id] ?? ''}
            onChange={(e) =>
              setCustomClicks({ ...customClicks, [method.id]: e.target.value.replace(/[^\d]/g, '') })
            }
            className="h-10 w-24 rounded-lg bg-surface px-2.5 text-right font-mono text-lg text-ink"
          />
        </label>
      )}

      {grinder?.notForEspresso && method.kind === 'espresso' && (
        <span className="text-[13px] font-semibold text-accent">{t('grind.notForEspresso')}</span>
      )}
      <span className="text-xs leading-relaxed text-muted">
        {t('grind.fromZero')} {t('grind.estimateNote')}
      </span>
      <Link to={`/gilingan?metode=${method.id}`} className="flex min-h-11 items-center text-sm font-semibold text-accent">
        {t('grind.guideLink')}
      </Link>
    </Card>
  )
}
