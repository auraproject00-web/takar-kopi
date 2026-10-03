import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '../i18n/I18nProvider'
import App from '../App'
import { beanTempRange, brewTempC, PROCESSES, ROASTS, SPECIES } from '../data/beans'
import { findMethod } from '../data/methods'
import { readBeanParam } from '../lib/bean'
import { addRecipe, listRecipes } from '../lib/recipes'

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
  })

  it('follows the temperature unit setting', () => {
    localStorage.setItem('cb.units', JSON.stringify({ weight: 'g', volume: 'ml', temp: 'f' }))
    renderAt('/beans')
    expect(tempOf('Arabika')).toBe('196°F–199°F')
  })
})

const tempCard = () => screen.getByText('Suhu').parentElement!

describe('picking beans before brewing', () => {
  it('asks for beans first, then sets the water temperature from them', async () => {
    const user = userEvent.setup()
    renderAt('/seduh/v60')
    expect(screen.getByText('Pilih beans dulu, suhu airnya kami sesuaikan.')).toBeInTheDocument()
    expect(tempCard()).toHaveTextContent('93°C')

    await user.click(within(screen.getByRole('group', { name: 'Jenis kopi' })).getByRole('button', { name: 'Robusta' }))
    await user.click(within(screen.getByRole('group', { name: 'Proses' })).getByRole('button', { name: 'Natural' }))
    await user.click(within(screen.getByRole('group', { name: 'Tingkat sangrai' })).getByRole('button', { name: 'Dark' }))
    // 93 (V60) − 4 (dark) − 3 (robusta) − 1 (natural)
    expect(screen.getByText('Suhu air:').parentElement).toHaveTextContent('85°C')
    await user.click(screen.getByRole('button', { name: 'Pakai beans ini' }))
    expect(tempCard()).toHaveTextContent('85°C')

    expect(screen.queryByText('Pilih beans dulu, suhu airnya kami sesuaikan.')).not.toBeInTheDocument()
    expect(screen.getByText('Robusta · Natural · Dark')).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('cb.bean')!)).toEqual({ species: 'robusta', process: 'natural', roast: 'dark' })
  })

  it('remembers the beans and lets you change them', async () => {
    localStorage.setItem('cb.bean', JSON.stringify({ species: 'arabica', process: 'washed', roast: 'light' }))
    const user = userEvent.setup()
    renderAt('/seduh/kalita')
    expect(tempCard()).toHaveTextContent('95°C')
    await user.click(screen.getByRole('button', { name: 'Ganti Beans' }))
    await user.click(within(screen.getByRole('group', { name: 'Tingkat sangrai' })).getByRole('button', { name: 'Medium' }))
    await user.click(screen.getByRole('button', { name: 'Selesai' }))
    expect(screen.getByText('Arabika · Washed · Medium')).toBeInTheDocument()
    expect(tempCard()).toHaveTextContent('93°C')
  })

  it('skips the picker for brews without hot water', () => {
    renderAt('/seduh/coldBrew')
    expect(screen.queryByText('Pilih beans dulu, suhu airnya kami sesuaikan.')).not.toBeInTheDocument()
  })

  it('saves the beans with a recipe and restores them from it', async () => {
    localStorage.setItem('cb.bean', JSON.stringify({ species: 'arabica', process: 'anaerobic', roast: 'light' }))
    const user = userEvent.setup()
    const { unmount } = renderAt('/resep/baru?metode=v60&kopi=15&rasio=16')
    expect(screen.getByText('Arabika · Anaerob · Light')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Simpan' }))
    await screen.findByText('Resep tersimpan')
    const [saved] = await listRecipes()
    expect(saved!.beanChoice).toEqual({ species: 'arabica', process: 'anaerobic', roast: 'light' })
    unmount()

    localStorage.setItem('cb.bean', JSON.stringify({ species: 'robusta', process: 'washed', roast: 'dark' }))
    renderAt('/seduh/v60?kopi=15&rasio=16&beans=arabica-anaerobic-light')
    expect(await screen.findByText('Arabika · Anaerob · Light')).toBeInTheDocument()
    expect(tempCard()).toHaveTextContent('93°C')
  })

  it('keeps an old recipe without beans on the method temperature', async () => {
    const r = await addRecipe({ methodId: 'v60', name: 'Lama', coffee: 15, ratio: 16, style: 'standard', bean: '', roastery: '', notes: '', rating: 0 })
    renderAt(`/resep/${r.id}/ubah`)
    expect(await screen.findByText('93°C')).toBeInTheDocument()
  })
})

describe('bean data', () => {
  it('shifts a method temperature by roast, species and process within limits', () => {
    const v60 = findMethod('v60')!
    expect(brewTempC(v60, { species: 'arabica', process: 'washed', roast: 'medium' })).toBe(93)
    expect(brewTempC(v60, { species: 'arabica', process: 'washed', roast: 'light' })).toBe(95)
    expect(brewTempC(findMethod('frenchPress')!, { species: 'arabica', process: 'washed', roast: 'light' })).toBe(96)
    expect(brewTempC(findMethod('espresso')!, { species: 'robusta', process: 'anaerobic', roast: 'dark' })).toBe(88)
    expect(brewTempC(findMethod('coldBrew')!, { species: 'arabica', process: 'washed', roast: 'light' })).toBeNull()
  })

  it('reads only valid bean links', () => {
    expect(readBeanParam('liberica-honey-dark')).toEqual({ species: 'liberica', process: 'honey', roast: 'dark' })
    expect(readBeanParam('liberica-honey')).toBeNull()
    expect(readBeanParam(null)).toBeNull()
  })

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
