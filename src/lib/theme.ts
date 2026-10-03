import { useEffect } from 'react'
import { usePersistentState } from './usePersistentState'

export type Theme = 'light' | 'dark' | 'system'

const BAR_COLOR = { light: '#f4f3f1', dark: '#141210' }

export function useTheme(): [Theme, (theme: Theme) => void] {
  return usePersistentState<Theme>('cb.theme', 'system')
}

/** Puts the chosen theme on <html> and keeps the phone's status bar color in step. */
export function useApplyTheme(): void {
  const [theme] = useTheme()
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') delete root.dataset.theme
    else root.dataset.theme = theme

    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    const paintBar = () => {
      const dark = theme === 'dark' || (theme === 'system' && media?.matches === true)
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? BAR_COLOR.dark : BAR_COLOR.light)
    }
    paintBar()
    media?.addEventListener?.('change', paintBar)
    return () => media?.removeEventListener?.('change', paintBar)
  }, [theme])
}
