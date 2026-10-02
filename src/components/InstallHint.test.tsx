import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nProvider } from '../i18n/I18nProvider'
import { listenForInstallPrompt } from '../lib/installPrompt'
import { InstallHint } from './InstallHint'

const IPHONE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'

const renderHint = () =>
  render(
    <I18nProvider initialLang="id">
      <InstallHint />
    </I18nProvider>,
  )

beforeAll(() => listenForInstallPrompt())
afterEach(() => vi.restoreAllMocks())

describe('install hint', () => {
  it('stays hidden on browsers that cannot install', () => {
    renderHint()
    expect(screen.queryByText('Pasang di layar utama')).not.toBeInTheDocument()
  })

  it('explains the Share-sheet steps on iPhone, and can be dismissed for good', async () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(IPHONE_UA)
    const user = userEvent.setup()
    const { unmount } = renderHint()
    expect(screen.getByText(/Tambah ke Layar Utama/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Nanti saja' }))
    expect(screen.queryByText(/Tambah ke Layar Utama/)).not.toBeInTheDocument()
    unmount()
    renderHint()
    expect(screen.queryByText(/Tambah ke Layar Utama/)).not.toBeInTheDocument()
  })

  it('offers an Install button when Chrome allows installing', async () => {
    const prompt = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderHint()
    const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
      prompt,
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    })
    act(() => {
      window.dispatchEvent(event)
    })
    expect(event.defaultPrevented).toBe(true)
    await user.click(screen.getByRole('button', { name: 'Pasang' }))
    expect(prompt).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Pasang' })).not.toBeInTheDocument()
  })
})
