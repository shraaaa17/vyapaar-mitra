import { History } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useActivityEntries } from '../../hooks/useActivityEntries'
import { ClayButton, ClayCard } from '../ui'
import { ActivityRows } from './ActivityRows'

const SHOWN = 8

export function ActivityCard() {
  const { t } = useTranslation()
  const [showAll, setShowAll] = useState(false)
  const { entries, locale } = useActivityEntries()
  const shown = showAll ? entries : entries.slice(0, SHOWN)

  return (
    <ClayCard as="section" aria-labelledby="activity-title" padding="none">
      <header className="flex items-center gap-3 px-5 pt-5 sm:px-6">
        <span aria-hidden className="inline-flex size-10 items-center justify-center rounded-xl bg-accent-wash text-accent-ink">
          <History className="size-5" />
        </span>
        <h2 id="activity-title" className="text-lg font-bold">
          {t('counter.activity.title')}
        </h2>
      </header>

      <div className="px-5 pt-4 pb-5 sm:px-6 sm:pb-6">
        {entries.length === 0 ? (
          <p className="rounded-2xl bg-well px-4 py-4 text-slate">{t('counter.activity.empty')}</p>
        ) : (
          <ActivityRows entries={shown} locale={locale} />
        )}
        {entries.length > SHOWN && (
          <ClayButton variant="ghost" size="sm" onClick={() => setShowAll((value) => !value)} aria-expanded={showAll} className="mt-2">
            {showAll ? t('counter.activity.showLess') : t('counter.activity.showAll', { count: entries.length })}
          </ClayButton>
        )}
      </div>
    </ClayCard>
  )
}