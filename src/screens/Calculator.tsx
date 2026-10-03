import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { GRIND_LEVELS, grindInfo, type GrindLevel } from '../data/grind'
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
  type Amounts,
  type BrewStep,
  type InputMode,
  type PourStyle,
} from '../lib/brew'
import { brewQuery, guidedQuery, readBrewParams, readGuidedChoice } from '../lib/brewParams'
import { defaultChoice, guidedAmounts, PORTIONS, type GuidedChoice, type PortionSize, type SizeLabel, type Strength } from '../data/portions'
import { usePersistentState } from '../lib/usePersistentState'
import { stepLabel } from '../lib/stepLabel'
import { useUnitFormat, type UnitFormat } from '../lib/units'
import { BackHeader, Card, Screen, SectionLabel } from '../components/layout'
import { Segmented } from '../components/Segmented'
import { GrindCard } from '../components/GrindCard'
import { BeanPicker } from '../components/BeanPicker'
import { CustomSchedule } from '../components/CustomSchedule'
import { customQuery, grindFor, parseClock, readCustom, TEMP_LIMITS, type BrewCustom } from '../lib/custom'
import { brewTempC } from '../data/beans'
import { readBeanParam, useBean } from '../lib/bean'

const SIZE_KEYS: Record<Exclude<SizeLabel, 'cup' | 'volume'>, MessageKey> = {
  small: 'portion.small',
  medium: 'portion.medium',
  large: 'portion.large',
  single: 'portion.single',
  double: 'portion.double',
}

const STRENGTHS: Strength[] = ['light', 'normal', 'strong']

const UNIT_KEYS: Record<Exclude<TimeUnit, 'clock'>, MessageKey> = {
  seconds: 'unit.seconds',
  minutes: 'unit.minutes',
  hours: 'unit.hours',
}

function parseInput(raw: string): number {
  return Number.parseFloat(raw.replace(',', '.'))
}

type CalcMode = 'guided' | 'custom'

