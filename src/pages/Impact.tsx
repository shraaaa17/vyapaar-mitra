import { ComingNext } from '../components/layout/ComingNext'
import { PageHeader } from '../components/layout/PageHeader'
import { ErrorState, MetricCard, Skeleton } from '../components/ui'
import { useOutcomes } from '../hooks/queries'
import { formatINR } from '../lib/format'

export function Impact() {
  const { data, isPending, isError, refetch } = useOutcomes()
  return (
    <>
      <PageHeader title="Impact" subtitle="What changed after Mitra acted, and what it learned." />
      <ComingNext phase={7} items={['Before vs after Tuesday bar chart (pilot simulation)', '“What I learned” and “What I’ll change next week”']}>
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isPending ? (
          <Skeleton className="h-36 rounded-clay" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard
              label={`${data.headline.before.label} → ${data.headline.after.label}`}
              value={`${formatINR(data.headline.before.sales)} → ${formatINR(data.headline.after.sales)}`}
              delta={{ label: `+${data.headline.changePct}% · pilot simulation`, direction: 'up' }}
            />
          </div>
        )}
      </ComingNext>
    </>
  )
}
