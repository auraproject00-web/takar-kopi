import { Link } from 'react-router-dom'
import type { MessageKey } from '../i18n/I18nProvider'
import { useI18n } from '../i18n/useI18n'
import { Screen } from '../components/layout'

export default function NotFound({ titleKey = 'notFound.title' }: { titleKey?: MessageKey }) {
  const { t } = useI18n()
  return (
    <Screen>
      <div className="flex flex-col gap-3 px-5 pt-16">
        <h1 className="m-0 font-display text-2xl font-bold">{t(titleKey)}</h1>
        <Link to="/" className="font-semibold text-accent">
          {t('notFound.back')}
        </Link>
      </div>
    </Screen>
  )
}
