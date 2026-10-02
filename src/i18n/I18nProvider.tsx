import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import id from './id.json'
import en from './en.json'

export type Lang = 'id' | 'en'
export type MessageKey = keyof typeof id
type Vars = Record<string, string | number>

export const dictionaries: Record<Lang, Record<MessageKey, string>> = { id, en }

const STORAGE_KEY = 'cb.lang'

export function translate(lang: Lang, key: MessageKey, vars?: Vars): string {
  const template = dictionaries[lang][key] ?? dictionaries.id[key] ?? key
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}

function readSavedLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'id' || saved === 'en') return saved
  } catch {
    // Storage can be blocked (private mode); fall back to the default.
  }
  return 'id'
}

export interface I18nValue {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (key: MessageKey, vars?: Vars) => string
}

export const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children, initialLang }: { children: ReactNode; initialLang?: Lang }) {
  const [lang, setLangState] = useState<Lang>(() => initialLang ?? readSavedLang())

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Not persisted; the choice still applies for this session.
    }
  }, [])

  const value = useMemo<I18nValue>(
    () => ({ lang, setLang, t: (key, vars) => translate(lang, key, vars) }),
    [lang, setLang],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
