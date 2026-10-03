import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { BrewMethod } from '../data/methods'
import { useI18n } from '../i18n/useI18n'
import { useUnitFormat } from '../lib/units'
import { readBrewParams } from '../lib/brewParams'
import { addRecipe, updateRecipe, type Recipe, type RecipeInput } from '../lib/recipes'
import { brewLink, brewSummary } from '../lib/recipeView'
import { BackHeader, Screen } from '../components/layout'
import { brewTempC } from '../data/beans'
import { beanSummary, useBean } from '../lib/bean'
import { RatingInput } from '../components/Stars'

const fieldClass =
  'h-12 rounded-xl border border-field bg-surface px-3.5 text-base font-normal text-ink placeholder:text-faint'

/** New recipe (from calculator/timer numbers in the URL) or editing an existing one. */
export default function RecipeForm({
  method,
  search,
  existing,
}: {
  method: BrewMethod
  search: URLSearchParams
  existing?: Recipe
}) {
  const { t } = useI18n()
  const u = useUnitFormat()
  const navigate = useNavigate()
  const current = useBean()
  // New recipes take the beans picked in the calculator; edits keep their own.
  const [beanChoice] = useState(() => (existing ? existing.beanChoice : current.chosen ? current.bean : undefined))
  const [brew] = useState(() =>
    existing
      ? { coffee: existing.coffee, ratio: existing.ratio, style: existing.style }
      : readBrewParams(method, search),
  )
  const [name, setName] = useState(existing?.name ?? '')
  const [bean, setBean] = useState(existing?.bean ?? '')
  const [roastery, setRoastery] = useState(existing?.roastery ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [rating, setRating] = useState(existing?.rating ?? 0)
  const [saving, setSaving] = useState(false)

  async function save(e: FormEvent) {
    e.preventDefault()
    if (saving) return
    setSaving(true)
    const input: RecipeInput = {
      methodId: method.id,
      name: name.trim() || t(method.nameKey),
      ...brew,
      bean: bean.trim(),
      roastery: roastery.trim(),
      ...(beanChoice ? { beanChoice } : {}),
      notes: notes.trim(),
      rating,
    }
    if (existing) await updateRecipe(existing.id, input)
    else await addRecipe(input)
    navigate('/resep', { state: { flash: 'recipe.saved' } })
  }

  const chips = [t(method.nameKey), ...brewSummary({ methodId: method.id, ...brew }, u).split(' · ')]
  if (beanChoice) chips.push(beanSummary(beanChoice, t))
  const tempC = beanChoice ? brewTempC(method, beanChoice) : method.tempC
  if (tempC !== null) chips.push(u.fmtTemp(tempC))

  return (
    <Screen>
      <BackHeader to={existing ? '/resep' : brewLink({ methodId: method.id, ...brew, beanChoice })} title={existing ? t('recipe.edit.title') : t('recipe.save.title')} />
      <form onSubmit={save} className="flex flex-1 flex-col gap-3.5 px-5">
        <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          {chips.map((c, i) => (
            <li
              key={i}
              className={`rounded-full px-2.5 py-1.5 text-[13px] ${
                i === 0 ? 'bg-inverse font-semibold text-on-inverse' : 'border border-line bg-surface font-mono'
              }`}
            >
              {c}
            </li>
          ))}
        </ul>

        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          {t('recipe.name')}
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder={t('recipe.namePlaceholder')} className={fieldClass} />
        </label>
        <div className="grid grid-cols-2 gap-2.5">
          <label className="flex min-w-0 flex-col gap-1.5 text-sm font-semibold">
            {t('recipe.bean')}
            <input value={bean} onChange={(e) => setBean(e.target.value)} maxLength={100} placeholder={t('recipe.beanPlaceholder')} className={fieldClass} />
          </label>
          <label className="flex min-w-0 flex-col gap-1.5 text-sm font-semibold">
            {t('recipe.roastery')}
            <input value={roastery} onChange={(e) => setRoastery(e.target.value)} maxLength={100} placeholder={t('common.optional')} className={fieldClass} />
          </label>
        </div>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">
          {t('recipe.notes')}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            maxLength={2000}
            placeholder={t('recipe.notesPlaceholder')}
            className={`${fieldClass} h-auto resize-none py-3`}
          />
        </label>
        <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
          <legend className="p-0 text-sm font-semibold">{t('recipe.rating')}</legend>
          <RatingInput value={rating} onChange={setRating} />
        </fieldset>

        <button
          type="submit"
          disabled={saving}
          className="mt-auto h-[54px] rounded-[14px] bg-accent text-base font-semibold text-on-accent hover:bg-accent-hover disabled:opacity-60"
        >
          {t('common.save')}
        </button>
      </form>
    </Screen>
  )
}
