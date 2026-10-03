import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { db } from '../lib/recipes'

// Tests start past the first-run intro unless they clear this themselves.
beforeEach(() => {
  localStorage.setItem('cb.onboarded', 'true')
})

afterEach(async () => {
  cleanup()
  localStorage.clear()
  await db.recipes.clear()
})
