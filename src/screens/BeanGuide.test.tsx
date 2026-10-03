import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '../i18n/I18nProvider'
import App from '../App'
import { beanTempRange, PROCESSES, ROASTS, SPECIES } from '../data/beans'

function renderAt(path: string) {
  return render(
    <I18nProvider initialLang="id">
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </I18nProvider>,
  )
}

const tempOf = (name: string) => {
  const card = screen.getByRole('heading', { name }).closest('div')!.parentElement!
  return within(card).getByText(/°/).textContent
}

describe('bean guide', () => {
  it('opens from the bottom nav', async () => {
    const user = userEvent.setup()
    renderAt('/')
    await user.click(screen.getByRole('link', { name: 'Beans' }))
    expect(screen.getByRole('heading', { name: 'Panduan beans' })).toBeInTheDocument()
  })

  it('lists species and processes with a temperature for the chosen roast', async () => {
    const user = userEvent.setup()
    renderAt('/beans')
    expect(tempOf('Arabika')).toBe('91°C–93°C')
    expect(tempOf('Robusta')).toBe('88°C–90°C')
    expect(tempOf('Giling basah (wet-hulled)')).toBe('90°C–92°C')

    await user.click(screen.getByRole('button', { name: 'Light' }))
    expect(tempOf('Washed (full wash)')).toBe('93°C–95°C')
    expect(tempOf('Anaerob')).toBe('91°C–93°C')
    expect(localStorage.getItem('cb.roast')).toBe('"light"')
  })

  it('follows the temperature unit setting', () => {
    localStorage.setItem('cb.units', JSON.stringify({ weight: 'g', volume: 'ml', temp: 'f' }))
    renderAt('/beans')
    expect(tempOf('Arabika')).toBe('196°F–199°F')
  })
})

describe('bean data', () => {
  it('keeps every suggestion in a sane hot-brew range', () => {
    for (const r of ROASTS) {
      for (const b of [...SPECIES, ...PROCESSES]) {
        const [min, max] = beanTempRange(r.id, b.offset)
        expect(min).toBeGreaterThanOrEqual(82)
        expect(max).toBeLessThanOrEqual(96)
        expect(max).toBeGreaterThan(min)
      }
    }
  })

  it('goes cooler as the roast gets darker', () => {
    const centres = ROASTS.map((r) => r.centreC)
    expect([...centres].sort((a, b) => b - a)).toEqual(centres)
  })
})
