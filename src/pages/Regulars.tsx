import { Gift, MessageCircle, ShieldCheck, Users } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../components/layout/PageHeader'
import { RegularCard } from '../components/regulars/RegularCard'
import { EmptyState, ErrorState, MetricCard, Skeleton } from '../components/ui'
import { useRegulars } from '../hooks/queries'
import { useNow } from '../hooks/useNow'

export function Regulars() {
  const { t } = useTranslation()
  const { data, isPending, isError, refetch } = useRegulars()
  const now = useNow(60_000)

  // Most visits first; a payment at the counter can move someone up.
  const regulars = useMemo(
    () => [...(data?.regulars ?? [])].sort((a, b) => b.visits - a.visits || Date.parse(b.lastVisit) - Date.parse(a.lastVisit)),
    [data],
  )
  const ready = regulars.filter((r) => r.reward.status === 'earned')
  const every = regulars[0]?.reward.everyNVisits ?? 12

  return (
    <>
      <PageHeader title={t('pages.regulars.title')} subtitle={t('pages.regulars.subtitle')} />
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isPending ? (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-36 rounded-clay" />
            <Skeleton className="h-36 rounded-clay" />
          </div>
          <Skeleton className="h-96 rounded-clay-lg" />
        </div>
      ) : regulars.length === 0 ? (
        <EmptyState title={t('pages.regulars.emptyTitle')} message={t('pages.regulars.emptyBody')} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard label={t('pages.regulars.total')} value={data.total} icon={<Users />} />
            <MetricCard
              label={t('pages.regulars.optedIn')}
              value={data.optedIn}
              icon={<MessageCircle />}
              delta={{ label: t('pages.regulars.optedInNote'), direction: 'neutral' }}
            />
          </div>

          {/* Announced when a payment at the counter unlocks a reward. */}
          <div aria-live="polite">
            {ready.length > 0 && (
              <ul className="flex flex-col gap-2 rounded-clay bg-accent-wash p-4">
                {ready.map((regular) => (
                  <li key={regular.id} className="flex items-start gap-3 text-ink">
                    <Gift aria-hidden className="mt-0.5 size-5 shrink-0 text-accent-ink" />
                    <span>{t('pages.regulars.readyNote', { who: regular.masked, n: regular.reward.everyNVisits })}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <section aria-labelledby="regulars-list-title" className="flex flex-col gap-4">
            <div>
              <h2 id="regulars-list-title" className="text-xl font-bold">
                {t('pages.regulars.listTitle', { count: regulars.length })}
              </h2>
              <p className="mt-1 text-slate">{t('pages.regulars.rewardRule', { n: every })}</p>
            </div>
            <ul className="grid gap-3 md:grid-cols-2">
              {regulars.map((regular) => (
                <li key={regular.id}>
                  <RegularCard regular={regular} now={now} />
                </li>
              ))}
            </ul>
            <p className="flex items-start gap-2 text-sm text-slate">
              <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-success-ink" />
              {t('pages.regulars.privacy')}
            </p>
          </section>
        </div>
      )}
    </>
  )
}
