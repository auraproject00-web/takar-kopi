import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { grindInfo } from '../data/grind'
import type { BrewMethod, MethodId, TimeUnit } from '../data/methods'
import type { MessageKey } from '../i18n/I18nProvider'
import { useI18n } from '../i18n/useI18n'
import {
  brewSchedule,
  calcAmounts,
  formatClock,
  formatNumber,
  formatRatio,
  formatTime,
  POUR_STYLE_46,
  supportsPourStyle,
  type BrewStep,
  type InputMode,
  type PourStyle,
} from '../lib/brew'
import { brewQuery, readBrewParams } from '../lib/brewParams'
import { stepLabel } from '../lib/stepLabel'
import { BackHeader, Card, Screen, SectionLabel } from '../components/layout'
import { Segmented } from '../components/Segmented'
import { GrindCard } from '../components/GrindCard'

const UNIT_KEYS: Record<Exclude<TimeUnit, 'clock'>, MessageKey> = {
  seconds: 'unit.seconds',
  minutes: 'unit.minutes',
  hours: 'unit.hours',
}

function parseInput(raw: string): number {
  return Number.parseFloat(raw.replace(',', '.'))
}

export default function Calculator({ method }: { method: BrewMethod }) {
  const { t } = useI18n()
  const [search] = useSearchParams()
  // Coming back from the timer restores the numbers that were brewed.
  const [initial] = useState(() => readBrewParams(method, search))
  const isEspresso = method.kind === 'espresso'
  const [mode, setMode] = useState<InputMode>('coffee')
  const [raw, setRaw] = useState(formatNumber(initial.coffee))
  const [ratio, setRatio] = useState(initial.ratio)
  const [style, setStyle] = useState<PourStyle>(initial.style)

  const amounts = calcAmounts(method.kind, mode, parseInput(raw), ratio)
  const steps = brewSchedule(method, amounts.coffee, amounts.hotWater ?? amounts.water, style)
  const timerLink = `/seduh/${method.id}/timer${brewQuery({ coffee: amounts.coffee, ratio, style })}`

  function changeStyle(next: PourStyle) {
    setStyle(next)
    if (next === '46') setRatio(POUR_STYLE_46.ratio)
  }

  const coffeeLabel = isEspresso ? t('calc.dose') : t('calc.coffee')
  const waterLabel = isEspresso ? t('calc.yield') : t('calc.water')
  const waterUnit = isEspresso ? t('unit.gram') : t('unit.ml')
  const timeText =
    style === '46' && supportsPourStyle(method)
      ? formatClock(POUR_STYLE_46.end)
      : formatTime(method.time, method.time.unit === 'clock' ? '' : t(UNIT_KEYS[method.time.unit]))

  // Keep the numbers on screen when flipping which side is typed in.
  function switchMode(next: InputMode) {
    if (next === mode) return
    setRaw(formatNumber(next === 'coffee' ? amounts.coffee : amounts.water))
    setMode(next)
  }

  const inputCard = (label: string, unit: string) => (
    <label className="flex flex-col gap-1.5 rounded-[14px] border-2 border-accent bg-surface p-3.5">
      <span className="text-[13px] font-semibold text-muted">
        {label} ({unit})
      </span>
      <input
        type="text"
        inputMode="decimal"
        value={raw}
        onChange={(e) => setRaw(e.target.value.replace(/[^\d.,]/g, ''))}
        className="w-full border-0 bg-transparent p-0 font-mono text-4xl text-ink outline-none"
      />
    </label>
  )
  const outputCard = (label: string, unit: string, value: number) => (
    <div className="flex flex-col gap-1.5 rounded-[14px] bg-ink p-3.5 text-white" aria-live="polite">
      <span className="text-[13px] font-semibold text-line">
        {label} ({unit})
      </span>
      <output className="font-mono text-4xl">{formatNumber(value)}</output>
    </div>
  )

  return (
    <Screen>
      <BackHeader to="/" title={t(method.nameKey)} />
      <div className="flex flex-col gap-3.5 px-5">
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-muted">{t('calc.inputFrom')}</span>
          <Segmented<InputMode>
            label={t('calc.inputFrom')}
            value={mode}
            onChange={switchMode}
            options={[
              { value: 'coffee', label: coffeeLabel },
              { value: 'water', label: waterLabel },
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {mode === 'coffee' ? inputCard(coffeeLabel, t('unit.gram')) : outputCard(coffeeLabel, t('unit.gram'), amounts.coffee)}
          {mode === 'water' ? inputCard(waterLabel, waterUnit) : outputCard(waterLabel, waterUnit, amounts.water)}
        </div>

        {amounts.hotWater !== undefined && amounts.ice !== undefined && (
          <Card className="grid grid-cols-2 divide-x divide-line-soft">
            <div className="flex flex-col gap-0.5 p-3">
              <span className="text-xs text-muted">{t('calc.hotWater')}</span>
              <span className="font-mono">
                {amounts.hotWater} {t('unit.ml')}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 p-3">
              <span className="text-xs text-muted">{t('calc.ice')}</span>
              <span className="font-mono">
                {amounts.ice} {t('unit.gram')}
              </span>
            </div>
          </Card>
        )}

        <Card className="flex flex-col gap-1.5 p-3.5">
          <label htmlFor="ratio" className="flex justify-between text-sm font-semibold">
            <span>{t('calc.ratio')}</span>
            <span className="font-mono">{formatRatio(ratio)}</span>
          </label>
          <input
            id="ratio"
            type="range"
            min={method.ratio.min}
            max={method.ratio.max}
            step={method.ratio.step}
            value={ratio}
            onChange={(e) => setRatio(Number(e.target.value))}
            className="h-7 w-full"
          />
          <span className="text-xs text-muted">
            {t('calc.ratioHint', { min: formatRatio(method.ratio.recMin), max: formatRatio(method.ratio.recMax) })}
          </span>
        </Card>

        <div className="grid grid-cols-3 gap-2.5">
          <Card className="flex flex-col gap-0.5 p-3">
            <span className="text-xs text-muted">{t('calc.temperature')}</span>
            <span className={method.tempC !== null ? 'font-mono' : 'text-sm font-semibold'}>
              {method.tempC !== null ? `${method.tempC}${t('unit.celsius')}` : method.tempNoteKey && t(method.tempNoteKey)}
            </span>
          </Card>
          <Card className="flex flex-col gap-0.5 p-3">
            <span className="text-xs text-muted">{t('calc.grind')}</span>
            <span className="text-sm font-semibold">{t(grindInfo(method.grind).nameKey)}</span>
          </Card>
          <Card className="flex flex-col gap-0.5 p-3">
            <span className="text-xs text-muted">
              {method.kind === 'coldBrew' ? t('calc.steepTime') : t('calc.totalTime')}
            </span>
            <span className="font-mono">{timeText}</span>
          </Card>
        </div>

        <GrindCard method={method} />

        {supportsPourStyle(method) && (
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-muted">{t('calc.pourStyle')}</span>
            <Segmented<PourStyle>
              label={t('calc.pourStyle')}
              value={style}
              onChange={changeStyle}
              options={[
                { value: 'standard', label: t('calc.style.standard') },
                { value: '46', label: t('calc.style.46') },
              ]}
            />
            {style === '46' && <span className="text-xs leading-relaxed text-muted">{t('calc.style.46Hint')}</span>}
          </div>
        )}

        {steps.length > 0 && <Schedule steps={steps} methodId={method.id} />}

        <Tip method={method} timeText={timeText} />

        {steps.length > 0 && amounts.coffee > 0 && (
          <Link
            to={timerLink}
            className="flex h-[54px] items-center justify-center rounded-[14px] bg-accent text-base font-semibold text-white no-underline hover:bg-accent-hover"
          >
            {t('calc.startBrew')}
          </Link>
        )}
      </div>
    </Screen>
  )
}

function Schedule({ steps, methodId }: { steps: BrewStep[]; methodId: MethodId }) {
  const { t } = useI18n()
  const label = (s: BrewStep) => stepLabel(t, s, methodId)
  return (
    <section className="flex flex-col gap-2">
      <SectionLabel>{t('calc.pourSchedule')}</SectionLabel>
      <Card>
        <ol className="m-0 list-none p-0">
          {steps.map((s, i) => (
            <li
              key={i}
              className="grid grid-cols-[52px_minmax(0,1fr)_76px] items-center border-b border-line-soft px-3.5 py-2.5 text-sm last:border-b-0"
            >
              <span className="font-mono text-muted">{formatClock(s.atSec)}</span>
              <span className="font-medium">{label(s)}</span>
              <span className="text-right font-mono">{s.targetG !== undefined ? `${s.targetG} ${t('unit.gram')}` : ''}</span>
            </li>
          ))}
        </ol>
      </Card>
    </section>
  )
}

const TIP_KEYS: Partial<Record<BrewMethod['kind'], MessageKey>> = {
  espresso: 'calc.tip.espresso',
  moka: 'calc.tip.moka',
  coldBrew: 'calc.tip.coldBrew',
  iced: 'calc.tip.iced',
}

function Tip({ method, timeText }: { method: BrewMethod; timeText: string }) {
  const { t } = useI18n()
  const key = TIP_KEYS[method.kind]
  if (!key) return null
  return <p className="m-0 rounded-[14px] bg-track p-3.5 text-sm leading-relaxed">{t(key, { time: timeText })}</p>
}
