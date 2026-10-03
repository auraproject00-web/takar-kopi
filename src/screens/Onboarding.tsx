import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { MessageKey } from '../i18n/I18nProvider'
import { useI18n } from '../i18n/useI18n'
import { writePersistent } from '../lib/usePersistentState'
import { LangToggle } from '../components/LangToggle'

function Art({ children }: { children: ReactNode }) {
  return (
    <svg width="120" height="120" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

const SLIDES: { title: MessageKey; body: MessageKey; art: ReactNode }[] = [
  {
    title: 'onboarding.1.title',
    body: 'onboarding.1.body',
    art: (
      <Art>
        <path d="M10 46h44M14 46V38h36v8" />
        <path d="M22 30h20l-4 8H26z" />
        <path d="M32 14v10M27 19l5 5 5-5" />
      </Art>
    ),
  },
  {
    title: 'onboarding.2.title',
    body: 'onboarding.2.body',
    art: (
      <Art>
        <circle cx="32" cy="35" r="19" />
        <path d="M32 35V24M26 8h12M32 8v8" />
      </Art>
    ),
  },
  {
    title: 'onboarding.3.title',
    body: 'onboarding.3.body',
    art: (
      <Art>
        <path d="M16 10h26a4 4 0 0 1 4 4v40H20a4 4 0 0 1-4-4z" />
        <path d="M16 50a4 4 0 0 1 4-4h26" />
        <path d="M26 24l4 4 8-8" />
      </Art>
    ),
  },
]

export const ONBOARDED_KEY = 'cb.onboarded'

export default function Onboarding() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [index, setIndex] = useState(0)
  const slide = SLIDES[index]!
  const last = index === SLIDES.length - 1

  function finish() {
    writePersistent(ONBOARDED_KEY, true)
    navigate('/', { replace: true })
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-bg px-5 pt-6 pb-8">
      <header className="flex items-center justify-between">
        <LangToggle />
        {!last && (
          <button type="button" onClick={finish} className="min-h-11 px-2 text-sm font-semibold text-muted">
            {t('onboarding.skip')}
          </button>
        )}
      </header>

      <section aria-roledescription={t('onboarding.label')} aria-label={t('onboarding.step', { n: index + 1, total: SLIDES.length })} className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <div className="flex size-44 items-center justify-center rounded-full bg-track text-accent">{slide.art}</div>
        <h1 className="m-0 font-display text-[28px] leading-tight font-bold">{t(slide.title)}</h1>
        <p className="m-0 max-w-80 text-base leading-relaxed text-muted">{t(slide.body)}</p>
      </section>

      <div className="flex flex-col items-center gap-5">
        <ol className="m-0 flex list-none gap-2 p-0" aria-hidden="true">
          {SLIDES.map((_, i) => (
            <li key={i} className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-accent' : 'w-2 bg-field'}`} />
          ))}
        </ol>
        <button
          type="button"
          onClick={() => (last ? finish() : setIndex(index + 1))}
          className="h-[54px] w-full rounded-[14px] bg-accent text-base font-semibold text-on-accent hover:bg-accent-hover"
        >
          {last ? t('onboarding.start') : t('onboarding.next')}
        </button>
      </div>
    </main>
  )
}
