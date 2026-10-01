import { useTranslation } from 'react-i18next'
import { CampaignCard } from '../components/campaigns/CampaignCard'
import { useDecide } from '../components/counter/useDecide'
import { PageHeader } from '../components/layout/PageHeader'
import { EmptyState, ErrorState, Skeleton } from '../components/ui'
import { useActions, useCampaigns } from '../hooks/queries'

export function Campaigns() {
  const { t } = useTranslation()
  const { data, isPending, isError, refetch } = useCampaigns()
  const { data: actions } = useActions()
  const { decide, busyId, failedId } = useDecide()

  return (
    <>
      <PageHeader title={t('pages.campaigns.title')} subtitle={t('pages.campaigns.subtitle')} />
      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isPending ? (
        <Skeleton className="h-[560px] rounded-clay-lg" />
      ) : data.length === 0 ? (
        <EmptyState title={t('pages.campaigns.emptyTitle')} message={t('pages.campaigns.emptyBody')} />
      ) : (
        <div className="flex flex-col gap-6">
          {data.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              action={actions?.find((a) => a.id === campaign.actionId)}
              busy={busyId === campaign.actionId}
              failed={failedId === campaign.actionId}
              onDecide={decide}
            />
          ))}
        </div>
      )}
    </>
  )
}
