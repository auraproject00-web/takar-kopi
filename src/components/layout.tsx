import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import { BeanIcon, BookIcon, ChevronLeftIcon, CupIcon, SlidersIcon } from './icons'

/** Phone-width column, centered on larger screens. */
export function Screen({ children, nav = false }: { children: ReactNode; nav?: boolean }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-bg">
      <main className={`flex flex-1 flex-col ${nav ? 'pb-24' : 'pb-8'}`}>{children}</main>
      {nav && <BottomNav />}
    </div>
  )
}

export function BackHeader({ to, title }: { to: string; title: string }) {
  const { t } = useI18n()
  return (
    <header className="flex items-center gap-2 px-3 pt-5 pb-2">
      <Link to={to} aria-label={t('common.back')} className="flex size-11 items-center justify-center rounded-full text-ink">
        <ChevronLeftIcon />
      </Link>
      <h1 className="m-0 font-display text-2xl font-bold">{title}</h1>
    </header>
  )
}

function BottomNav() {
  const { t } = useI18n()
  const items = [
    { to: '/', label: t('nav.brew'), icon: <CupIcon />, end: true },
    { to: '/resep', label: t('nav.recipes'), icon: <BookIcon />, end: false },
    { to: '/beans', label: t('nav.beans'), icon: <BeanIcon />, end: false },
    { to: '/pengaturan', label: t('nav.settings'), icon: <SlidersIcon />, end: false },
  ]
  return (
    <nav
      aria-label={t('nav.main')}
      className="fixed inset-x-0 bottom-0 mx-auto grid h-[72px] w-full max-w-md grid-cols-4 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 text-xs no-underline ${
              isActive ? 'font-semibold text-accent' : 'font-medium text-muted'
            }`
          }
        >
          {item.icon}
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="m-0 text-[13px] font-semibold tracking-wide text-muted uppercase">{children}</h2>
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[14px] border border-line bg-surface ${className}`}>{children}</div>
}
