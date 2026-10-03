import type { ReactNode } from 'react'

interface Option<T extends string> {
  value: T
  label: ReactNode
}

/** Pill group of toggle buttons; one is always pressed. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  columns,
}: {
  label: string
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  columns?: number
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="grid gap-1 rounded-xl bg-track p-1"
      style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            className={`min-h-10 rounded-[9px] px-2 text-sm font-semibold ${
              on ? 'bg-inverse text-on-inverse' : 'bg-transparent text-ink'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}
