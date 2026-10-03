import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '../i18n/I18nProvider'
import App from '../App'
import { addRecipe } from '../lib/recipes'
import { FakeAudioContext, installFakeAudio, removeFakeAudio } from '../test/fakeAudio'

function renderAt(path: string) {
  return render(
    <I18nProvider initialLang="id">
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </I18nProvider>,
  )
}

describe('onboarding', () => {
  it('shows three slides on first launch, then lands on home and never again', async () => {
    localStorage.removeItem('cb.onboarded')
    const user = userEvent.setup()
    const { unmount } = renderAt('/')
    expect(screen.getByRole('heading', { name: 'Takaran pas, tanpa hitung manual' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Lanjut' }))
    expect(screen.getByRole('heading', { name: 'Timer yang memandu tiap tuangan' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Lanjut' }))
    expect(screen.queryByRole('button', { name: 'Lewati' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Mulai' }))
    expect(screen.getByRole('heading', { name: 'Mau seduh apa hari ini?' })).toBeInTheDocument()

    unmount()
    renderAt('/')
    expect(screen.getByRole('heading', { name: 'Mau seduh apa hari ini?' })).toBeInTheDocument()
  })

  it('can be skipped', async () => {
    localStorage.removeItem('cb.onboarded')
    const user = userEvent.setup()
    renderAt('/')
    await user.click(screen.getByRole('button', { name: 'Lewati' }))
    expect(screen.getByRole('heading', { name: 'Mau seduh apa hari ini?' })).toBeInTheDocument()
  })

  it('can be reopened from Settings', async () => {
    const user = userEvent.setup()
    renderAt('/pengaturan')
    await user.click(screen.getByRole('link', { name: 'Lihat pengenalan lagi' }))
    expect(screen.getByRole('heading', { name: 'Takaran pas, tanpa hitung manual' })).toBeInTheDocument()
  })
})

describe('settings', () => {
  it('switches the app language', async () => {
    const user = userEvent.setup()
    renderAt('/pengaturan')
    await user.click(within(screen.getByRole('group', { name: 'Bahasa' })).getByRole('button', { name: 'English' }))
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
  })

  it('applies the dark theme to the page and remembers it', async () => {
    const user = userEvent.setup()
    renderAt('/pengaturan')
    await user.click(screen.getByRole('button', { name: 'Gelap' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem('cb.theme')).toBe('"dark"')
    await user.click(screen.getByRole('button', { name: 'Ikuti HP' }))
    expect(document.documentElement.dataset.theme).toBeUndefined()
  })

  it('switches units everywhere: calculator, schedule and saved recipes', async () => {
    await addRecipe({ methodId: 'v60', name: 'Pagi', coffee: 15, ratio: 16, style: 'standard', bean: '', roastery: '', notes: '', rating: 0 })
    const user = userEvent.setup()
    const { unmount } = renderAt('/pengaturan')
    await user.click(within(screen.getByRole('group', { name: 'Berat' })).getByRole('button', { name: 'oz' }))
    await user.click(within(screen.getByRole('group', { name: 'Volume' })).getByRole('button', { name: 'fl oz' }))
    await user.click(within(screen.getByRole('group', { name: 'Suhu' })).getByRole('button', { name: '°F' }))
    unmount()

    renderAt('/seduh/v60?kopi=15&rasio=16')
    expect(screen.getByRole('textbox', { name: /Kopi \(oz\)/ })).toHaveValue('0.53')
    expect(screen.getByText('8.1')).toBeInTheDocument()
    // Bean picker and temperature card.
    expect(screen.getAllByText('199°F')).toHaveLength(2)
    expect(screen.getByText('8.47 oz')).toBeInTheDocument()
    unmount()

    renderAt('/resep')
    expect(await screen.findByRole('link', { name: /^Pagi/ })).toHaveTextContent('0.53 oz · 8.1 fl oz · 1:16')
  })

  it('typing ounces still calculates in grams underneath', async () => {
    localStorage.setItem('cb.units', JSON.stringify({ weight: 'oz', volume: 'ml', temp: 'c' }))
    const user = userEvent.setup()
    renderAt('/seduh/v60')
    await user.click(screen.getByRole('button', { name: 'Eksperimen' }))
    const coffee = screen.getByRole('textbox', { name: /Kopi \(oz\)/ })
    await user.clear(coffee)
    await user.type(coffee, '1')
    // 1 oz = 28.35 g → 28.3 g × 16 = 453 ml
    expect(screen.getByText('453')).toBeInTheDocument()
  })

  it('remembers the default grinder for the calculator', async () => {
    const user = userEvent.setup()
    const { unmount } = renderAt('/pengaturan')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Grinder default' }), 'k6')
    unmount()
    renderAt('/seduh/v60')
    expect(screen.getByTestId('clicks')).toHaveTextContent('90–120 klik')
  })

  it('toggles timer switches', async () => {
    const user = userEvent.setup()
    renderAt('/pengaturan')
    const awake = screen.getByRole('switch', { name: 'Layar tetap menyala' })
    expect(awake).toHaveAttribute('aria-checked', 'true')
    await user.click(awake)
    expect(awake).toHaveAttribute('aria-checked', 'false')
    expect(localStorage.getItem('cb.keepAwake')).toBe('false')
  })

  it('plays a test sound so the volume can be checked', async () => {
    installFakeAudio()
    const user = userEvent.setup()
    renderAt('/pengaturan')
    await user.click(screen.getByRole('button', { name: 'Coba bunyi' }))
    expect(FakeAudioContext.instances[0]!.oscillators).toHaveLength(1)
    removeFakeAudio()
  })

  it('offers in-app feedback instead of a link out to Google Forms', () => {
    renderAt('/pengaturan')
    expect(screen.getByRole('button', { name: 'Kirim masukan' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('link', { name: 'Kirim masukan' })).not.toBeInTheDocument()
  })

  it('shows the app version', () => {
    renderAt('/pengaturan')
    expect(screen.getByText(/Versi 0\.9\.0/)).toBeInTheDocument()
  })
})
