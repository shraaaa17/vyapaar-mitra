import { ComingNext } from '../components/layout/ComingNext'
import { PageHeader } from '../components/layout/PageHeader'
import { ErrorState, MetricCard, Skeleton } from '../components/ui'
import { useCampaigns } from '../hooks/queries'

export function Campaigns() {
  const { data, isPending, isError, refetch } = useCampaigns()
  const campaign = data?.[0]

  return (
    <>
      <PageHeader title="Campaigns" subtitle="Offers Mitra sends to your customers on WhatsApp." />
      <ComingNext
        phase={5}
        items={['WhatsApp-style offer preview', 'Audience and funnel: sent, delivered, redeemed', 'Discount cost vs extra sales']}
      >
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isPending ? (
          <Skeleton className="h-36 rounded-clay" />
        ) : (
          campaign && (
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard label={campaign.name} value={campaign.audience.count} delta={{ label: campaign.audience.label, direction: 'neutral' }} />
              <MetricCard label="Delivered" value={campaign.funnel.delivered} />
              <MetricCard label="Redeemed" value={campaign.funnel.redeemed} />
            </div>
          )
        )}
      </ComingNext>
    </>
  )
}