export default function Calculator({ method }: { method: BrewMethod }) {
  const { t } = useI18n()
  const [search] = useSearchParams()
  const u = useUnitFormat()
  const isEspresso = method.kind === 'espresso'
  const portion = PORTIONS[method.id]
  const { bean, setBean } = useBean()
  // A recipe link carries the beans it was brewed with.
  const [linkedBean] = useState(() => readBeanParam(search.get('beans')))
  useEffect(() => {
    if (linkedBean) setBean(linkedBean)
  }, [linkedBean, setBean])
  const tempC = brewTempC(method, bean)

  // Coming back from the timer or opening a recipe restores what was brewed:
  // a guided choice reopens Takaran, plain numbers reopen Eksperimen.
  const [initial] = useState(() => readBrewParams(method, search))
  const [initialChoice] = useState(() => readGuidedChoice(method, search))
  const [savedMode, setSavedMode] = usePersistentState<CalcMode>('cb.calcMode', 'guided')
  const [mode, setMode] = useState<CalcMode>(() => (initialChoice ? 'guided' : search.has('kopi') ? 'custom' : savedMode))
  function changeMode(next: CalcMode) {
    setMode(next)
    setSavedMode(next)
  }

  // Guided state
  const [choice, setChoice] = useState<GuidedChoice>(() => initialChoice ?? defaultChoice(method))

  // Custom state. The input shows the display unit (g or oz); everything below works in grams and ml.
  const [inputMode, setInputMode] = useState<InputMode>('coffee')
  const [raw, setRaw] = useState(() => formatNumber(u.weight(initial.coffee), 2))
  const [customRatio, setCustomRatio] = useState(initial.ratio)
  const [customStyle, setCustomStyle] = useState<PourStyle>(initial.style)
  const [custom, setCustom] = useState<BrewCustom>(() => readCustom(search) ?? {})
  // Bumped to reload the step editor when its steps are replaced from outside.
  const [scheduleKey, setScheduleKey] = useState(0)
  const [timeRaw, setTimeRaw] = useState(() =>
    custom.time === undefined ? '' : method.time.unit === 'clock' ? formatClock(custom.time) : String(custom.time),
  )

  let amounts: Amounts
  let ratio: number
  let style: PourStyle
  if (mode === 'guided') {
    ;({ amounts, ratio } = guidedAmounts(method, choice))
    style = 'standard'
  } else {
    const typed = parseInput(raw)
    const typedBase = inputMode === 'coffee' || isEspresso ? u.toGrams(typed) : u.toMl(typed)
    amounts = calcAmounts(method.kind, inputMode, typedBase, customRatio)
    ratio = customRatio
    style = customStyle
  }

  const shownWater = isEspresso ? u.weight(amounts.water) : u.volume(amounts.water)
  const brewWater = amounts.hotWater ?? amounts.water
  const defaultSteps = brewSchedule(method, amounts.coffee, brewWater, style)
  // Eksperimen settings only count on that tab.
  const own = mode === 'custom' ? custom : undefined
  const steps = own?.steps ?? defaultSteps
  const shownTempC = tempC === null ? null : (own?.tempC ?? tempC)
  const grind = grindFor(method, own)
  const extra = mode === 'guided' ? guidedQuery(choice) : customQuery(custom)
  const query = brewQuery({ coffee: amounts.coffee, ratio, style }) + (extra ? `&${extra}` : '')
  const timerLink = `/seduh/${method.id}/timer${query}`
  const saveLink = `/resep/baru${query}&metode=${method.id}`

  function changeStyle(next: PourStyle) {
    setCustomStyle(next)
    if (next === '46') setCustomRatio(POUR_STYLE_46.ratio)
    setSteps(undefined)
  }

  function setSteps(next: BrewStep[] | undefined) {
    setCustom({ ...custom, steps: next })
    setScheduleKey((k) => k + 1)
  }

  function changeTime(raw: string) {
    setTimeRaw(raw)
    const value = method.time.unit === 'clock' ? parseClock(raw) : Number.parseFloat(raw.replace(',', '.'))
    setCustom({ ...custom, time: value !== null && value > 0 ? value : undefined })
  }

  const coffeeLabel = isEspresso ? t('calc.dose') : t('calc.coffee')
  const waterLabel = isEspresso ? t('calc.yield') : t('calc.water')
  const waterUnit = isEspresso ? u.weightLabel : u.volumeLabel
  const timeUnitLabel = method.time.unit === 'clock' ? '' : t(UNIT_KEYS[method.time.unit])
  const defaultTimeText =
    style === '46' && supportsPourStyle(method) ? formatClock(POUR_STYLE_46.end) : formatTime(method.time, timeUnitLabel)
  const timeText =
    own?.time === undefined
      ? defaultTimeText
      : formatTime({ min: own.time, unit: method.time.unit }, timeUnitLabel)
  const timeLabel = method.kind === 'coldBrew' ? t('calc.steepTime') : t('calc.totalTime')

  // Keep the numbers on screen when flipping which side is typed in.
  function switchInput(next: InputMode) {
    if (next === inputMode) return
    setRaw(formatNumber(next === 'coffee' ? u.weight(amounts.coffee) : shownWater, 2))
    setInputMode(next)
  }

  const sizeName = (s: PortionSize): string =>
    s.label === 'cup' ? t('portion.cup', { n: s.cups ?? 1 }) : s.label === 'volume' ? u.fmtVolume(s.amount) : t(SIZE_KEYS[s.label])
  const sizeAmount = (s: PortionSize): string | null =>
    s.label === 'volume' ? null : portion.basis === 'dose' ? u.fmtWeight(s.amount) : u.fmtVolume(s.amount)
  const selectedSize = portion.sizes.find((s) => s.id === choice.sizeId) ?? portion.sizes[0]!

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
    <div className="flex flex-col gap-1.5 rounded-[14px] bg-inverse p-3.5 text-on-inverse" aria-live="polite">
      <span className="text-[13px] font-semibold text-on-inverse-muted">
        {label} ({unit})
      </span>
      <output className="font-mono text-4xl">{formatNumber(value, 2)}</output>
    </div>
  )

  return (
    <Screen>
      <BackHeader to="/" title={t(method.nameKey)} />
      <div className="flex flex-col gap-3.5 px-5">
        {tempC !== null && <BeanPicker method={method} />}
        <Segmented<CalcMode>
          label={t('calc.mode.label')}
          value={mode}
          onChange={changeMode}
          options={[
            { value: 'guided', label: t('calc.mode.guided') },
            { value: 'custom', label: t('calc.mode.custom') },
          ]}
        />

        {mode === 'guided' ? (
          <>
            <p className="m-0 text-[13px] text-muted">{t('calc.guidedHint')}</p>
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-muted">{t(portion.sizeKey)}</span>
              <Segmented<string>
                label={t(portion.sizeKey)}
                value={selectedSize.id}
                onChange={(sizeId) => setChoice({ ...choice, sizeId })}
                options={portion.sizes.map((s) => ({
                  value: s.id,
                  label: (
                    <span className="flex flex-col items-center leading-tight">
                      <span>{sizeName(s)}</span>
                      {sizeAmount(s) && <span className="font-mono text-xs font-medium opacity-80">{sizeAmount(s)}</span>}
                    </span>
                  ),
                }))}
              />
            </div>

            {portion.maxCount > 1 && (
              <div className="flex items-center justify-between gap-3 rounded-[14px] border border-line bg-surface px-3.5 py-2">
                <span className="text-sm font-semibold" id="cup-count-label">
                  {t('calc.count')}
                </span>
                <div className="flex items-center gap-1" role="group" aria-labelledby="cup-count-label">
                  <button
                    type="button"
                    aria-label={t('calc.countLess')}
                    disabled={choice.count <= 1}
                    onClick={() => setChoice({ ...choice, count: choice.count - 1 })}
                    className="flex size-11 items-center justify-center rounded-full bg-track text-xl font-semibold text-ink disabled:opacity-40"
                  >
                    −
                  </button>
                  <output aria-live="polite" className="w-10 text-center font-mono text-xl">
                    {choice.count}
                  </output>
                  <button
                    type="button"
                    aria-label={t('calc.countMore')}
                    disabled={choice.count >= portion.maxCount}
                    onClick={() => setChoice({ ...choice, count: choice.count + 1 })}
                    className="flex size-11 items-center justify-center rounded-full bg-track text-xl font-semibold text-ink disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-muted">{t('strength.label')}</span>
              <Segmented<Strength>
                label={t('strength.label')}
                value={choice.strength}
                onChange={(strength) => setChoice({ ...choice, strength })}
                options={STRENGTHS.map((st) => ({
                  value: st,
                  label: (
                    <span className="flex flex-col items-center leading-tight">
                      <span>{t(`strength.${st}`)}</span>
                      <span className="font-mono text-xs font-medium opacity-80">{formatRatio(portion.ratios[st])}</span>
                    </span>
                  ),
                }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {outputCard(coffeeLabel, u.weightLabel, u.weight(amounts.coffee))}
              {outputCard(waterLabel, waterUnit, shownWater)}
            </div>
            {choice.count > 1 && sizeAmount(selectedSize) && (
              <p className="m-0 -mt-1.5 text-center text-[13px] text-muted">
                {t('calc.forCups', { n: choice.count, size: sizeAmount(selectedSize)! })}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="m-0 text-[13px] text-muted">{t('calc.customHint')}</p>
            <div className="flex flex-col gap-2">
              <span className="text-[13px] font-semibold text-muted">{t('calc.inputFrom')}</span>
              <Segmented<InputMode>
                label={t('calc.inputFrom')}
                value={inputMode}
                onChange={switchInput}
                options={[
                  { value: 'coffee', label: coffeeLabel },
                  { value: 'water', label: waterLabel },
                ]}
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {inputMode === 'coffee'
                ? inputCard(coffeeLabel, u.weightLabel)
                : outputCard(coffeeLabel, u.weightLabel, u.weight(amounts.coffee))}
              {inputMode === 'water' ? inputCard(waterLabel, waterUnit) : outputCard(waterLabel, waterUnit, shownWater)}
            </div>
          </>
        )}

        {amounts.hotWater !== undefined && amounts.ice !== undefined && (
          <Card className="grid grid-cols-2 divide-x divide-line-soft">
            <div className="flex flex-col gap-0.5 p-3">
              <span className="text-xs text-muted">{t('calc.hotWater')}</span>
              <span className="font-mono">{u.fmtVolume(amounts.hotWater)}</span>
            </div>
            <div className="flex flex-col gap-0.5 p-3">
              <span className="text-xs text-muted">{t('calc.ice')}</span>
              <span className="font-mono">{u.fmtWeight(amounts.ice)}</span>
            </div>
          </Card>
        )}

        {mode === 'custom' && (
          <Card className="flex flex-col gap-1.5 p-3.5">
            <label htmlFor="ratio" className="flex justify-between text-sm font-semibold">
              <span>{t('calc.ratio')}</span>
              <span className="font-mono">{formatRatio(customRatio)}</span>
            </label>
            <input
              id="ratio"
              type="range"
              min={method.ratio.min}
              max={method.ratio.max}
              step={method.ratio.step}
              value={customRatio}
              onChange={(e) => setCustomRatio(Number(e.target.value))}
              className="h-7 w-full"
            />
            <span className="text-xs text-muted">
              {t('calc.ratioHint', { min: formatRatio(method.ratio.recMin), max: formatRatio(method.ratio.recMax) })}
            </span>
          </Card>
        )}

        {mode === 'custom' ? (
          <Card className="flex flex-col p-3.5 pt-1">
            {shownTempC !== null && (
              <div className="flex min-h-14 items-center justify-between gap-3 border-b border-line-soft py-1.5">
                <span className="flex flex-col">
                  <span className="text-[15px] font-semibold" id="temp-label">
                    {t('calc.temperature')}
                  </span>
                  {custom.tempC !== undefined && (
                    <button
                      type="button"
                      onClick={() => setCustom({ ...custom, tempC: undefined })}
                      className="min-h-8 text-left text-[13px] font-semibold text-accent"
                    >
                      {t('calc.tempFromBeans', { temp: u.fmtTemp(tempC!) })}
                    </button>
                  )}
                </span>
                <div className="flex items-center gap-1" role="group" aria-labelledby="temp-label">
                  <button
                    type="button"
                    aria-label={t('calc.tempLess')}
                    disabled={shownTempC <= TEMP_LIMITS.min}
                    onClick={() => setCustom({ ...custom, tempC: shownTempC - 1 })}
                    className="flex size-11 items-center justify-center rounded-full bg-track text-xl font-semibold text-ink disabled:opacity-40"
                  >
                    −
                  </button>
                  <output aria-live="polite" className="w-16 text-center font-mono text-lg">
                    {u.fmtTemp(shownTempC)}
                  </output>
                  <button
                    type="button"
                    aria-label={t('calc.tempMore')}
                    disabled={shownTempC >= TEMP_LIMITS.max}
                    onClick={() => setCustom({ ...custom, tempC: shownTempC + 1 })}
                    className="flex size-11 items-center justify-center rounded-full bg-track text-xl font-semibold text-ink disabled:opacity-40"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
            <label className="flex min-h-14 items-center justify-between gap-3 border-b border-line-soft py-1.5">
              <span className="text-[15px] font-semibold">{t('calc.grind')}</span>
              <select
                value={grind}
                onChange={(e) => {
                  const level = e.target.value as GrindLevel
                  setCustom({ ...custom, grind: level === method.grind ? undefined : level })
                }}
                className="h-11 min-w-0 rounded-[10px] border border-field bg-surface px-2.5 text-[15px] font-medium text-ink"
              >
                {GRIND_LEVELS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {t(g.nameKey)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-h-14 items-center justify-between gap-3 py-1.5">
              <span className="flex flex-col">
                <span className="text-[15px] font-semibold">{timeLabel}</span>
                <span className="text-xs text-muted">
                  {method.time.unit === 'clock' ? t('calc.timeHintClock') : t('calc.timeHint', { unit: timeUnitLabel })}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <input
                  type="text"
                  inputMode={method.time.unit === 'clock' ? 'numeric' : 'decimal'}
                  value={timeRaw}
                  placeholder={method.time.unit === 'clock' ? defaultTimeText : String(method.time.max ?? method.time.min)}
                  onChange={(e) => changeTime(e.target.value.replace(/[^\d:.,]/g, ''))}
                  className="h-11 w-20 rounded-[10px] border border-field bg-surface px-2.5 text-right font-mono text-[15px] text-ink placeholder:text-muted"
                />
                {timeUnitLabel && <span className="text-sm text-muted">{timeUnitLabel}</span>}
              </span>
            </label>
          </Card>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            <Card className="flex flex-col gap-0.5 p-3">
              <span className="text-xs text-muted">{t('calc.temperature')}</span>
              <span className={shownTempC !== null ? 'font-mono' : 'text-sm font-semibold'}>
                {shownTempC !== null ? u.fmtTemp(shownTempC) : method.tempNoteKey && t(method.tempNoteKey)}
              </span>
            </Card>
            <Card className="flex flex-col gap-0.5 p-3">
              <span className="text-xs text-muted">{t('calc.grind')}</span>
              <span className="text-sm font-semibold">{t(grindInfo(grind).nameKey)}</span>
            </Card>
            <Card className="flex flex-col gap-0.5 p-3">
              <span className="text-xs text-muted">{timeLabel}</span>
              <span className="font-mono">{timeText}</span>
            </Card>
          </div>
        )}

        <GrindCard method={method} level={grind} />

        {mode === 'custom' && supportsPourStyle(method) && (
          <div className="flex flex-col gap-2">
            <span className="text-[13px] font-semibold text-muted">{t('calc.pourStyle')}</span>
            <Segmented<PourStyle>
              label={t('calc.pourStyle')}
              value={customStyle}
              onChange={changeStyle}
              options={[
                { value: 'standard', label: t('calc.style.standard') },
                { value: '46', label: t('calc.style.46') },
              ]}
            />
            {customStyle === '46' && <span className="text-xs leading-relaxed text-muted">{t('calc.style.46Hint')}</span>}
          </div>
        )}

        {mode === 'custom' ? (
          <section className="flex flex-col gap-2">
            <SectionLabel>{t('calc.pourSchedule')}</SectionLabel>
            {custom.steps === undefined ? (
              <>
                {defaultSteps.length > 0 ? (
                  <ScheduleList steps={defaultSteps} methodId={method.id} units={u} />
                ) : (
                  <p className="m-0 text-sm text-muted">{t('calc.step.noDefault')}</p>
                )}
                <button
                  type="button"
                  onClick={() => setSteps(defaultSteps)}
                  className="flex min-h-11 items-center justify-center rounded-xl border border-field text-sm font-semibold text-accent"
                >
                  {defaultSteps.length > 0 ? t('calc.step.edit') : t('calc.step.create')}
                </button>
              </>
            ) : (
              <>
                <CustomSchedule
                  key={scheduleKey}
                  steps={custom.steps}
                  water={brewWater}
                  methodId={method.id}
                  units={u}
                  onChange={(next) => setCustom({ ...custom, steps: next })}
                />
                {defaultSteps.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSteps(undefined)}
                    className="flex min-h-11 items-center justify-center text-sm font-semibold text-muted"
                  >
                    {t('calc.step.reset')}
                  </button>
                )}
              </>
            )}
          </section>
        ) : (
          steps.length > 0 && (
            <section className="flex flex-col gap-2">
              <SectionLabel>{t('calc.pourSchedule')}</SectionLabel>
              <ScheduleList steps={steps} methodId={method.id} units={u} />
            </section>
          )
        )}

        <Tip method={method} timeText={timeText} />

        {steps.length > 0 && amounts.coffee > 0 && (
          <Link
            to={timerLink}
            className="flex h-[54px] items-center justify-center rounded-[14px] bg-accent text-base font-semibold text-on-accent no-underline hover:bg-accent-hover"
          >
            {t('calc.startBrew')}
          </Link>
        )}
        {amounts.coffee > 0 && (
          <Link to={saveLink} className="flex min-h-11 items-center justify-center text-[15px] font-semibold text-accent">
            {t('calc.saveAsRecipe')}
          </Link>
        )}
      </div>
    </Screen>
  )
}

function ScheduleList({ steps, methodId, units }: { steps: BrewStep[]; methodId: MethodId; units: UnitFormat }) {
  const { t } = useI18n()
  const label = (s: BrewStep) => stepLabel(t, s, methodId)
  return (
    <Card>
      <ol className="m-0 list-none p-0">
        {steps.map((s, i) => (
          <li
            key={i}
            className="grid grid-cols-[52px_minmax(0,1fr)_76px] items-center border-b border-line-soft px-3.5 py-2.5 text-sm last:border-b-0"
          >
            <span className="font-mono text-muted">{formatClock(s.atSec)}</span>
            <span className="font-medium">{label(s)}</span>
            <span className="text-right font-mono">{s.targetG !== undefined ? units.fmtWeight(s.targetG) : ''}</span>
          </li>
        ))}
      </ol>
    </Card>
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
