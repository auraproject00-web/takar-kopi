import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from './i18n/I18nProvider'
import App from './App'

function renderAt(path: string) {
  return render(
    <I18nProvider initialLang="id">
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </I18nProvider>,
  )
}

describe('app', () => {
  it('lists all methods and opens the calculator', async () => {
    const user = userEvent.setup()
    renderAt('/')
    expect(screen.getByRole('heading', { name: 'Mau seduh apa hari ini?' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(9)
    await user.click(screen.getByRole('link', { name: /V60/ }))
    expect(screen.getByRole('heading', { name: 'V60' })).toBeInTheDocument()
  })

  it('switches the whole UI to English and remembers it', async () => {
    const user = userEvent.setup()
    renderAt('/')
    await user.click(screen.getByRole('button', { name: 'EN' }))
    expect(screen.getByRole('heading', { name: 'What are we brewing today?' })).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
    expect(localStorage.getItem('cb.lang')).toBe('en')
  })

  it('recalculates water as coffee is typed', async () => {
    const user = userEvent.setup()
    renderAt('/seduh/v60')
    await user.click(screen.getByRole('button', { name: 'Eksperimen' }))
    const coffee = screen.getByRole('textbox', { name: /Kopi/ })
    expect(screen.getByText('240')).toBeInTheDocument()
    await user.clear(coffee)
    await user.type(coffee, '20')
    expect(screen.getByText('320')).toBeInTheDocument()
  })

  it('calculates coffee from water after switching the input side', async () => {
    const user = userEvent.setup()
    renderAt('/seduh/v60')
    await user.click(screen.getByRole('button', { name: 'Eksperimen' }))
    await user.click(screen.getByRole('button', { name: 'Air' }))
    const water = screen.getByRole('textbox', { name: /Air/ })
    expect(water).toHaveValue('240')
    await user.clear(water)
    await user.type(water, '300')
    expect(screen.getByText('18.8')).toBeInTheDocument()
  })

  it('shows hot water and ice for Japanese iced', () => {
    renderAt('/seduh/japaneseIced?kopi=20&rasio=15')
    expect(screen.getByText('180 ml')).toBeInTheDocument()
    expect(screen.getByText('120 g')).toBeInTheDocument()
  })

  it('shows grinder clicks for the method and remembers the grinder', async () => {
    const user = userEvent.setup()
    renderAt('/seduh/v60')
    expect(screen.getByTestId('clicks')).toHaveTextContent('20–28 klik')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Grinder manual' }), 'jx')
    expect(screen.getByTestId('clicks')).toHaveTextContent('80–105 klik')
    expect(screen.getByText(/2\.0\.0 – 2\.6\.1/)).toBeInTheDocument()
    expect(localStorage.getItem('cb.grinder')).toBe('"jx"')
  })

  it('lets you type your own clicks for an unlisted grinder', async () => {
    const user = userEvent.setup()
    renderAt('/seduh/v60')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Grinder manual' }), 'custom')
    await user.type(screen.getByRole('textbox', { name: /Klik favoritmu/ }), '18')
    expect(JSON.parse(localStorage.getItem('cb.customClicks')!)).toEqual({ v60: '18' })
  })

  it('redirects unknown methods home', () => {
    renderAt('/seduh/teh-tarik')
    expect(screen.getByRole('heading', { name: 'Mau seduh apa hari ini?' })).toBeInTheDocument()
  })

  it('shows the grind guide table for the chosen grinder', async () => {
    const user = userEvent.setup()
    renderAt('/gilingan?metode=chemex')
    expect(screen.getAllByRole('row')).toHaveLength(10)
    await user.click(screen.getByRole('button', { name: 'Hario Skerton' }))
    expect(screen.getByRole('row', { name: /Chemex/ })).toHaveTextContent('9–11')
  })
})

describe('guided mode (Takaran)', () => {
  it('opens by default and sets the dose from cup size, cups and strength', async () => {
    const user = userEvent.setup()
    renderAt('/seduh/v60')
    expect(screen.getByRole('button', { name: 'Takaran' })).toHaveAttribute('aria-pressed', 'true')
    // No typing in guided mode: the numbers are shown, not edited.
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('slider')).not.toBeInTheDocument()

    // Default: one medium cup (250 ml) at normal 1:16 → 15.6 g
    expect(screen.getByText('15.6')).toBeInTheDocument()
    expect(screen.getByText('250')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Besar/ }))
    await user.click(screen.getByRole('button', { name: 'Tambah gelas' }))
    // Two large cups: 700 ml at 1:16 → 43.8 g
    expect(screen.getByText('700')).toBeInTheDocument()
    expect(screen.getByText('43.8')).toBeInTheDocument()
    expect(screen.getByText('Untuk 2 × 350 ml')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Pekat/ }))
    // Strong is 1:15 → 46.7 g for the same 700 ml
    expect(screen.getByText('46.7')).toBeInTheDocument()
  })

  it('caps the cup counter for the method', async () => {
    const user = userEvent.setup()
    renderAt('/seduh/v60')
    const more = screen.getByRole('button', { name: 'Tambah gelas' })
    await user.click(more)
    await user.click(more)
    expect(more).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Kurangi gelas' })).toBeEnabled()
  })

  it('has no cup counter where one brew makes one cup (AeroPress, espresso)', () => {
    renderAt('/seduh/espresso')
    expect(screen.queryByRole('button', { name: 'Tambah gelas' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Double/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('36')).toBeInTheDocument()
  })

  it('remembers the last tab used', async () => {
    const user = userEvent.setup()
    const { unmount } = renderAt('/seduh/v60')
    await user.click(screen.getByRole('button', { name: 'Eksperimen' }))
    unmount()
    renderAt('/seduh/chemex')
    expect(screen.getByRole('button', { name: 'Eksperimen' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('textbox', { name: /Kopi/ })).toBeInTheDocument()
  })

  it('opens saved recipes with exact numbers in Eksperimen, without changing the remembered tab', () => {
    renderAt('/seduh/v60?kopi=18&rasio=15')
    expect(screen.getByRole('textbox', { name: /Kopi/ })).toHaveValue('18')
    expect(localStorage.getItem('cb.calcMode')).toBeNull()
  })

  it('round-trips the guided choice through the timer', async () => {
    const user = userEvent.setup()
    renderAt('/seduh/v60')
    await user.click(screen.getByRole('button', { name: /Kecil/ }))
    await user.click(screen.getByRole('button', { name: /Ringan/ }))
    await user.click(screen.getByRole('link', { name: 'Mulai seduh' }))
    // 150 ml at 1:17 → 8.8 g
    expect(screen.getByText(/8.8 g · 150 ml/)).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Kembali ke kalkulator' }))
    expect(screen.getByRole('button', { name: /Kecil/ })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /Ringan/ })).toHaveAttribute('aria-pressed', 'true')
  })
})
