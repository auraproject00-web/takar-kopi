import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { findMethod, METHODS, type MethodId } from '../data/methods'
import type { MessageKey } from '../i18n/I18nProvider'
import { useI18n } from '../i18n/useI18n'
import { useUnitFormat } from '../lib/units'
import { BackupError, deleteRecipe, exportBackup, importBackup, listRecipes, matchesSearch } from '../lib/recipes'
import { brewLink, brewSummary } from '../lib/recipeView'
import { Card, Screen, SectionLabel } from '../components/layout'
import { LangToggle } from '../components/LangToggle'
import { Stars } from '../components/Stars'

type Filter = MethodId | 'all'

export default function RecipeList() {
  const { t } = useI18n()
  const u = useUnitFormat()
  const location = useLocation()
  const recipes = useLiveQuery(listRecipes)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [message, setMessage] = useState<string>(() => {
    const flash = (location.state as { flash?: MessageKey } | null)?.flash
    return flash ? t(flash) : ''
  })
  const fileInput = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  // The "saved" message is one-shot: drop it from history so a reload does not show it again.
  useEffect(() => {
    if (location.state) navigate(location.pathname, { replace: true, state: null })
  }, [location.state, location.pathname, navigate])

  const usedMethods = METHODS.filter((m) => recipes?.some((r) => r.methodId === m.id))
  const activeFilter = usedMethods.some((m) => m.id === filter) ? filter : 'all'
  const shown = (recipes ?? []).filter(
    (r) => (activeFilter === 'all' || r.methodId === activeFilter) && matchesSearch(r, query),
  )

  async function remove(id: string, name: string) {
    if (!window.confirm(t('recipes.deleteConfirm', { name }))) return
    await deleteRecipe(id)
    setMessage(t('recipes.deleted'))
  }

  async function exportFile() {
    const backup = await exportBackup()
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `coffee-brewing-${backup.exportedAt.slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMessage(t('recipes.exported'))
  }

  async function importFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const n = await importBackup(await file.text())
      setMessage(t('recipes.imported', { n }))
    } catch (err) {
      if (!(err instanceof BackupError)) console.error(err)
      setMessage(t('error.importFailed'))
    }
  }

  const chipClass = (on: boolean) =>
    `h-9 shrink-0 rounded-full px-3.5 text-[13px] font-semibold whitespace-nowrap ${
      on ? 'bg-inverse text-on-inverse' : 'border border-field bg-surface text-ink'
    }`

  return (
    <Screen nav>
      <header className="flex items-center justify-between gap-3 px-5 pt-7 pb-2">
        <h1 className="m-0 font-display text-[28px] font-bold">{t('recipes.title')}</h1>
        <LangToggle />
      </header>

      <div className="flex flex-col gap-3.5 px-5 pt-2">
        <p role="status" className={`m-0 rounded-xl bg-track px-3.5 py-2.5 text-sm font-semibold ${message ? '' : 'sr-only'}`}>
          {message}
        </p>

        {recipes && recipes.length > 0 && (
          <>
            <label className="flex h-12 items-center gap-2.5 rounded-xl border border-field bg-surface px-3.5 text-muted">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-4-4" />
              </svg>
              <span className="sr-only">{t('recipes.search')}</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('recipes.search')}
                className="min-w-0 flex-1 border-0 bg-transparent text-base text-ink outline-none"
              />
            </label>
            {usedMethods.length > 1 && (
              <div role="group" aria-label={t('recipes.filter')} className="-mx-5 flex gap-2 overflow-x-auto px-5">
                <button type="button" aria-pressed={activeFilter === 'all'} onClick={() => setFilter('all')} className={chipClass(activeFilter === 'all')}>
                  {t('recipes.all')}
                </button>
                {usedMethods.map((m) => (
                  <button key={m.id} type="button" aria-pressed={activeFilter === m.id} onClick={() => setFilter(m.id)} className={chipClass(activeFilter === m.id)}>
                    {t(m.nameKey)}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {recipes && recipes.length === 0 && (
          <Card className="flex flex-col gap-1 p-5">
            <p className="m-0 font-semibold">{t('recipes.empty.title')}</p>
            <p className="m-0 text-sm text-muted">{t('recipes.empty.body')}</p>
            <Link to="/" className="mt-2 flex min-h-11 items-center font-semibold text-accent">
              {t('method.select.title')}
            </Link>
          </Card>
        )}

        {recipes && recipes.length > 0 && shown.length === 0 && <p className="m-0 text-sm text-muted">{t('recipes.noMatch')}</p>}

        <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
          {shown.map((r) => {
            const method = findMethod(r.methodId)
            return (
              <li key={r.id}>
                <Card className="flex flex-col">
                  <Link to={brewLink(r)} className="flex flex-col gap-2 px-4 pt-3.5 pb-2 text-ink no-underline">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="text-base font-semibold">{r.name}</span>
                      <span className="shrink-0 text-xs font-semibold tracking-wide text-muted uppercase">
                        {method && t(method.nameKey)}
                      </span>
                    </span>
                    <span className="font-mono text-[13px] text-muted">{brewSummary(r, u)}</span>
                    {(r.bean || r.roastery || r.rating > 0) && (
                      <span className="flex items-center justify-between gap-2 text-[13px] text-muted">
                        <span>{[r.bean, r.roastery].filter(Boolean).join(' · ')}</span>
                        <Stars value={r.rating} />
                      </span>
                    )}
                    {r.notes && <span className="line-clamp-2 text-[13px] text-muted">{r.notes}</span>}
                  </Link>
                  <div className="flex justify-end gap-1 border-t border-line-soft px-2">
                    <Link
                      to={`/resep/${r.id}/ubah`}
                      aria-label={`${t('common.edit')} ${r.name}`}
                      className="flex min-h-11 items-center px-3 text-sm font-semibold text-accent"
                    >
                      {t('common.edit')}
                    </Link>
                    <button
                      type="button"
                      aria-label={`${t('common.delete')} ${r.name}`}
                      onClick={() => void remove(r.id, r.name)}
                      className="min-h-11 px-3 text-sm font-semibold text-muted"
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                </Card>
              </li>
            )
          })}
        </ul>

        <section className="flex flex-col gap-2 pt-2">
          <SectionLabel>{t('recipes.backup')}</SectionLabel>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => void exportFile()}
              disabled={!recipes || recipes.length === 0}
              className="h-12 rounded-xl border border-field bg-surface text-sm font-semibold text-ink disabled:opacity-50"
            >
              {t('settings.export')}
            </button>
            <button type="button" onClick={() => fileInput.current?.click()} className="h-12 rounded-xl border border-field bg-surface text-sm font-semibold text-ink">
              {t('settings.import')}
            </button>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            onChange={(e) => void importFile(e)}
            className="hidden"
            data-testid="import-file"
          />
          <p className="m-0 text-[13px] leading-relaxed text-muted">{t('settings.dataHint')}</p>
        </section>
      </div>
    </Screen>
  )
}
