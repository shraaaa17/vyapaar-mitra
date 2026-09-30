import { IndianRupee, Sparkles, TrendingDown } from 'lucide-react'
import { ComingNext } from '../components/layout/ComingNext'
import { PageHeader } from '../components/layout/PageHeader'
import { ErrorState, MetricCard, Skeleton } from '../components/ui'
import { useInsights } from '../hooks/queries'
import { formatINR } from '../lib/format'

export function Home() {
  const { data, isPending, isError, refetch } = useInsights()

  return (
    <>
      <PageHeader
        title={`Namaste ${data?.briefing.greetingName ?? ''}`.trim()}
        subtitle="Here’s what Vyapaar Mitra found for your store today."
      />
      <ComingNext
        phase={3}
        items={['Morning briefing with “Listen” read-aloud', 'Ranked insight cards with rupee impact and one clear action']}
      >
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            {isPending ? (
              [0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-clay" />)
            ) : (
              <>
                <MetricCard
                  label="Yesterday’s sales"
                  value={formatINR(data.briefing.yesterday.sales)}
                  delta={{ label: `${data.briefing.yesterday.comparison.changePct}% vs ${data.briefing.yesterday.comparison.label}`, direction: 'down' }}
                  icon={<IndianRupee />}
                />
                <MetricCard label="Mitra’s read" value={<span className="text-2xl">{data.briefing.reasoning}</span>} icon={<TrendingDown />} />
                <MetricCard label="Insights today" value={data.insights.length} icon={<Sparkles />} />
              </>
            )}
          </div>
        )}
      </ComingNext>
    </>
  )
}
