import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  addRecipe,
  BackupError,
  db,
  deleteRecipe,
  exportBackup,
  getRecipe,
  importBackup,
  listRecipes,
  matchesSearch,
  sanitizeRecipe,
  updateRecipe,
  type RecipeInput,
} from './recipes'

const v60: RecipeInput = {
  methodId: 'v60',
  name: 'V60 pagi',
  coffee: 15,
  ratio: 16,
  style: 'standard',
  bean: 'Gayo natural',
  roastery: 'Roastery A',
  notes: 'Manis, asam buah',
  rating: 4,
}

beforeEach(async () => {
  await db.recipes.clear()
})

describe('recipes', () => {
  it('adds, reads, updates and deletes', async () => {
    const saved = await addRecipe(v60)
    expect(saved.id).toBeTruthy()
    expect(await getRecipe(saved.id)).toMatchObject(v60)

    await updateRecipe(saved.id, { ...v60, name: 'V60 sore', rating: 5 })
    const updated = await getRecipe(saved.id)
    expect(updated).toMatchObject({ name: 'V60 sore', rating: 5, createdAt: saved.createdAt })
    expect(updated!.updatedAt).toBeGreaterThanOrEqual(saved.updatedAt)

    await deleteRecipe(saved.id)
    expect(await getRecipe(saved.id)).toBeUndefined()
  })

  it('lists newest first', async () => {
    const a = await addRecipe({ ...v60, name: 'A' })
    await db.recipes.update(a.id, { updatedAt: 1 })
    await addRecipe({ ...v60, name: 'B' })
    expect((await listRecipes()).map((r) => r.name)).toEqual(['B', 'A'])
  })

  it('searches name, bean, roastery and notes, ignoring case', async () => {
    const r = await addRecipe(v60)
    expect(matchesSearch(r, 'gayo')).toBe(true)
    expect(matchesSearch(r, 'ROASTERY a')).toBe(true)
    expect(matchesSearch(r, 'buah')).toBe(true)
    expect(matchesSearch(r, '  ')).toBe(true)
    expect(matchesSearch(r, 'kenya')).toBe(false)
  })
})

describe('backup', () => {
  it('round-trips through export and import', async () => {
    await addRecipe(v60)
    await addRecipe({ ...v60, methodId: 'espresso', name: 'Shot', coffee: 18, ratio: 2 })
    const text = JSON.stringify(await exportBackup())
    await db.recipes.clear()

    expect(await importBackup(text)).toBe(2)
    expect((await listRecipes()).map((r) => r.name).sort()).toEqual(['Shot', 'V60 pagi'])
  })

  it('replaces recipes with the same id and keeps the others', async () => {
    const kept = await addRecipe({ ...v60, name: 'Kept' })
    const changed = await addRecipe({ ...v60, name: 'Old' })
    const text = JSON.stringify({ ...(await exportBackup()), recipes: [{ ...changed, name: 'New' }] })
    expect(await importBackup(text)).toBe(1)
    expect((await getRecipe(changed.id))!.name).toBe('New')
    expect(await getRecipe(kept.id)).toBeDefined()
  })

  it('rejects files that are not backups', async () => {
    await expect(importBackup('not json')).rejects.toBeInstanceOf(BackupError)
    await expect(importBackup('{"recipes": []}')).rejects.toBeInstanceOf(BackupError)
  })

  it('skips broken entries and cleans the rest', () => {
    expect(sanitizeRecipe({ ...v60, id: 'x', methodId: 'teh-tarik' })).toBeNull()
    expect(sanitizeRecipe({ ...v60, id: 'x', coffee: -1 })).toBeNull()
    expect(sanitizeRecipe({ ...v60, id: '' })).toBeNull()
    expect(sanitizeRecipe('nope')).toBeNull()
    const clean = sanitizeRecipe({ id: 'x', methodId: 'v60', coffee: '15', ratio: 16, rating: 9, style: 'weird', name: 42 })
    expect(clean).toMatchObject({ coffee: 15, rating: 0, style: 'standard', name: '', bean: '' })
  })
})
