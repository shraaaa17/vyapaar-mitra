import { ComingNext } from '../components/layout/ComingNext'
import { PageHeader } from '../components/layout/PageHeader'
import { ErrorState, MetricCard, Skeleton } from '../components/ui'
import { useRegulars } from '../hooks/queries'

export function Regulars() {
  const { data, isPending, isError, refetch } = useRegulars()
  return (
    <>
      <PageHeader title="Regulars" subtitle="Your loyal customers, kept private." />
      <ComingNext phase={5} items={['Masked customer list with visit counts', 'Reward status and “12th visit” badge', 'WhatsApp consent indicator']}>
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isPending ? (
          <Skeleton className="h-36 rounded-clay" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard label="Regular customers" value={data.total} />
            <MetricCard label="Opted in on WhatsApp (top 10)" value={data.regulars.filter((r) => r.consent.whatsappOptIn).length} />
          </div>
        )}
      </ComingNext>
    </>
  )
}
