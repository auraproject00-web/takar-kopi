import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { db } from '../lib/recipes'

afterEach(async () => {
  cleanup()
  localStorage.clear()
  await db.recipes.clear()
})
