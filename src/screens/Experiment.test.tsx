import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider } from '../i18n/I18nProvider'
import App from '../App'
import { listRecipes } from '../lib/recipes'

function renderAt(path: string) {
  return render(
    <I18nProvider initialLang="id">
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </I18nProvider>,
  )
}

const openExperiment = async (user: ReturnType<typeof userEvent.setup>, method = 'v60') => {
  renderAt(`/seduh/${method}`)
  await user.click(screen.getByRole('button', { name: 'Eksperimen' }))
}

describe('Eksperimen: everything adjustable', () => {
  it('sets temperature, grind and total time, and the timer follows', async () => {
    const user = userEvent.setup()
    await openExperiment(user)
    const temp = screen.getByRole('group', { name: 'Suhu' })
    expect(temp).toHaveTextContent('93°C')
    await user.click(screen.getByRole('button', { name: 'Naikkan suhu' }))
    await user.click(screen.getByRole('button', { name: 'Naikkan suhu' }))
    expect(temp).toHaveTextContent('95°C')

    await user.selectOptions(screen.getByRole('combobox', { name: /^Gilingan/ }), 'medium')
    expect(screen.getByText('Medium', { selector: 'span.text-accent' })).toBeInTheDocument()
    // Comandante clicks now come from a method ground at Medium (Kalita).
    expect(screen.getByTestId('clicks')).toHaveTextContent('22–28 klik')

    const time = screen.getByRole('textbox', { name: /Total waktu/ })
    await user.type(time, '4:00')

    await user.click(screen.getByRole('link', { name: 'Mulai seduh' }))
    expect(screen.getByText(/95°C/)).toBeInTheDocument()
    expect(screen.getByText('4:00')).toBeInTheDocument()
  })

  it('can go back to the bean temperature', async () => {
    const user = userEvent.setup()
    await openExperiment(user)
    await user.click(screen.getByRole('button', { name: 'Turunkan suhu' }))
    expect(screen.getByRole('group', { name: 'Suhu' })).toHaveTextContent('92°C')
    await user.click(screen.getByRole('button', { name: 'Pakai suhu beans (93°C)' }))
    expect(screen.getByRole('group', { name: 'Suhu' })).toHaveTextContent('93°C')
  })

  it('edits the pour schedule step by step and runs it in the timer', async () => {
    const user = userEvent.setup()
    await openExperiment(user)
    await user.click(screen.getByRole('button', { name: 'Ubah jadwal tuang' }))

    // Default V60 15 g / 240 ml: bloom 45, pours 110 / 175 / 240, drawdown.
    expect(screen.getByRole('textbox', { name: 'Target timbangan langkah 1 (g)' })).toHaveValue('45')
    const bloomTime = screen.getByRole('textbox', { name: 'Waktu langkah 2' })
    await user.clear(bloomTime)
    await user.type(bloomTime, '0:40')
    await user.click(screen.getByRole('button', { name: 'Hapus langkah 4' }))
    await user.click(screen.getByRole('button', { name: 'Tambah langkah' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Jenis langkah 5' }), 'stir')
    const stirTime = screen.getByRole('textbox', { name: 'Waktu langkah 5' })
    await user.clear(stirTime)
    await user.type(stirTime, '1:30')

    await user.click(screen.getByRole('link', { name: 'Mulai seduh' }))
    const items = screen.getAllByRole('listitem').map((li) => li.textContent)
    expect(items).toEqual([
      expect.stringMatching(/^0:00Bloom.*45 g/),
      expect.stringMatching(/^0:40Tuang 1.*110 g/),
      expect.stringMatching(/^1:15Tuang 2.*175 g/),
      expect.stringMatching(/^1:30Aduk/),
      expect.stringMatching(/^2:15Tunggu tetes habis/),
    ])
  })

  it('warns when the pours miss the water, and fits them', async () => {
    const user = userEvent.setup()
    await openExperiment(user)
    await user.click(screen.getByRole('button', { name: 'Ubah jadwal tuang' }))
    const last = screen.getByRole('textbox', { name: 'Target timbangan langkah 4 (g)' })
    await user.clear(last)
    await user.type(last, '200')
    expect(screen.getByText('Total tuang 200 g, airnya 240 g')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Sesuaikan' }))
    expect(screen.getByRole('textbox', { name: 'Target timbangan langkah 4 (g)' })).toHaveValue('240')
    expect(screen.queryByText(/Total tuang/)).not.toBeInTheDocument()
  })

  it('goes back to the default schedule', async () => {
    const user = userEvent.setup()
    await openExperiment(user)
    await user.click(screen.getByRole('button', { name: 'Ubah jadwal tuang' }))
    await user.click(screen.getByRole('button', { name: 'Hapus langkah 1' }))
    await user.click(screen.getByRole('button', { name: 'Kembali ke jadwal bawaan' }))
    expect(screen.getByRole('button', { name: 'Ubah jadwal tuang' })).toBeInTheDocument()
    expect(screen.getByText('Bloom')).toBeInTheDocument()
  })

  it('gives espresso a timer once you make your own steps', async () => {
    const user = userEvent.setup()
    await openExperiment(user, 'espresso')
    expect(screen.queryByRole('link', { name: 'Mulai seduh' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Buat langkah sendiri' }))
    await user.click(screen.getByRole('button', { name: 'Tambah langkah' }))
    await user.selectOptions(screen.getByRole('combobox', { name: 'Jenis langkah 1' }), 'pourAll')
    await user.click(screen.getByRole('link', { name: 'Mulai seduh' }))
    // No own time: the shot runs to the top of 25–30 s.
    expect(screen.getByText('0:30')).toBeInTheDocument()
    expect(within(screen.getByRole('list')).getByText('Tuang semua air')).toBeInTheDocument()
  })

  it('saves everything with the recipe and brings it back', async () => {
    const user = userEvent.setup()
    const { unmount } = renderAt('/seduh/v60?kopi=15&rasio=16&suhu=90&giling=medium&waktu=200&langkah=b0-40_p30-240_d120')
    expect(screen.getByRole('group', { name: 'Suhu' })).toHaveTextContent('90°C')
    expect(screen.getByRole('textbox', { name: /Total waktu/ })).toHaveValue('3:20')
    await user.click(screen.getByRole('link', { name: 'Simpan sebagai resep' }))
    for (const chip of ['90°C', 'Medium', '3:20', 'Jadwal sendiri']) expect(screen.getByText(chip)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Simpan' }))
    await screen.findByText('Resep tersimpan')
    const [saved] = await listRecipes()
    expect(saved!.custom).toEqual({
      tempC: 90,
      grind: 'medium',
      time: 200,
      steps: [
        { type: 'bloom', atSec: 0, targetG: 40 },
        { type: 'pour', atSec: 30, n: 1, targetG: 240 },
        { type: 'drawdown', atSec: 120 },
      ],
    })
    unmount()

    renderAt('/resep')
    await user.click(await screen.findByRole('link', { name: /^V60/ }))
    expect(screen.getByRole('group', { name: 'Suhu' })).toHaveTextContent('90°C')
    expect(screen.getByRole('textbox', { name: 'Waktu langkah 2' })).toHaveValue('0:30')
  })

  it('keeps Takaran on the method defaults', async () => {
    const user = userEvent.setup()
    await openExperiment(user)
    await user.click(screen.getByRole('button', { name: 'Naikkan suhu' }))
    await user.click(screen.getByRole('button', { name: 'Takaran' }))
    // Bean picker and temperature card both stay on 93°C.
    expect(screen.getAllByText('93°C')).toHaveLength(2)
  })
})
