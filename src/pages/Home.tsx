import { IndianRupee, Sparkles, TrendingDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ComingNext } from '../components/layout/ComingNext'
import { PageHeader } from '../components/layout/PageHeader'
import { ErrorState, MetricCard, Skeleton } from '../components/ui'
import { useInsights } from '../hooks/queries'
import { weekdayName } from '../i18n/weekdays'
import { formatINR } from '../lib/format'

export function Home() {
  const { t } = useTranslation()
  const { data, isPending, isError, refetch } = useInsights()

  return (
    <>
      <PageHeader title={t('pages.home.greeting', { name: data?.briefing.greetingName ?? '' }).trim()} subtitle={t('pages.home.subtitle')} />
      <ComingNext phase={3} items={[t('pages.home.next1'), t('pages.home.next2')]}>
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {isPending ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-clay" />)
            ) : (
              <>
                <MetricCard
                  label={t('pages.home.yesterdaySales')}
                  value={formatINR(data.briefing.yesterday.sales)}
                  delta={{
                    label: t('pages.home.vsLast', { pct: data.briefing.yesterday.comparison.changePct, day: weekdayName(t, data.briefing.yesterday.dayLabel) }),
                    direction: 'down',
                  }}
                  icon={<IndianRupee />}
                />
                <MetricCard label={t('pages.home.mitrasRead')} value={<span className="text-2xl">{data.briefing.reasoning}</span>} icon={<TrendingDown />} />
                <MetricCard label={t('pages.home.insightsToday')} value={data.insights.length} icon={<Sparkles />} />
              </>
            )}
          </div>
        )}
      </ComingNext>
    </>
  )
}
