import { useState } from 'react'
import { grindInfo } from '../data/grind'
import type { BrewMethod, TimeUnit } from '../data/methods'
import type { MessageKey } from '../i18n/I18nProvider'
import { useI18n } from '../i18n/useI18n'
import {
  brewSchedule,
  calcAmounts,
  formatClock,
  formatNumber,
  formatRatio,
  formatTime,
  type BrewStep,
  type InputMode,
} from '../lib/brew'
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
  const isEspresso = method.kind === 'espresso'
  const [mode, setMode] = useState<InputMode>('coffee')
  const [raw, setRaw] = useState(String(method.defaultCoffee))
  const [ratio, setRatio] = useState(method.ratio.default)

  const amounts = calcAmounts(method.kind, mode, parseInput(raw), ratio)
  const steps = brewSchedule(method, amounts.coffee, amounts.hotWater ?? amounts.water)

  const coffeeLabel = isEspresso ? t('calc.dose') : t('calc.coffee')
  const waterLabel = isEspresso ? t('calc.yield') : t('calc.water')
  const waterUnit = isEspresso ? t('unit.gram') : t('unit.ml')
  const timeText = formatTime(method.time, method.time.unit === 'clock' ? '' : t(UNIT_KEYS[method.time.unit]))

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

        {steps.length > 0 && <Schedule steps={steps} frenchPress={method.id === 'frenchPress'} />}

        <Tip method={method} timeText={timeText} />
      </div>
    </Screen>
  )
}

function Schedule({ steps, frenchPress }: { steps: BrewStep[]; frenchPress: boolean }) {
  const { t } = useI18n()
  const label = (s: BrewStep): string => {
    switch (s.type) {
      case 'bloom':
        return t('timer.bloom')
      case 'pour':
        return t('timer.pour', { n: s.n ?? 1 })
      case 'pourAll':
        return t('timer.pourAll')
      case 'stir':
        return t('timer.stir')
      case 'steep':
        return t('timer.steep')
      case 'press':
        return frenchPress ? t('timer.plunge') : t('timer.press')
      case 'drawdown':
        return t('timer.drawdown')
    }
  }
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
