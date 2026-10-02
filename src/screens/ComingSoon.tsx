import type { MessageKey } from '../i18n/I18nProvider'
import { useI18n } from '../i18n/useI18n'
import { Card, Screen } from '../components/layout'
import { LangToggle } from '../components/LangToggle'

export default function ComingSoon({ titleKey }: { titleKey: MessageKey }) {
  const { t } = useI18n()
  return (
    <Screen nav>
      <header className="flex items-center justify-between gap-3 px-5 pt-7 pb-2">
        <h1 className="m-0 font-display text-[28px] font-bold">{t(titleKey)}</h1>
        <LangToggle />
      </header>
      <div className="px-5 pt-4">
        <Card className="flex flex-col gap-1 p-5">
          <p className="m-0 font-semibold">{t('common.comingSoon')}</p>
          <p className="m-0 text-sm text-muted">{t('common.comingSoonBody')}</p>
        </Card>
      </div>
    </Screen>
  )
}
