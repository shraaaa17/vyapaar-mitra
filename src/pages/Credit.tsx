import { ComingNext } from '../components/layout/ComingNext'
import { PageHeader } from '../components/layout/PageHeader'
import { ErrorState, MetricCard, Skeleton } from '../components/ui'
import { useCashflow } from '../hooks/queries'
import { formatINR } from '../lib/format'

export function Credit() {
  const { data, isPending, isError, refetch } = useCashflow()
  const shortfall = data ? data.days[data.shortfallDayIndex] : undefined

  return (
    <>
      <PageHeader title="Credit & Cashflow" subtitle="See cash gaps early and decide what to do." />
      <ComingNext phase={6} items={['14-day cashflow forecast with a “cash may run short” marker', 'Reorder suggestion card', 'Pre-approved loan card: recommend only, you decide']}>
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isPending ? (
          <Skeleton className="h-36 rounded-clay" />
        ) : (
          shortfall && (
            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCard label="Cash may run short in" value={`${data.shortfallDayIndex} days`} delta={{ label: 'Supplier payment due', direction: 'down' }} />
              <MetricCard label="Lowest forecast balance" value={formatINR(shortfall.balance)} />
            </div>
          )
        )}
      </ComingNext>
    </>
  )
}
