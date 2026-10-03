import type { SVGProps } from 'react'

function Icon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  )
}

export function CupIcon() {
  return (
    <Icon>
      <path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" />
      <path d="M17 10h2a2 2 0 0 1 0 4h-2" />
    </Icon>
  )
}

export function BookIcon() {
  return (
    <Icon>
      <path d="M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z" />
      <path d="M5 18a2 2 0 0 1 2-2h11" />
    </Icon>
  )
}

export function SlidersIcon() {
  return (
    <Icon>
      <path d="M4 6h10M4 12h4M12 12h8M4 18h12" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </Icon>
  )
}

export function ChevronLeftIcon() {
  return (
    <Icon>
      <path d="M15 18l-6-6 6-6" />
    </Icon>
  )
}

export function BeanIcon() {
  return (
    <Icon>
      <ellipse cx="12" cy="12" rx="6.5" ry="9" transform="rotate(35 12 12)" />
      <path d="M8.5 18.5c1-3 4-4.5 3.5-6.5s2.5-3.5 3.5-6.5" />
    </Icon>
  )
}
