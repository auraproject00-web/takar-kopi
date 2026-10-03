import { useI18n } from '../i18n/useI18n'

function StarIcon({ filled, size }: { filled: boolean; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9z" />
    </svg>
  )
}

/** Read-only rating; renders nothing when unrated. */
export function Stars({ value }: { value: number }) {
  if (value < 1) return null
  return (
    <span className="flex text-accent" role="img" aria-label={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon key={n} filled={n <= value} size={14} />
      ))}
    </span>
  )
}

/** Tapping the current rating again clears it. */
export function RatingInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const { t } = useI18n()
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={value === n ? t('recipe.clearRating') : t('recipe.ratingStar', { n })}
          aria-pressed={n <= value}
          onClick={() => onChange(value === n ? 0 : n)}
          className={`flex size-11 items-center justify-center ${n <= value ? 'text-accent' : 'text-faint'}`}
        >
          <StarIcon filled={n <= value} size={28} />
        </button>
      ))}
    </div>
  )
}
