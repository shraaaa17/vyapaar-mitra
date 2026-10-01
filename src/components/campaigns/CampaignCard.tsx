import { FlaskConical, MessageCircle, Users } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { useMerchant } from '../../hooks/queries'
import { getLanguage } from '../../i18n/languages'
import type { AgentAction, Campaign } from '../../mocks/types'
import { useSession } from '../../store/session'
import { AutoControls } from '../counter/AutoControls'
import { clockTime } from '../counter/lines'
import type { Decide } from '../counter/useDecide'
import { Badge, ClayCard } from '../ui'
import { CostVsSales, Funnel } from './CampaignNumbers'
import { WhatsAppPreview } from './WhatsAppPreview'

// Amber and red are kept for risk, so only a running offer gets a colour.
const STATUS_TONE = { running: 'success', paused: 'neutral', stopped: 'neutral', completed: 'neutral' } as const

/**
 * One WhatsApp offer: the message as customers saw it, who got it, how it
 * did (sent → delivered → read → redeemed) and what the discount cost
 * against the extra sales. When Mitra sent it on its own, Pause, Undo and
 * "Why?" sit underneath.
 */
export function CampaignCard({
  campaign,
  action,
  busy,
  failed,
  onDecide,
}: {
  campaign: Campaign
  action?: AgentAction
  busy: boolean
  failed: boolean
  onDecide: Decide
}) {
  const { t } = useTranslation()
  const titleId = useId()
  const language = useSession((s) => s.language)
  const { data: merchant } = useMerchant()
  const sentAt = action?.executedAt ? clockTime(action.executedAt, getLanguage(language).htmlLang) : undefined
  const status = campaign.status

  return (
    <ClayCard as="article" aria-labelledby={titleId} padding="none" className="flex flex-col gap-6 p-5 sm:p-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={STATUS_TONE[status]}>{t(`pages.campaigns.status.${status}`)}</Badge>
          <Badge tone="cyan" icon={<MessageCircle />}>
            {t('pages.campaigns.whatsapp')}
          </Badge>
          {campaign.simulated && (
            <Badge tone="neutral" icon={<FlaskConical />}>
              {t('pages.campaigns.pilot')}
            </Badge>
          )}
        </div>
        <h2 id={titleId} lang="en" className="text-2xl leading-tight font-bold tracking-[-0.02em]">
          {campaign.name}
        </h2>
        <p className="flex items-start gap-2 text-slate">
          <Users aria-hidden className="mt-0.5 size-[18px] shrink-0 text-accent-ink" />
          <span>
            <span className="font-semibold text-ink">{t('pages.campaigns.audience', { count: campaign.audience.count })}</span>{' '}
            {t('pages.campaigns.audienceNote')}
          </span>
        </p>
        {(status === 'paused' || status === 'stopped') && (
          <p className="rounded-xl bg-well px-3 py-2 text-sm font-medium text-ink">
            {t(status === 'paused' ? 'pages.campaigns.pausedNote' : 'pages.campaigns.stoppedNote')}
          </p>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-x-8">
        <section aria-labelledby={`${titleId}-message`} className="flex flex-col gap-3">
          <h3 id={`${titleId}-message`} className="text-base font-bold">
            {t('pages.campaigns.messageTitle')}
          </h3>
          <WhatsAppPreview storeName={merchant?.storeName ?? t('common.appName')} message={campaign.message} time={sentAt} />
        </section>
        <section aria-labelledby={`${titleId}-funnel`} className="flex flex-col gap-3">
          <h3 id={`${titleId}-funnel`} className="text-base font-bold">
            {t('pages.campaigns.funnelTitle')}
          </h3>
          <Funnel funnel={campaign.funnel} />
        </section>
        <section aria-labelledby={`${titleId}-money`} className="flex flex-col gap-3 lg:col-span-2">
          <h3 id={`${titleId}-money`} className="text-base font-bold">
            {t('pages.campaigns.moneyTitle')}
          </h3>
          <CostVsSales campaign={campaign} cap={action?.costCap} />
        </section>
      </div>

      {campaign.simulated && (
        <p className="flex items-start gap-2 text-sm text-slate">
          <FlaskConical aria-hidden className="mt-0.5 size-4 shrink-0" />
          {t('pages.campaigns.pilotNote')}
        </p>
      )}

      {action && (
        <div className="flex flex-col gap-3 border-t border-line pt-4">
          <AutoControls action={action} busy={busy} failed={failed} onDecide={onDecide} />
        </div>
      )}
    </ClayCard>
  )
}
