import { useState } from 'react'
import { useI18n } from '../i18n/useI18n'
import { isIosBrowser, isStandalone, promptInstall, useInstallPrompt } from '../lib/installPrompt'
import { usePersistentState } from '../lib/usePersistentState'

/** Shown on the home screen until the app is installed or the hint is dismissed. */
export function InstallHint() {
  const { t } = useI18n()
  const prompt = useInstallPrompt()
  const [dismissed, setDismissed] = usePersistentState('cb.installDismissed', false)
  const [env] = useState(() => ({ standalone: isStandalone(), ios: isIosBrowser() }))

  if (dismissed || env.standalone || (!prompt && !env.ios)) return null

  return (
    <aside className="flex flex-col gap-2 rounded-[14px] border border-accent bg-surface p-3.5" aria-label={t('install.title')}>
      <p className="m-0 font-semibold">{t('install.title')}</p>
      {prompt ? (
        <p className="m-0 text-sm text-muted">{t('pwa.offlineReady')}</p>
      ) : (
        <p className="m-0 text-sm leading-relaxed text-muted">{t('install.iosSteps')}</p>
      )}
      <div className="flex gap-2">
        {prompt && (
          <button type="button" onClick={() => void promptInstall()} className="min-h-11 rounded-xl bg-accent px-4 text-sm font-semibold text-on-accent">
            {t('install.button')}
          </button>
        )}
        <button type="button" onClick={() => setDismissed(true)} className="min-h-11 px-3 text-sm font-semibold text-muted">
          {t('install.dismiss')}
        </button>
      </div>
    </aside>
  )
}
