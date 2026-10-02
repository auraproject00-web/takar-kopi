import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '../i18n/I18nProvider'
import App from '../App'

function renderAt(path: string) {
  return render(
    <I18nProvider initialLang="id">
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </I18nProvider>,
  )
}

const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms))
const currentStep = () => screen.getAllByRole('listitem').find((li) => li.getAttribute('aria-current') === 'step')

describe('brew timer', () => {
  let vibrate: ReturnType<typeof vi.fn>

  beforeEach(() => {
    // Only the tick and the clock: faking setTimeout would stall Testing Library's async helpers.
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'performance'] })
    vibrate = vi.fn()
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const setup = () => userEvent.setup()

  it('walks through the V60 steps with scale targets', async () => {
    const user = setup()
    renderAt('/seduh/v60/timer?kopi=15&rasio=16')
    expect(screen.getByText(/tara ke 0/)).toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveTextContent('0:00')

    await user.click(screen.getByRole('button', { name: 'Mulai' }))
    expect(within(currentStep()!).getByText('Bloom')).toBeInTheDocument()
    expect(screen.getByText('Tuang sampai 45 g')).toBeInTheDocument()

    advance(46_000)
    expect(screen.getByRole('timer')).toHaveTextContent('0:46')
    expect(within(currentStep()!).getByText('Tuang 1')).toBeInTheDocument()
    expect(screen.getByText('Tuang sampai 110 g')).toBeInTheDocument()
    expect(vibrate).toHaveBeenCalledTimes(1)
  })

  it('pauses without losing time, and skips ahead', async () => {
    const user = setup()
    renderAt('/seduh/v60/timer?kopi=15&rasio=16')
    await user.click(screen.getByRole('button', { name: 'Mulai' }))
    advance(10_000)
    await user.click(screen.getByRole('button', { name: 'Jeda' }))
    advance(60_000)
    expect(screen.getByRole('timer')).toHaveTextContent('0:10')

    await user.click(screen.getByRole('button', { name: 'Lanjut' }))
    await user.click(screen.getByRole('button', { name: 'Langkah berikut' }))
    expect(screen.getByRole('timer')).toHaveTextContent('0:45')
    expect(within(currentStep()!).getByText('Tuang 1')).toBeInTheDocument()
  })

  it('finishes, then can restart', async () => {
    const user = setup()
    renderAt('/seduh/v60/timer?kopi=15&rasio=16')
    await user.click(screen.getByRole('button', { name: 'Mulai' }))
    advance(181_000)
    expect(screen.getByText('Kopi siap. Selamat menikmati!')).toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveTextContent('3:00')
    await user.click(screen.getByRole('button', { name: 'Ulang dari awal' }))
    expect(screen.getByRole('timer')).toHaveTextContent('0:00')
    expect(screen.getByRole('button', { name: 'Mulai' })).toBeInTheDocument()
  })

  it('respects the vibrate toggle', async () => {
    const user = setup()
    renderAt('/seduh/v60/timer?kopi=15&rasio=16')
    await user.click(screen.getByRole('button', { name: 'Getar' }))
    expect(screen.getByRole('button', { name: 'Getar' })).toHaveAttribute('aria-pressed', 'false')
    await user.click(screen.getByRole('button', { name: 'Mulai' }))
    advance(50_000)
    expect(vibrate).not.toHaveBeenCalled()
    expect(localStorage.getItem('cb.vibrate')).toBe('false')
  })

  it('hides the vibrate toggle where the phone cannot vibrate (iPhone before iOS 18)', () => {
    Reflect.deleteProperty(navigator, 'vibrate')
    renderAt('/seduh/v60/timer?kopi=15&rasio=16')
    expect(screen.queryByRole('button', { name: 'Getar' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bunyi' })).toBeInTheDocument()
  })

  it('runs the 4:6 recipe with five pours ending at 3:30', async () => {
    const user = setup()
    renderAt('/seduh/v60/timer?kopi=20&rasio=15&gaya=46')
    expect(screen.getAllByRole('listitem')).toHaveLength(5)
    expect(screen.getByText('3:30')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Mulai' }))
    advance(91_000)
    expect(screen.getByText('Tuang sampai 180 g')).toBeInTheDocument()
  })

  it('sends methods without a schedule back to the calculator', () => {
    renderAt('/seduh/espresso/timer?kopi=18&rasio=2')
    expect(screen.getByRole('heading', { name: 'Espresso' })).toBeInTheDocument()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
  })
})

describe('calculator ↔ timer', () => {
  it('opens the timer with the calculated amounts', async () => {
    const user = userEvent.setup()
    renderAt('/seduh/v60')
    const coffee = screen.getByRole('textbox', { name: /Kopi/ })
    await user.clear(coffee)
    await user.type(coffee, '18')
    await user.click(screen.getByRole('link', { name: 'Mulai seduh' }))
    expect(screen.getByRole('timer')).toBeInTheDocument()
    expect(screen.getByText(/18 g · 288 ml/)).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Kembali ke kalkulator' }))
    expect(screen.getByRole('textbox', { name: /Kopi/ })).toHaveValue('18')
  })

  it('switches V60 to the 4:6 method at 1:15', async () => {
    const user = userEvent.setup()
    renderAt('/seduh/v60?kopi=20')
    await user.click(screen.getByRole('button', { name: '4:6 (Tetsu Kasuya)' }))
    expect(screen.getByText('1:15')).toBeInTheDocument()
    expect(screen.getByText('300')).toBeInTheDocument()
    expect(screen.getByText('Tuang 5')).toBeInTheDocument()
  })

  it('offers no timer for espresso', () => {
    renderAt('/seduh/espresso')
    expect(screen.queryByRole('link', { name: 'Mulai seduh' })).not.toBeInTheDocument()
  })
})
