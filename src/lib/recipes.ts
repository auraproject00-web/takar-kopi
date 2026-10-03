import Dexie, { type EntityTable } from 'dexie'
import { findMethod, type MethodId } from '../data/methods'
import { cleanBean, type BeanChoice } from '../data/beans'
import type { PourStyle } from './brew'

export interface Recipe {
  id: string
  methodId: MethodId
  name: string
  /** Grams of coffee (espresso: the dose). */
  coffee: number
  ratio: number
  style: PourStyle
  bean: string
  roastery: string
  /** Species, process and roast picked when brewing (older recipes have none). */
  beanChoice?: BeanChoice
  notes: string
  /** 0 = not rated, otherwise 1–5. */
  rating: number
  createdAt: number
  updatedAt: number
}

export type RecipeInput = Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>

class CoffeeDb extends Dexie {
  recipes!: EntityTable<Recipe, 'id'>

  constructor() {
    super('coffee-brewing')
    // Indexed fields only; everything else is stored as-is.
    this.version(1).stores({ recipes: 'id, methodId, updatedAt' })
  }
}

export const db = new CoffeeDb()

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export async function addRecipe(input: RecipeInput): Promise<Recipe> {
  const now = Date.now()
  const recipe: Recipe = { ...input, id: newId(), createdAt: now, updatedAt: now }
  await db.recipes.add(recipe)
  return recipe
}

export async function updateRecipe(id: string, input: RecipeInput): Promise<void> {
  await db.recipes.update(id, { ...input, updatedAt: Date.now() })
}

export async function deleteRecipe(id: string): Promise<void> {
  await db.recipes.delete(id)
}

export function getRecipe(id: string): Promise<Recipe | undefined> {
  return db.recipes.get(id)
}

/** Newest first. */
export function listRecipes(): Promise<Recipe[]> {
  return db.recipes.orderBy('updatedAt').reverse().toArray()
}

/** Case-insensitive match on name, bean, roastery and notes. */
export function matchesSearch(recipe: Recipe, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [recipe.name, recipe.bean, recipe.roastery, recipe.notes].some((field) => field.toLowerCase().includes(q))
}

// --- Backup -----------------------------------------------------------------

const BACKUP_FORMAT = 'coffee-brewing-backup'
const BACKUP_VERSION = 1

export interface Backup {
  format: typeof BACKUP_FORMAT
  version: number
  exportedAt: string
  recipes: Recipe[]
}

export async function exportBackup(): Promise<Backup> {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    recipes: await listRecipes(),
  }
}

const str = (v: unknown, max = 500): string => (typeof v === 'string' ? v.slice(0, max) : '')

/** Returns a clean recipe, or null when the entry cannot be used. */
export function sanitizeRecipe(raw: unknown): Recipe | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const method = findMethod(typeof r.methodId === 'string' ? r.methodId : undefined)
  const coffee = Number(r.coffee)
  const ratio = Number(r.ratio)
  if (!method || !(coffee > 0) || !(ratio > 0) || typeof r.id !== 'string' || r.id === '') return null
  const now = Date.now()
  const time = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : now)
  const rating = Math.round(Number(r.rating))
  const beanChoice = cleanBean(r.beanChoice)
  return {
    id: r.id.slice(0, 100),
    methodId: method.id,
    name: str(r.name, 100),
    coffee,
    ratio,
    style: r.style === '46' ? '46' : 'standard',
    bean: str(r.bean, 100),
    roastery: str(r.roastery, 100),
    notes: str(r.notes, 2000),
    rating: rating >= 1 && rating <= 5 ? rating : 0,
    createdAt: time(r.createdAt),
    updatedAt: time(r.updatedAt),
    ...(beanChoice ? { beanChoice } : {}),
  }
}

export class BackupError extends Error {}

/**
 * Adds or replaces recipes from a backup file's text. Existing recipes not in
 * the file are kept. Returns how many recipes were imported.
 */
export async function importBackup(text: string): Promise<number> {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new BackupError('not-json')
  }
  const backup = data as Partial<Backup> | null
  if (!backup || backup.format !== BACKUP_FORMAT || !Array.isArray(backup.recipes)) {
    throw new BackupError('wrong-format')
  }
  const recipes = backup.recipes.map(sanitizeRecipe).filter((r): r is Recipe => r !== null)
  await db.recipes.bulkPut(recipes)
  return recipes.length
}
