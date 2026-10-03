import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../config', () => ({
  APP_VERSION: '0.9.0',
  FEEDBACK_ENABLED: true,
  FEEDBACK_FORM: {
    action: 'https://docs.google.com/forms/d/e/TEST/formResponse',
    deviceEntry: 'entry.111',
    messageEntry: 'entry.222',
    deviceOptions: { android: 'Android', ios: 'IOS' },
  },
}))

import { I18nProvider } from '../i18n/I18nProvider'
import App from '../App'

let fetchMock: ReturnType<typeof vi.fn>
beforeEach(() => {
  fetchMock = vi.fn().mockResolvedValue({ type: 'opaque', ok: false, status: 0 })
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

function renderSettings() {
  return render(
    <I18nProvider initialLang="id">
      <MemoryRouter initialEntries={['/pengaturan']}>
        <App />
      </MemoryRouter>
    </I18nProvider>,
  )
}

describe('in-app feedback', () => {
  it('opens inline in Settings, sends in the background and stays on the page', async () => {
    const user = userEvent.setup()
    renderSettings()
    const toggle = screen.getByRole('button', { name: 'Kirim masukan' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    await user.click(screen.getByRole('radio', { name: 'iOS' }))
    await user.type(screen.getByRole('textbox', { name: 'Saran atau masalah' }), 'Tambah metode Clever dong')
    await user.click(screen.getByRole('button', { name: 'Kirim' }))

    expect(await screen.findByText('Terima kasih! Masukanmu sudah terkirim.')).toBeInTheDocument()
    expect(String(fetchMock.mock.calls[0]![1].body)).toContain('entry.111=IOS')
    // Still on Settings: no navigation, no new tab
    expect(screen.getByRole('heading', { name: 'Pengaturan' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Google/ })).not.toBeInTheDocument()
  })

  it('asks for a message instead of sending an empty one', async () => {
    const user = userEvent.setup()
    renderSettings()
    await user.click(screen.getByRole('button', { name: 'Kirim masukan' }))
    await user.click(screen.getByRole('button', { name: 'Kirim' }))
    expect(screen.getByText('Tulis saranmu dulu, ya.')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Saran atau masalah' })).toHaveAttribute('aria-invalid', 'true')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('tells the user it will send later when offline', async () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const user = userEvent.setup()
    renderSettings()
    await user.click(screen.getByRole('button', { name: 'Kirim masukan' }))
    await user.type(screen.getByRole('textbox', { name: 'Saran atau masalah' }), 'Dari pesawat')
    await user.click(screen.getByRole('button', { name: 'Kirim' }))
    expect(await screen.findByText(/terkirim otomatis saat online/)).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
    vi.restoreAllMocks()
  })
})
