import { useState } from 'react'
import { Link } from 'react-router-dom'
import { brewTempC, PROCESSES, ROASTS, SPECIES, type BeanChoice, type ProcessId, type RoastId, type SpeciesId } from '../data/beans'
import type { BrewMethod } from '../data/methods'
import { useI18n } from '../i18n/useI18n'
import { useUnitFormat } from '../lib/units'
import { beanSummary, useBean } from '../lib/bean'
import { BeanIcon } from './icons'
import { Card } from './layout'
import { Segmented } from './Segmented'

/**
 * "Pick your beans first": open until the user has chosen once, then a
 * one-line summary with a Change button. Each change applies right away.
 */
export function BeanPicker({ method }: { method: BrewMethod }) {
  const { t } = useI18n()
  const u = useUnitFormat()
  const { bean, chosen, setBean } = useBean()
  const [draft, setDraft] = useState<BeanChoice>(bean)
  const [editing, setEditing] = useState(false)
  const open = !chosen || editing
  const current = chosen ? bean : draft
  const update = (next: BeanChoice) => (chosen ? setBean(next) : setDraft(next))

  const summary = beanSummary(current, t)
  const tempC = brewTempC(method, current)

  if (!open) {
    return (
      <Card className="flex items-center gap-3 py-1.5 pr-1.5 pl-3.5">
        <span className="text-accent">
          <BeanIcon />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-xs text-muted">{t('calc.bean.title')}</span>
          <span className="text-sm font-semibold">{summary}</span>
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={`${t('calc.bean.change')} ${t('calc.bean.title')}`}
          className="min-h-11 shrink-0 rounded-[10px] px-3 text-sm font-semibold text-accent"
        >
          {t('calc.bean.change')}
        </button>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col gap-3 p-3.5">
      <div className="flex flex-col gap-0.5">
        <h2 className="m-0 text-base font-bold">{t('calc.bean.title')}</h2>
        {!chosen && <p className="m-0 text-sm text-muted">{t('calc.bean.prompt')}</p>}
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-muted">{t('beans.species')}</span>
        <Segmented<SpeciesId>
          label={t('beans.species')}
          value={current.species}
          onChange={(v) => update({ ...current, species: v })}
          options={SPECIES.map((s) => ({ value: s.id, label: t(s.nameKey) }))}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-muted">{t('beans.process')}</span>
        <Segmented<ProcessId>
          label={t('beans.process')}
          value={current.process}
          onChange={(v) => update({ ...current, process: v })}
          columns={3}
          options={PROCESSES.map((p) => ({ value: p.id, label: t(p.shortKey ?? p.nameKey) }))}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-muted">{t('beans.roast.label')}</span>
        <Segmented<RoastId>
          label={t('beans.roast.label')}
          value={current.roast}
          onChange={(v) => update({ ...current, roast: v })}
          options={ROASTS.map((r) => ({ value: r.id, label: t(r.nameKey) }))}
        />
      </div>
      {tempC !== null && (
        <p className="m-0 text-sm" aria-live="polite">
          {t('beans.temp')}: <span className="font-mono font-semibold text-accent">{u.fmtTemp(tempC)}</span>
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <Link to="/beans" className="text-sm font-semibold text-accent">
          {t('calc.bean.guide')}
        </Link>
        <button
          type="button"
          onClick={() => {
            if (!chosen) setBean(draft)
            setEditing(false)
          }}
          className="min-h-11 shrink-0 rounded-[10px] bg-accent px-4 text-sm font-semibold whitespace-nowrap text-on-accent"
        >
          {chosen ? t('calc.bean.done') : t('calc.bean.use')}
        </button>
      </div>
    </Card>
  )
}
