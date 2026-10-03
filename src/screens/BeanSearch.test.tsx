import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { I18nProvider, type Lang } from '../i18n/I18nProvider'
import App from '../App'

function renderAt(path: string, lang: Lang = 'id') {
  return render(
    <I18nProvider initialLang={lang}>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </I18nProvider>,
  )
}

describe('bean search', () => {
  it('opens from under the grind guide on the home screen and lists every origin', async () => {
    const user = userEvent.setup()
    renderAt('/')
    await user.click(screen.getByRole('link', { name: 'Cari biji kopi' }))
    expect(screen.getByRole('heading', { name: 'Cari biji kopi' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Indonesia' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /^Kintamani/ })).toBeInTheDocument()
  })

  it('searches and shows taste notes by process with the origin details', async () => {
    const user = userEvent.setup()
    renderAt('/cari-biji')
    await user.type(screen.getByRole('searchbox', { name: 'Cari origin, daerah, atau varietas' }), 'aceh')
    expect(screen.getByText('1 hasil')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: /^Gayo/ }))

    expect(screen.getByRole('heading', { name: 'Gayo' })).toBeInTheDocument()
    expect(screen.getByText('Aceh Tengah, Bener Meriah')).toBeInTheDocument()
    expect(screen.getByText('1200–1700 mdpl')).toBeInTheDocument()
    const natural = screen.getByRole('heading', { name: 'Natural (dry process)' }).closest('div')!.parentElement!
    expect(within(natural).getByText('wine')).toBeInTheDocument()
    expect(within(natural).getByText('Paling umum')).toBeInTheDocument()
    const wetHulled = screen.getByRole('heading', { name: 'Giling basah (wet-hulled)' }).closest('div')!.parentElement!
    expect(within(wetHulled).getByText('tembakau')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Kembali' }))
    expect(screen.getByRole('searchbox')).toHaveValue('aceh')
  })

  it('says so when nothing matches', async () => {
    const user = userEvent.setup()
    renderAt('/cari-biji')
    await user.type(screen.getByRole('searchbox'), 'kopi bulan')
    expect(screen.getByText(/"kopi bulan" belum ada di database kami/)).toBeInTheDocument()
  })

  it('picks a process for brewing, which the calculator then uses', async () => {
    const user = userEvent.setup()
    const { unmount } = renderAt('/cari-biji/semendo')
    await user.click(screen.getByRole('button', { name: 'Pakai untuk seduh: Natural (dry process)' }))
    expect(screen.getByRole('button', { name: 'Pakai untuk seduh: Natural (dry process)' })).toHaveAttribute('aria-pressed', 'true')
    unmount()
    renderAt('/seduh/v60')
    expect(screen.getByText('Robusta · Natural · Medium')).toBeInTheDocument()
  })

  it('works in English', () => {
    renderAt('/cari-biji/yirgacheffe', 'en')
    expect(screen.getByText('Ethiopia')).toBeInTheDocument()
    expect(screen.getAllByText('jasmine', { selector: 'li' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('heading', { name: 'Taste notes by process' })).toBeInTheDocument()
  })
})
