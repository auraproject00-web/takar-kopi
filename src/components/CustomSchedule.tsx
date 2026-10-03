import { useState } from 'react'
import type { MethodId } from '../data/methods'
import { useI18n } from '../i18n/useI18n'
import { formatClock, formatNumber, roundTo, type BrewStep, type StepType } from '../lib/brew'
import { MAX_STEPS, orderSteps, parseClock, STEP_TYPES, takesWater } from '../lib/custom'
import { stepLabel } from '../lib/stepLabel'
import type { UnitFormat } from '../lib/units'
import { Card } from './layout'

interface Row {
  key: number
  type: StepType
  time: string
  target: string
}

let nextKey = 0
const toRow = (s: BrewStep, u: UnitFormat): Row => ({
  key: nextKey++,
  type: s.type,
  time: formatClock(s.atSec),
  target: s.targetG !== undefined ? formatNumber(u.weight(s.targetG), 2) : '',
})

function toSteps(rows: Row[], u: UnitFormat): BrewStep[] {
  const steps: BrewStep[] = []
  for (const r of rows) {
    const atSec = parseClock(r.time)
    if (atSec === null) continue
    const target = Number.parseFloat(r.target.replace(',', '.'))
    const step: BrewStep = { type: r.type, atSec }
    if (takesWater(r.type) && target > 0) step.targetG = roundTo(u.toGrams(target), 1)
    steps.push(step)
  }
  return orderSteps(steps)
}

/**
 * Editable step list for Eksperimen: time, what to do, and the scale target.
 * Mount it with a new `key` to load different steps from outside.
 */
export function CustomSchedule({
  steps,
  water,
  methodId,
  units: u,
  onChange,
}: {
  steps: BrewStep[]
  /** What should be on the scale at the end, in grams. */
  water: number
  methodId: MethodId
  units: UnitFormat
  onChange: (steps: BrewStep[]) => void
}) {
  const { t } = useI18n()
  const [rows, setRows] = useState<Row[]>(() => steps.map((s) => toRow(s, u)))

  function update(next: Row[]) {
    setRows(next)
    onChange(toSteps(next, u))
  }
  const patch = (key: number, change: Partial<Row>) => update(rows.map((r) => (r.key === key ? { ...r, ...change } : r)))

  function add() {
    const parsed = toSteps(rows, u)
    const lastSec = parsed.at(-1)?.atSec ?? -30
    update([...rows, toRow({ type: 'pour', atSec: lastSec + 30, targetG: Math.round(water) }, u)])
  }

  const typeName = (type: StepType) =>
    type === 'pour'
      ? t('calc.stepType.pour')
      : type === 'drawdown'
        ? t('calc.stepType.drawdown')
        : stepLabel(t, { type, atSec: 0 }, methodId)
  const poured = Math.max(0, ...steps.map((s) => s.targetG ?? 0))

  return (
    <div className="flex flex-col gap-2">
      <Card>
        <div className="grid grid-cols-[64px_minmax(0,1fr)_68px_40px] gap-1.5 border-b border-line px-2.5 py-2 text-xs font-semibold tracking-wide text-muted uppercase">
          <span>{t('calc.step.timeCol')}</span>
          <span>{t('calc.step.typeCol')}</span>
          <span className="text-right">{u.weightLabel}</span>
          <span />
        </div>
        <ol className="m-0 list-none p-0">
          {rows.map((r, i) => {
            const n = i + 1
            const badTime = parseClock(r.time) === null
            return (
              <li key={r.key} className="grid grid-cols-[64px_minmax(0,1fr)_68px_40px] items-center gap-1.5 border-b border-line-soft px-2.5 py-2 last:border-b-0">
                <input
                  type="text"
                  inputMode="numeric"
                  aria-label={t('calc.step.time', { n })}
                  aria-invalid={badTime || undefined}
                  value={r.time}
                  onChange={(e) => patch(r.key, { time: e.target.value.replace(/[^\d:.]/g, '') })}
                  className={`h-10 w-full rounded-lg border bg-surface px-2 font-mono text-sm text-ink ${badTime ? 'border-accent' : 'border-field'}`}
                />
                <select
                  aria-label={t('calc.step.type', { n })}
                  value={r.type}
                  onChange={(e) => patch(r.key, { type: e.target.value as StepType })}
                  className="h-10 w-full min-w-0 rounded-lg border border-field bg-surface px-1.5 text-sm text-ink"
                >
                  {STEP_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {typeName(type)}
                    </option>
                  ))}
                </select>
                {takesWater(r.type) ? (
                  <input
                    type="text"
                    inputMode="decimal"
                    aria-label={t('calc.step.target', { n, unit: u.weightLabel })}
                    value={r.target}
                    onChange={(e) => patch(r.key, { target: e.target.value.replace(/[^\d.,]/g, '') })}
                    className="h-10 w-full rounded-lg border border-field bg-surface px-2 text-right font-mono text-sm text-ink"
                  />
                ) : (
                  <span />
                )}
                <button
                  type="button"
                  aria-label={t('calc.step.remove', { n })}
                  onClick={() => update(rows.filter((x) => x.key !== r.key))}
                  className="flex size-10 items-center justify-center rounded-full text-xl text-muted"
                >
                  ×
                </button>
              </li>
            )
          })}
        </ol>
        {rows.length === 0 && <p className="m-0 px-3.5 py-3 text-sm text-muted">{t('calc.step.none')}</p>}
      </Card>
      <p className="m-0 text-xs leading-relaxed text-muted">{t('calc.step.hint')}</p>
      {poured > 0 && Math.round(poured) !== Math.round(water) && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-track px-3.5 py-2">
          <span className="text-sm">{t('calc.step.total', { poured: u.fmtWeight(poured), water: u.fmtWeight(water) })}</span>
          <button
            type="button"
            onClick={() => {
              const scale = water / poured
              const scaled = steps.map((s) => (s.targetG !== undefined ? { ...s, targetG: Math.round(s.targetG * scale) } : s))
              setRows(scaled.map((s) => toRow(s, u)))
              onChange(scaled)
            }}
            className="min-h-11 shrink-0 text-sm font-semibold text-accent"
          >
            {t('calc.step.fit')}
          </button>
        </div>
      )}
      {rows.length < MAX_STEPS && (
        <button
          type="button"
          onClick={add}
          className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-dashed border-field text-sm font-semibold text-accent"
        >
          <span aria-hidden="true">+</span> {t('calc.step.add')}
        </button>
      )}
    </div>
  )
}
