import { ComingNext } from '../components/layout/ComingNext'
import { PageHeader } from '../components/layout/PageHeader'
import { ErrorState, MetricCard, Skeleton } from '../components/ui'
import { useActions } from '../hooks/queries'

export function Actions() {
  const { data, isPending, isError, refetch } = useActions()
  const count = (statuses: string[]) => data?.filter((a) => statuses.includes(a.status)).length ?? 0

  return (
    <>
      <PageHeader title="Actions" subtitle="What Mitra wants to do, and what it already did for you." />
      <ComingNext
        phase={4}
        items={[
          'Tabs: Needs approval, Done automatically, Completed',
          'Approve, Edit, Reject, Pause and Undo on each card',
          '“Why?” panel with the data used, pattern and confidence',
        ]}
      >
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isPending ? (
          <Skeleton className="h-36 rounded-clay" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <MetricCard label="Needs approval" value={count(['pending'])} />
            <MetricCard label="Done automatically" value={count(['auto_done', 'paused', 'undone'])} />
            <MetricCard label="Completed" value={count(['completed', 'approved', 'rejected'])} />
          </div>
        )}
      </ComingNext>
    </>
  )
}
