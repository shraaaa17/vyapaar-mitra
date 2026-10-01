<<<<<<< HEAD
import { ArrowDownRight, ArrowUpRight, Check, Loader2, Megaphone, Pause, Play, Send, Users } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { PageHeader } from '../components/layout/PageHeader'
import { Badge, ClayButton, ClayCard, ErrorState, MetricCard, Skeleton } from '../components/ui'
import { useActionDecision, useActions, useCampaigns } from '../hooks/queries'
import { formatINR } from '../lib/format'
import type { ActionDecisionRequest, AgentAction, Campaign } from '../mocks/types'
import { useCounter, type Line } from '../store/counter'

function statusTone(status: Campaign['status']): 'success' | 'neutral' | 'caution' {
  if (status === 'running') return 'success'
  if (status === 'paused') return 'caution'
  return 'neutral'
}

function decisionLine(action: AgentAction, decision: ActionDecisionRequest['decision']): Line {
  return decision === 'pause'
    ? { key: 'counter.lines.paused', params: { type: action.type } }
    : { key: 'counter.lines.resumed', params: { type: action.type } }
}

function FunnelRow({ label, value, sent, tone }: { label: string; value: number; sent: number; tone: string }) {
  const pct = sent > 0 ? Math.min((value / sent) * 100, 100) : 0
  return (
    <li className="grid grid-cols-[minmax(5.5rem,0.8fr)_minmax(0,2fr)_3.5rem] items-center gap-3 py-2.5">
      <span className="text-sm font-medium text-slate">{label}</span>
      <span aria-hidden className="h-2.5 overflow-hidden rounded-full bg-well">
        <span className={`block h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </span>
      <span className="text-right text-sm font-semibold text-ink tabular-nums">{value}</span>
    </li>
  )
}

function CampaignCard({ campaign, action }: { campaign: Campaign; action?: AgentAction }) {
  const { t } = useTranslation()
  const [failed, setFailed] = useState(false)
  const decision = useActionDecision((updated, request) => {
    useCounter.getState().log('decision', decisionLine(updated, request.decision))
  })
  const busy = decision.isPending
  const netSales = campaign.extraSales - campaign.discountCost
  const actionDecision = campaign.status === 'running' && action?.status === 'auto_done'
    ? 'pause'
    : campaign.status === 'paused' && action?.status === 'paused'
      ? 'resume'
      : undefined
  const redemptionRate = campaign.funnel.delivered > 0
    ? Math.round((campaign.funnel.redeemed / campaign.funnel.delivered) * 100)
    : 0

  const decide = (next: 'pause' | 'resume') => {
    if (!action || busy) return
    setFailed(false)
    decision.mutate({ actionId: action.id, decision: next }, { onError: () => setFailed(true) })
  }

  return (
    <ClayCard as="article" aria-labelledby={`campaign-${campaign.id}`} padding="none">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-5 py-5 sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <span aria-hidden className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent-wash text-accent-ink">
            <Megaphone className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 id={`campaign-${campaign.id}`} className="text-lg font-bold text-ink">{campaign.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone="neutral" icon={<Send />}>{t('pages.campaigns.whatsapp')}</Badge>
              <Badge tone={statusTone(campaign.status)}>{t(`pages.campaigns.status.${campaign.status}`)}</Badge>
              {campaign.simulated && <span className="text-xs font-medium text-slate-soft">{t('pages.campaigns.simulated')}</span>}
            </div>
          </div>
        </div>
        {actionDecision && (
          <ClayButton
            variant="secondary"
            onClick={() => decide(actionDecision)}
            aria-disabled={busy || undefined}
            leadingIcon={busy ? <Loader2 className="size-4 animate-spin" /> : actionDecision === 'pause' ? <Pause className="size-4" /> : <Play className="size-4" />}
          >
            {busy
              ? t('pages.campaigns.updating')
              : actionDecision === 'pause'
                ? t('pages.campaigns.pause')
                : t('pages.campaigns.resume')}
          </ClayButton>
        )}
      </header>

      <div className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section aria-labelledby={`offer-${campaign.id}`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 id={`offer-${campaign.id}`} className="text-sm font-semibold text-slate">{t('pages.campaigns.offerPreview')}</h3>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success-ink">
              <span aria-hidden className="size-2 rounded-full bg-success" />
              {t('pages.campaigns.previewLabel')}
            </span>
          </div>
          <div className="rounded-clay border border-line bg-well p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
              <span aria-hidden className="inline-flex size-8 items-center justify-center rounded-full bg-success-wash text-success-ink">
                <Users className="size-4" />
              </span>
              {t('pages.campaigns.audience', { count: campaign.audience.count })}
            </div>
            <p className="whitespace-pre-wrap rounded-2xl bg-surface px-4 py-3 text-sm leading-relaxed text-ink [box-shadow:var(--clay-shadow-soft)]">
              {campaign.message}
            </p>
            <Link to="/regulars" className="mt-3 inline-flex min-h-12 items-center text-sm font-semibold text-accent-ink hover:underline">
              {t('pages.campaigns.viewAudience')}
            </Link>
          </div>
        </section>

        <section aria-labelledby={`results-${campaign.id}`}>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <h3 id={`results-${campaign.id}`} className="text-sm font-semibold text-slate">{t('pages.campaigns.performance')}</h3>
            <span className="text-xs font-medium text-slate-soft">{t('pages.campaigns.redemptionRate', { pct: redemptionRate })}</span>
          </div>
          <ul className="divide-y divide-line">
            <FunnelRow label={t('pages.campaigns.sent')} value={campaign.funnel.sent} sent={campaign.funnel.sent} tone="bg-accent" />
            <FunnelRow label={t('pages.campaigns.delivered')} value={campaign.funnel.delivered} sent={campaign.funnel.sent} tone="bg-accent/80" />
            <FunnelRow label={t('pages.campaigns.read')} value={campaign.funnel.read} sent={campaign.funnel.sent} tone="bg-accent/60" />
            <FunnelRow label={t('pages.campaigns.redeemed')} value={campaign.funnel.redeemed} sent={campaign.funnel.sent} tone="bg-success" />
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <MetricCard label={t('pages.campaigns.discountCost')} value={formatINR(campaign.discountCost)} className="min-w-0" />
            <MetricCard
              label={t('pages.campaigns.extraSales')}
              value={formatINR(campaign.extraSales)}
              delta={{ label: t('pages.campaigns.netAfterDiscount', { amount: formatINR(netSales) }), direction: netSales >= 0 ? 'up' : 'down' }}
              icon={netSales >= 0 ? <ArrowUpRight /> : <ArrowDownRight />}
              className="min-w-0"
            />
          </div>
        </section>
      </div>

      {failed && <p role="alert" className="px-5 pb-5 text-sm font-medium text-danger-ink sm:px-6">{t('pages.campaigns.updateFailed')}</p>}
      {action?.status === 'pending' && (
        <p className="flex items-center gap-2 border-t border-line px-5 py-4 text-sm text-slate sm:px-6">
          <Check aria-hidden className="size-4 text-accent-ink" />
          {t('pages.campaigns.pendingApproval')}{' '}
          <Link to="/actions" className="font-semibold text-accent-ink underline">{t('pages.campaigns.reviewAction')}</Link>
        </p>
      )}
    </ClayCard>
  )
}

export function Campaigns() {
  const { t } = useTranslation()
  const campaigns = useCampaigns()
  const actions = useActions()
=======
import { useTranslation } from 'react-i18next'
import { ComingNext } from '../components/layout/ComingNext'
import { PageHeader } from '../components/layout/PageHeader'
import { ErrorState, MetricCard, Skeleton } from '../components/ui'
import { useCampaigns } from '../hooks/queries'

export function Campaigns() {
  const { t } = useTranslation()
  const { data, isPending, isError, refetch } = useCampaigns()
  const campaign = data?.[0]
>>>>>>> 71ba05fa0220e615d57ef8290c5ba200c7bc64c6

  return (
    <>
      <PageHeader title={t('pages.campaigns.title')} subtitle={t('pages.campaigns.subtitle')} />
<<<<<<< HEAD
      {campaigns.isError ? (
        <ErrorState onRetry={() => void campaigns.refetch()} />
      ) : campaigns.isPending ? (
        <div className="flex flex-col gap-5">
          <Skeleton className="h-96 rounded-clay" />
          <Skeleton className="h-96 rounded-clay" />
        </div>
      ) : campaigns.data.length === 0 ? (
        <ClayCard padding="lg" className="text-center">
          <span aria-hidden className="mx-auto inline-flex size-12 items-center justify-center rounded-xl bg-well text-slate"><Megaphone className="size-6" /></span>
          <h2 className="mt-4 text-card">{t('pages.campaigns.emptyTitle')}</h2>
          <p className="mt-2 text-slate">{t('pages.campaigns.emptyBody')}</p>
        </ClayCard>
      ) : (
        <div className="flex flex-col gap-5">
          {campaigns.data.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              action={actions.data?.find((candidate) => candidate.id === campaign.actionId)}
            />
          ))}
          {actions.isError && <p role="status" className="text-sm text-slate">{t('pages.campaigns.controlsUnavailable')}</p>}
        </div>
      )}
    </>
  )
}
=======
      <ComingNext phase={5} items={[t('pages.campaigns.next1'), t('pages.campaigns.next2'), t('pages.campaigns.next3')]}>
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isPending ? (
          <Skeleton className="h-36 rounded-clay" />
        ) : (
          campaign && (
            <div className="grid gap-4 sm:grid-cols-3">
              <MetricCard
                label={campaign.name}
                value={campaign.audience.count}
                delta={{ label: t('pages.campaigns.audience', { count: campaign.audience.count }), direction: 'neutral' }}
              />
              <MetricCard label={t('pages.campaigns.delivered')} value={campaign.funnel.delivered} />
              <MetricCard label={t('pages.campaigns.redeemed')} value={campaign.funnel.redeemed} />
            </div>
          )
        )}
      </ComingNext>
    </>
  )
}
>>>>>>> 71ba05fa0220e615d57ef8290c5ba200c7bc64c6
