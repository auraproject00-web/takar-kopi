import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import type { BrewMethod } from '../data/methods'
import { useI18n } from '../i18n/useI18n'
import { brewEndSec, brewSchedule, calcAmounts, formatClock } from '../lib/brew'
import { brewQuery, readBrewParams } from '../lib/brewParams'
import { beep, buzz, canBuzz, unlockAudio } from '../lib/cues'
import { stepLabel } from '../lib/stepLabel'
import { currentStepIndex, nextStepMs } from '../lib/timer'
import { useBrewTimer } from '../lib/useBrewTimer'
import { usePersistentState } from '../lib/usePersistentState'
import { useWakeLock } from '../lib/useWakeLock'
import { useUnitFormat } from '../lib/units'

export default function Timer({ method }: { method: BrewMethod }) {
  const { t } = useI18n()
  const [search] = useSearchParams()
  const params = readBrewParams(method, search)
  const amounts = calcAmounts(method.kind, 'coffee', params.coffee, params.ratio)
  const brewWater = amounts.hotWater ?? amounts.water
  const steps = brewSchedule(method, amounts.coffee, brewWater, params.style)
  const endSec = brewEndSec(method, steps, params.style)
  const timer = useBrewTimer(endSec * 1000)
  const [sound, setSound] = usePersistentState('cb.sound', true)
  const [vibrate, setVibrate] = usePersistentState('cb.vibrate', true)
  const [keepAwake] = usePersistentState('cb.keepAwake', true)
  const u = useUnitFormat()
  const [buzzSupported] = useState(canBuzz)
  const flashRef = useRef<HTMLDivElement>(null)
  const calcLink = `/seduh/${method.id}${brewQuery(params)}`
  const saveLink = `/resep/baru${brewQuery(params)}&metode=${method.id}`

  const elapsedSec = timer.elapsedMs / 1000
  const started = timer.status !== 'idle'
  const index = started ? currentStepIndex(steps, elapsedSec) : -1
  const step = steps[index]
  const next = steps[index + 1]
  const done = timer.status === 'done'

  useWakeLock(keepAwake && timer.status === 'running')

  // Signal each step change, and the end, while the timer is running.
  const lastSignalled = useRef(-1)
  useEffect(() => {
    if (timer.status === 'idle') {
      lastSignalled.current = -1
      return
    }
    const key = done ? steps.length : index
    if (key === lastSignalled.current) return
    const isFirst = lastSignalled.current === -1
    lastSignalled.current = key
    if (isFirst && !done) return // The start tap is feedback enough.
    if (sound) beep(done ? 3 : 1)
    if (vibrate && buzzSupported) buzz(done ? [200, 100, 200] : 200)
    // A screen flash works everywhere, including iPhones with the ringer off.
    flashRef.current?.animate?.([{ opacity: 0.45 }, { opacity: 0 }], { duration: done ? 1200 : 700, easing: 'ease-out' })
  }, [index, done, timer.status, steps.length, sound, vibrate, buzzSupported])

  if (steps.length === 0) return <Navigate to={calcLink} replace />

  const progress = Math.min(100, (elapsedSec / endSec) * 100)
  const tempText = method.tempC !== null ? ` · ${u.fmtTemp(method.tempC)}` : ''

  return (
    <main className="light-tokens mx-auto flex min-h-dvh w-full max-w-md flex-col bg-ink text-white">
      <div ref={flashRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-10 bg-[#e08a3c] opacity-0" />
      <header className="flex items-center justify-between py-5 pr-3 pl-5">
        <div className="flex flex-col gap-0.5">
          <h1 className="m-0 font-display text-xl font-bold">{t(method.nameKey)}</h1>
          <span className="font-mono text-[13px] text-field">
            {u.fmtWeight(amounts.coffee)} · {u.fmtVolume(amounts.water)}
            {amounts.ice !== undefined && ` (${u.fmtWeight(amounts.ice)} ${t('method.ice')})`}
            {tempText}
          </span>
        </div>
        <Link to={calcLink} aria-label={t('timer.backToCalc')} className="flex size-11 items-center justify-center text-white">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </Link>
      </header>

      <section className="flex flex-col items-center gap-1.5 px-5 pt-6 pb-5 text-center" aria-live="polite">
        <span className="text-sm font-semibold tracking-wider text-accent-soft uppercase">
          {done
            ? t('timer.title')
            : step
              ? `${stepLabel(t, step, method.id)} · ${t('timer.stepOf', { step: index + 1, total: steps.length })}`
              : t('timer.title')}
        </span>
        <span className="font-mono text-[88px] leading-none tracking-tighter" role="timer" aria-live="off">
          {formatClock(Math.floor(elapsedSec))}
        </span>
        <span className="min-h-7 text-lg">
          {done
            ? t('timer.done')
            : !started
              ? t('timer.ready')
              : step?.targetG !== undefined
                ? t('timer.pourTo', { amount: u.fmtWeight(step.targetG) })
                : next
                  ? t('timer.nextIn', { step: stepLabel(t, next, method.id), time: formatClock(next.atSec - elapsedSec) })
                  : ''}
        </span>
        {started && !done && step?.targetG !== undefined && next && (
          <span className="text-sm text-field">
            {t('timer.nextIn', { step: stepLabel(t, next, method.id), time: formatClock(next.atSec - elapsedSec) })}
          </span>
        )}
      </section>

      <div className="px-5">
        <div
          role="progressbar"
          aria-label={t('timer.title')}
          aria-valuemin={0}
          aria-valuemax={endSec}
          aria-valuenow={Math.floor(elapsedSec)}
          className="h-2.5 overflow-hidden rounded-full bg-[#3a3734]"
        >
          <div className="h-full rounded-full bg-[#e08a3c]" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-between pt-1.5 font-mono text-xs text-field">
          <span>0:00</span>
          <span>{formatClock(endSec)}</span>
        </div>
      </div>

      <ol className="m-0 flex flex-1 list-none flex-col gap-2 p-5">
        {steps.map((s, i) => {
          const state = !started || i > index ? 'next' : i === index && !done ? 'now' : 'done'
          return (
            <li
              key={i}
              aria-current={state === 'now' ? 'step' : undefined}
              className={`grid grid-cols-[52px_minmax(0,1fr)_70px] items-center rounded-xl px-3.5 py-3 text-[15px] ${
                state === 'now' ? 'bg-accent-soft text-ink' : state === 'done' ? 'text-[#8c877f]' : 'bg-[#2a2826]'
              }`}
            >
              <span className="font-mono text-[13px]">{formatClock(s.atSec)}</span>
              <span className="font-medium">{stepLabel(t, s, method.id)}</span>
              <span className="text-right font-mono">{s.targetG !== undefined ? u.fmtWeight(s.targetG) : '—'}</span>
            </li>
          )
        })}
      </ol>

      <div className="flex flex-col gap-3 px-5 pb-6">
        <Controls
          status={timer.status}
          onStart={() => {
            unlockAudio()
            timer.start()
          }}
          onPause={timer.pause}
          onReset={timer.reset}
          onNext={() => timer.seek(nextStepMs(steps, elapsedSec, endSec))}
        />
        {done && (
          <Link to={saveLink} className="flex h-[54px] items-center justify-center rounded-[14px] bg-[#e08a3c] text-base font-semibold text-ink no-underline">
            {t('timer.finishSave')}
          </Link>
        )}
        <div role="group" aria-label={t('timer.signals')} className="flex justify-center gap-2">
          <Toggle on={sound} onChange={setSound} label={t('timer.sound')} />
          {buzzSupported && <Toggle on={vibrate} onChange={setVibrate} label={t('timer.vibrate')} />}
        </div>
      </div>
    </main>
  )
}

function Controls({
  status,
  onStart,
  onPause,
  onReset,
  onNext,
}: {
  status: ReturnType<typeof useBrewTimer>['status']
  onStart: () => void
  onPause: () => void
  onReset: () => void
  onNext: () => void
}) {
  const { t } = useI18n()
  const primary = 'h-[54px] rounded-[14px] border-0 bg-[#e08a3c] text-base font-semibold text-ink'
  const secondary = 'h-[54px] rounded-[14px] border border-muted bg-transparent text-base font-semibold text-white'

  if (status === 'idle') {
    return (
      <button type="button" className={primary} onClick={onStart}>
        {t('timer.start')}
      </button>
    )
  }
  if (status === 'done') {
    return (
      <button type="button" className={secondary} onClick={onReset}>
        {t('timer.restart')}
      </button>
    )
  }
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {status === 'running' ? (
        <button type="button" className={secondary} onClick={onPause}>
          {t('timer.pause')}
        </button>
      ) : (
        <button type="button" className={secondary} onClick={onReset}>
          {t('timer.restart')}
        </button>
      )}
      {status === 'running' ? (
        <button type="button" className={primary} onClick={onNext}>
          {t('timer.nextStep')}
        </button>
      ) : (
        <button type="button" className={primary} onClick={onStart}>
          {t('timer.resume')}
        </button>
      )}
    </div>
  )
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (on: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onChange(!on)}
      className={`min-h-11 rounded-full px-4 text-sm font-semibold ${
        on ? 'bg-[#2a2826] text-white' : 'bg-transparent text-field line-through'
      }`}
    >
      {label}
    </button>
  )
}
