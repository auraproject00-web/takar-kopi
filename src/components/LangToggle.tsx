import { useI18n } from '../i18n/useI18n'
import type { Lang } from '../i18n/I18nProvider'

const LANGS: { value: Lang; label: string }[] = [
  { value: 'id', label: 'ID' },
  { value: 'en', label: 'EN' },
]

export function LangToggle() {
  const { lang, setLang, t } = useI18n()
  return (
    <div role="group" aria-label={t('lang.switch')} className="flex rounded-full border border-line bg-surface p-[3px]">
      {LANGS.map((l) => (
        <button
          key={l.value}
          type="button"
          aria-pressed={lang === l.value}
          onClick={() => setLang(l.value)}
          className={`h-8 min-w-11 rounded-full text-[13px] font-semibold ${
            lang === l.value ? 'bg-ink text-white' : 'bg-transparent text-muted'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  )
}
