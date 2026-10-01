import { History } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useActions, useCampaigns, useInsights } from '../../hooks/queries'
import { useNow } from '../../hooks/useNow'
import { getLanguage } from '../../i18n/languages'
import { cn } from '../../lib/cn'
import type { AgentAction, Campaign, Insight, Payment } from '../../mocks/types'
import { paymentLine, useCounter, type CounterEvent, type FeedSource } from '../../store/counter'
import { useSession } from '../../store/session'
import { ClayCard } from '../ui'
import { bodyText, clockTime, lineText } from './lines'

type Entry = Omit<CounterEvent, 'id'> & { id: string }

/** Each source gets its own edge colour: Soundbox blue, WhatsApp green, Dashboard amber, AI coral. */
const EDGE: Record<FeedSource, string> = {
  soundbox: 'border-l-accent',
  whatsapp: 'border-l-success',
  dashboard: 'border-l-caution',
  ai: 'border-l-coral',
}

const MAX_ENTRIES = 60
const DAY_MS = 24 * 60 * 60_000
const AUTO_STATUSES: AgentAction['status'][] = ['auto_done', 'paused', 'undone']

/** What the Soundbox said for each of today's payments, and the WhatsApp message it led to. */
function paymentEntries(payments: Payment[]): Entry[] {
  return payments.flatMap((p): Entry[] => {
    const at = new Date(p.paidAt).getTime()
    const said: Entry = { id: `${p.checkoutId}-said`, at, source: 'soundbox', label: { key: 'counter.feed.soundbox' }, body: paymentLine(p) }
    if (!p.whatsapp) return [said]
    const sent: Entry = {
      id: `${p.checkoutId}-wa`,
      at: at + 1,
      source: 'whatsapp',
      label: { key: 'counter.feed.whatsapp', params: { to: p.whatsapp.to } },
      body: {
        key: p.whatsapp.kind === 'reward' ? 'counter.lines.whatsappReward' : 'counter.lines.whatsappWelcomeBack',
        params: { visits: p.visit },
      },
    }
    return [said, sent]
  })
}

/** What the agent ran on its own (and the offer it sent), and what it is waiting on. */
function actionEntries(actions: AgentAction[], campaigns: Campaign[], since: number): Entry[] {
  return actions.flatMap((action): Entry[] => {
    if (action.executedAt && AUTO_STATUSES.includes(action.status)) {
      const at = new Date(action.executedAt).getTime()
      if (at < since) return []
      const ran: Entry = {
        id: `${action.id}-auto`,
        at,
        source: 'ai',
        label: { key: 'counter.feed.autoExecuted' },
        body: { text: action.title, lang: 'en' },
      }
      const campaign = campaigns.find((c) => c.id === action.campaignId)
      if (!campaign) return [ran]
      const sent: Entry = {
        id: `${action.id}-wa`,
        at: at + 1,
        source: 'whatsapp',
        label: { key: 'counter.feed.whatsappRegulars', params: { count: campaign.audience.count } },
        body: { text: campaign.message, lang: 'hi-Latn' },
      }
      return [ran, sent]
    }
    const at = new Date(action.createdAt).getTime()
    if (action.status !== 'pending' || at < since) return []
    return [{ id: `${action.id}-wait`, at, source: 'dashboard', label: { key: 'counter.feed.waiting' }, body: { text: action.title, lang: 'en' } }]
  })
}

function insightEntries(insights: Insight[], since: number): Entry[] {
  return insights.flatMap((insight): Entry[] => {
    const at = insight.createdAt ? new Date(insight.createdAt).getTime() : 0
    return at >= since
      ? [{ id: `${insight.id}-new`, at, source: 'dashboard', label: { key: 'counter.feed.insight' }, body: { text: insight.title, lang: 'en' } }]
      : []
  })
}

/**
 * Agent activity, newest first: what the Soundbox said for each payment, the
 * WhatsApp messages the agent sent, insights and approvals from the
 * dashboard, and agent cycles and the merchant's own decisions.
 */
export function ActivityCard() {
  const { t, i18n } = useTranslation()
  const language = useSession((s) => s.language)
  const today = useCounter((s) => s.today)
  const events = useCounter((s) => s.events)
  const { data: actions } = useActions()
  const { data: campaigns } = useCampaigns()
  const { data: insights } = useInsights()
  const now = useNow(60_000)
  const locale = getLanguage(language).htmlLang

  const entries = useMemo(() => {
    const since = now - DAY_MS
    return [
      ...paymentEntries(today?.recent ?? []),
      ...actionEntries(actions ?? [], campaigns ?? [], since),
      ...insightEntries(insights?.insights ?? [], since),
      ...events,
    ]
      .sort((a, b) => b.at - a.at)
      .slice(0, MAX_ENTRIES)
  }, [today, events, actions, campaigns, insights, now])

  return (
    <ClayCard as="section" aria-labelledby="activity-title" padding="none">
      <header className="flex items-center gap-3 px-5 pt-5 sm:px-6">
        <span aria-hidden className="inline-flex size-10 items-center justify-center rounded-xl bg-accent-wash text-accent-ink">
          <History className="size-5" />
        </span>
        <h2 id="activity-title" className="text-lg font-bold">
          {t('counter.activity.title')}
        </h2>
      </header>

      <div className="px-5 pt-4 pb-5 sm:px-6 sm:pb-6">
        {entries.length === 0 ? (
          <p className="rounded-2xl bg-well px-4 py-4 text-slate">{t('counter.activity.empty')}</p>
        ) : (
          // Scrolls on its own; focusable so the keyboard can scroll it too.
          <div
            role="region"
            aria-label={t('counter.activity.list')}
            tabIndex={0}
            className="-mx-1 max-h-[300px] overflow-y-auto overscroll-contain rounded-2xl px-1 py-1"
          >
            <ol className="flex flex-col gap-2">
              {entries.map((entry) => (
                <li key={entry.id} className={cn('rounded-2xl border-l-4 bg-well py-2.5 pr-3 pl-3.5', EDGE[entry.source])}>
                  <p className="text-xs font-semibold tracking-[0.08em] text-slate uppercase">
                    {lineText(i18n.t, entry.label)}
                    <span aria-hidden className="px-1.5">
                      ·
                    </span>
                    <time dateTime={new Date(entry.at).toISOString()} className="tabular-nums">
                      {clockTime(entry.at, locale)}
                    </time>
                  </p>
                  <p lang={'lang' in entry.body ? entry.body.lang : undefined} className="mt-0.5 text-[15px] leading-snug text-ink">
                    {bodyText(i18n.t, entry.body)}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </ClayCard>
  )
}
