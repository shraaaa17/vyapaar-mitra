import { useTranslation } from 'react-i18next'
import { ActivityRows } from '../components/counter/ActivityRows'
import { useActivityEntries } from '../hooks/useActivityEntries'
import { PageHeader } from '../components/layout/PageHeader'
import { ClayCard, Skeleton } from '../components/ui'
import { localDateKey } from '../lib/date'

export function HistoryPage() {
  const { t } = useTranslation()
  const { entries, locale, isLoading } = useActivityEntries(true)
  const today = localDateKey()
  const groups = [
    { key: 'today', label: t('pages.history.today'), entries: entries.filter((entry) => localDateKey(new Date(entry.at)) === today) },
    { key: 'earlier', label: t('pages.history.earlier'), entries: entries.filter((entry) => localDateKey(new Date(entry.at)) !== today) },
  ].filter((group) => group.entries.length > 0)

  return (
    <>
      <PageHeader title={t('pages.history.title')} subtitle={t('pages.history.subtitle')} />
      <ClayCard as="section" aria-label={t('pages.history.title')} padding="none">
        {entries.length === 0 && isLoading ? (
          <div role="status" aria-label={t('pages.history.loading')} className="flex flex-col gap-3 px-5 py-5 sm:px-6">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : entries.length === 0 ? (
          <p className="m-5 rounded-2xl bg-well px-4 py-4 text-slate sm:m-6">{t('pages.history.empty')}</p>
        ) : (
          <div className="px-5 pb-4 sm:px-6 sm:pb-5">
            {groups.map((group) => (
              <section key={group.key} aria-labelledby={`history-${group.key}`}>
                <h2 id={`history-${group.key}`} className="pt-5 text-base font-bold text-ink">
                  {group.label}
                </h2>
                <ActivityRows entries={group.entries} locale={locale} />
              </section>
            ))}
          </div>
        )}
      </ClayCard>
    </>
  )
}