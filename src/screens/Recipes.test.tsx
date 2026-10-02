import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '../i18n/I18nProvider'
import App from '../App'
import { addRecipe, db, type RecipeInput } from '../lib/recipes'

function renderAt(path: string) {
  return render(
    <I18nProvider initialLang="id">
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </I18nProvider>,
  )
}

const base: RecipeInput = {
  methodId: 'v60',
  name: 'V60 pagi',
  coffee: 15,
  ratio: 16,
  style: 'standard',
  bean: 'Gayo natural',
  roastery: '',
  notes: '',
  rating: 4,
}

afterEach(() => vi.restoreAllMocks())

describe('saving recipes', () => {
  it('saves from the calculator with its numbers and shows it in the list', async () => {
    const user = userEvent.setup()
    renderAt('/seduh/v60?kopi=18&rasio=15')
    await user.click(screen.getByRole('link', { name: 'Simpan sebagai resep' }))

    expect(screen.getByRole('heading', { name: 'Simpan resep' })).toBeInTheDocument()
    expect(screen.getByText('18 g')).toBeInTheDocument()
    expect(screen.getByText('270 ml')).toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: 'Nama resep' }), 'V60 sore')
    await user.type(screen.getByRole('textbox', { name: 'Biji kopi' }), 'Kintamani')
    await user.click(screen.getByRole('button', { name: 'Beri 5 bintang' }))
    await user.click(screen.getByRole('button', { name: 'Simpan' }))

    expect(await screen.findByText('Resep tersimpan')).toBeInTheDocument()
    const card = await screen.findByRole('link', { name: /^V60 sore/ })
    expect(card).toHaveTextContent('18 g · 270 ml · 1:15')
    expect(card).toHaveTextContent('Kintamani')
    expect(card).toHaveAttribute('href', '/seduh/v60?kopi=18&rasio=15')
    expect(await db.recipes.count()).toBe(1)
  })

  it('names an unnamed recipe after its method', async () => {
    const user = userEvent.setup()
    renderAt('/resep/baru?metode=chemex&kopi=30&rasio=16')
    await user.click(screen.getByRole('button', { name: 'Simpan' }))
    expect(await screen.findByRole('link', { name: /^Chemex/ })).toHaveTextContent('30 g · 480 ml')
  })

  it('offers saving when the timer finishes', async () => {
    renderAt('/seduh/v60/timer?kopi=15&rasio=16')
    expect(screen.queryByRole('link', { name: 'Selesai & simpan resep' })).not.toBeInTheDocument()
  })
})

describe('recipe list', () => {
  it('shows an empty state', async () => {
    renderAt('/resep')
    expect(await screen.findByText('Belum ada resep')).toBeInTheDocument()
  })

  it('searches and filters by method', async () => {
    await addRecipe(base)
    await addRecipe({ ...base, methodId: 'espresso', name: 'Shot harian', coffee: 18, ratio: 2, bean: 'Toraja' })
    const user = userEvent.setup()
    renderAt('/resep')
    expect(await screen.findByRole('link', { name: /^Shot harian/ })).toHaveTextContent('18 g → 36 g · 1:2')

    await user.type(screen.getByRole('searchbox'), 'gayo')
    expect(screen.queryByRole('link', { name: /^Shot harian/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^V60 pagi/ })).toBeInTheDocument()

    await user.clear(screen.getByRole('searchbox'))
    await user.click(within(screen.getByRole('group', { name: 'Filter metode' })).getByRole('button', { name: 'Espresso' }))
    expect(screen.queryByRole('link', { name: /^V60 pagi/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^Shot harian/ })).toBeInTheDocument()
  })

  it('edits a recipe', async () => {
    await addRecipe(base)
    const user = userEvent.setup()
    renderAt('/resep')
    await user.click(await screen.findByRole('link', { name: 'Ubah V60 pagi' }))
    const name = await screen.findByRole('textbox', { name: 'Nama resep' })
    expect(name).toHaveValue('V60 pagi')
    await user.clear(name)
    await user.type(name, 'V60 baru')
    await user.click(screen.getByRole('button', { name: 'Simpan' }))
    expect(await screen.findByRole('link', { name: /^V60 baru/ })).toBeInTheDocument()
    expect(await db.recipes.count()).toBe(1)
  })

  it('deletes only after confirming', async () => {
    await addRecipe(base)
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    const user = userEvent.setup()
    renderAt('/resep')
    const del = await screen.findByRole('button', { name: 'Hapus V60 pagi' })
    await user.click(del)
    expect(await db.recipes.count()).toBe(1)
    await user.click(del)
    expect(confirm).toHaveBeenLastCalledWith('Hapus resep "V60 pagi"? Ini tidak bisa dibatalkan.')
    await waitFor(async () => expect(await db.recipes.count()).toBe(0))
    expect(await screen.findByText('Resep dihapus.')).toBeInTheDocument()
  })

  it('imports a backup file and rejects junk', async () => {
    const user = userEvent.setup()
    renderAt('/resep')
    const input = await screen.findByTestId('import-file')
    const backup = {
      format: 'coffee-brewing-backup',
      version: 1,
      exportedAt: '2026-10-02T00:00:00Z',
      recipes: [{ ...base, id: 'a', createdAt: 1, updatedAt: 1 }],
    }
    await user.upload(input, new File([JSON.stringify(backup)], 'b.json', { type: 'application/json' }))
    expect(await screen.findByText('1 resep berhasil diimpor.')).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /^V60 pagi/ })).toBeInTheDocument()

    await user.upload(input, new File(['hello'], 'x.json', { type: 'application/json' }))
    expect(await screen.findByText('File cadangan tidak bisa dibaca')).toBeInTheDocument()
  })

  it('shows a not-found message for a missing recipe', async () => {
    renderAt('/resep/tidak-ada/ubah')
    expect(await screen.findByRole('heading', { name: 'Resep tidak ditemukan' })).toBeInTheDocument()
  })
})

describe('home', () => {
  it('shows the most recent recipe to brew again', async () => {
    await addRecipe({ ...base, name: 'Lama' })
    await new Promise((r) => setTimeout(r, 5))
    await addRecipe({ ...base, name: 'Terbaru', coffee: 20 })
    renderAt('/')
    const card = await screen.findByRole('link', { name: /Seduh lagi/ })
    expect(card).toHaveTextContent('Terbaru')
    expect(card).toHaveAttribute('href', '/seduh/v60?kopi=20&rasio=16')
  })
})
