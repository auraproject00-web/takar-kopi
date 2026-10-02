import { useRegisterSW } from 'virtual:pwa-register/react'
import { useI18n } from '../i18n/useI18n'

/** Registers the service worker and offers a reload when a new version has downloaded. */
export function UpdateBanner() {
  const { t } = useI18n()
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null
  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-20 mx-auto flex w-full max-w-md items-center justify-between gap-3 bg-ink px-4 py-3 text-sm text-white"
    >
      <span>{t('pwa.updateAvailable')}</span>
      <span className="flex shrink-0 gap-1">
        <button type="button" onClick={() => setNeedRefresh(false)} className="min-h-11 px-2 font-semibold text-field">
          {t('common.close')}
        </button>
        <button type="button" onClick={() => void updateServiceWorker(true)} className="min-h-11 rounded-lg bg-accent-soft px-3 font-semibold text-ink">
          {t('pwa.reload')}
        </button>
      </span>
    </div>
  )
}
