import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { APP_VERSION, FEEDBACK_URL } from '../config'
import { GRINDERS, type GrinderId } from '../data/grinders'
import type { Lang } from '../i18n/I18nProvider'
import { useI18n } from '../i18n/useI18n'
import { canBuzz } from '../lib/cues'
import { useTheme, type Theme } from '../lib/theme'
import { useUnits, type Units } from '../lib/units'
import { usePersistentState } from '../lib/usePersistentState'
import { Card, Screen, SectionLabel } from '../components/layout'
import { Segmented } from '../components/Segmented'

function Switch({ label, hint, on, onChange }: { label: string; hint: string; on: boolean; onChange: (on: boolean) => void }) {
  return (
    <div className="flex min-h-16 items-center justify-between gap-3 border-b border-line-soft py-2 last:border-b-0">
      <span className="flex flex-col gap-0.5">
        <span className="text-[15px] font-semibold">{label}</span>
        <span className="text-[13px] text-muted">{hint}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={() => onChange(!on)}
        className={`relative h-8 w-[52px] shrink-0 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-field'}`}
      >
        <span className={`absolute top-[3px] size-[26px] rounded-full bg-white transition-[left] ${on ? 'left-[23px]' : 'left-[3px]'}`} />
      </button>
    </div>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-2.5">
      <span className="text-[15px] font-semibold">{label}</span>
      {children}
    </div>
  )
}

export default function Settings() {
  const { t, lang, setLang } = useI18n()
  const [theme, setTheme] = useTheme()
  const [units, setUnits] = useUnits()
  const [grinder, setGrinder] = usePersistentState<GrinderId | 'custom'>('cb.grinder', 'c40')
  const [sound, setSound] = usePersistentState('cb.sound', true)
  const [vibrate, setVibrate] = usePersistentState('cb.vibrate', true)
  const [keepAwake, setKeepAwake] = usePersistentState('cb.keepAwake', true)
  const [buzzSupported] = useState(canBuzz)
  const setUnit = <K extends keyof Units>(key: K, value: Units[K]) => setUnits({ ...units, [key]: value })

  return (
    <Screen nav>
      <header className="px-5 pt-7 pb-2">
        <h1 className="m-0 font-display text-[28px] font-bold">{t('settings.title')}</h1>
      </header>
      <div className="flex flex-col gap-5 px-5 pt-2">
        <section className="flex flex-col gap-2">
          <SectionLabel>{t('settings.general')}</SectionLabel>
          <Card className="flex flex-col gap-3.5 p-3.5">
            <div className="flex flex-col gap-2">
              <span className="text-[15px] font-semibold">{t('settings.language')}</span>
              <Segmented<Lang>
                label={t('settings.language')}
                value={lang}
                onChange={setLang}
                options={[
                  { value: 'id', label: 'Indonesia' },
                  { value: 'en', label: 'English' },
                ]}
              />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-[15px] font-semibold">{t('settings.theme')}</span>
              <Segmented<Theme>
                label={t('settings.theme')}
                value={theme}
                onChange={setTheme}
                options={[
                  { value: 'light', label: t('settings.theme.light') },
                  { value: 'dark', label: t('settings.theme.dark') },
                  { value: 'system', label: t('settings.theme.system') },
                ]}
              />
            </div>
          </Card>
        </section>

        <section className="flex flex-col gap-2">
          <SectionLabel>{t('settings.units')}</SectionLabel>
          <Card className="flex flex-col gap-3.5 p-3.5">
            <Row label={t('settings.weight')}>
              <Segmented<Units['weight']>
                label={t('settings.weight')}
                value={units.weight}
                onChange={(v) => setUnit('weight', v)}
                options={[
                  { value: 'g', label: 'gram' },
                  { value: 'oz', label: 'oz' },
                ]}
              />
            </Row>
            <Row label={t('settings.volume')}>
              <Segmented<Units['volume']>
                label={t('settings.volume')}
                value={units.volume}
                onChange={(v) => setUnit('volume', v)}
                options={[
                  { value: 'ml', label: 'ml' },
                  { value: 'floz', label: 'fl oz' },
                ]}
              />
            </Row>
            <Row label={t('settings.temperature')}>
              <Segmented<Units['temp']>
                label={t('settings.temperature')}
                value={units.temp}
                onChange={(v) => setUnit('temp', v)}
                options={[
                  { value: 'c', label: '°C' },
                  { value: 'f', label: '°F' },
                ]}
              />
            </Row>
          </Card>
        </section>

        <section className="flex flex-col gap-2">
          <SectionLabel>{t('settings.brew')}</SectionLabel>
          <Card className="flex flex-col px-3.5 pt-3">
            <label htmlFor="default-grinder" className="flex flex-col gap-2 border-b border-line-soft pb-3.5 text-[15px] font-semibold">
              {t('settings.defaultGrinder')}
              <select
                id="default-grinder"
                value={grinder}
                onChange={(e) => setGrinder(e.target.value as GrinderId | 'custom')}
                className="h-11 rounded-[10px] border border-field bg-surface px-3 text-[15px] font-medium text-ink"
              >
                {GRINDERS.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
                <option value="custom">{t('grind.otherGrinder')}</option>
              </select>
            </label>
            <Switch label={t('settings.sound')} hint={t('settings.soundHint')} on={sound} onChange={setSound} />
            {buzzSupported && <Switch label={t('settings.vibrate')} hint={t('settings.vibrateHint')} on={vibrate} onChange={setVibrate} />}
            <Switch label={t('settings.keepAwake')} hint={t('settings.keepAwakeHint')} on={keepAwake} onChange={setKeepAwake} />
          </Card>
        </section>

        <section className="flex flex-col gap-2">
          <SectionLabel>{t('settings.more')}</SectionLabel>
          <Card className="flex flex-col px-3.5">
            <Link to="/pengenalan" className="flex min-h-12 items-center border-b border-line-soft font-semibold text-accent last:border-b-0">
              {t('settings.intro')}
            </Link>
            <Link to="/resep" className="flex min-h-12 items-center border-b border-line-soft text-sm text-muted last:border-b-0">
              {t('settings.backupHere')}
            </Link>
            {FEEDBACK_URL && (
              <a href={FEEDBACK_URL} target="_blank" rel="noreferrer" className="flex min-h-12 items-center font-semibold text-accent">
                {t('settings.feedback')}
              </a>
            )}
          </Card>
        </section>

        <p className="m-0 flex flex-col items-center gap-0.5 pb-2 text-[13px] text-muted">
          <span className="font-display text-base font-bold text-ink">{t('app.name')}</span>
          {t('settings.version', { v: APP_VERSION })}
        </p>
      </div>
    </Screen>
  )
}
