import { MessageCircle, MessageCircleOff, UserRound } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getLanguage } from '../../i18n/languages'
import { cn } from '../../lib/cn'
import { formatINR } from '../../lib/format'
import type { LanguageCode, Regular } from '../../mocks/types'
import { useSession } from '../../store/session'
import { Badge } from '../ui'
import { rewardState } from './reward'

const DAY_MS = 24 * 60 * 60_000

/** Whole calendar days between a date and now, by the shop's clock. */
function daysSince(iso: string, now: number) {
  const day = (time: number) => {
    const d = new Date(time)
    d.setHours(0, 0, 0, 0)
    return d.getTime()
  }
  return Math.max(0, Math.round((day(now) - day(new Date(iso).getTime())) / DAY_MS))
}

/** "12 Aug" in the merchant's language (English month names for Hinglish), with the same digits as the amounts. */
function dayMonth(iso: string, language: LanguageCode) {
  const locale = language === 'hinglish' ? 'en-IN' : getLanguage(language).htmlLang
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', numberingSystem: 'latn' }).format(new Date(iso))
}

/**
 * One regular, masked to the last 2 digits: visits, last visit, average
 * bill, progress to the loyalty reward (with the "12th visit" badge) and
 * whether they agreed to WhatsApp messages.
 */
export function RegularCard({ regular, now }: { regular: Regular; now: number }) {
  const { t } = useTranslation()
  const language = useSession((s) => s.language)
  const reward = rewardState(regular)
  const every = regular.reward.everyNVisits
  const days = daysSince(regular.lastVisit, now)
  const lastVisit =
    days === 0
      ? t('pages.regulars.lastVisitToday')
      : days === 1
        ? t('pages.regulars.lastVisitYesterday')
        : t('pages.regulars.lastVisitDays', { count: days })
  const { consent } = regular

  return (
    <article className="flex h-full flex-col gap-4 rounded-[22px] border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span aria-hidden className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-well text-ink">
            <UserRound className="size-5" />
          </span>
          <div className="min-w-0">
            <h3 lang="en" className="font-semibold text-ink tabular-nums">
              {regular.masked}
            </h3>
            <p className="text-sm text-slate">
              {lastVisit}
              <span aria-hidden className="px-1.5">
                ·
              </span>
              {t('pages.regulars.avgBill', { amount: formatINR(regular.avgBasket) })}
            </p>
          </div>
        </div>
        <p className="shrink-0 text-right text-lg font-bold text-ink tabular-nums">{t('pages.regulars.visits', { count: regular.visits })}</p>
      </div>

      {reward.kind === 'progress' ? (
        <div>
          <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm">
            <span className="font-medium text-ink">{t('pages.regulars.toGo', { count: reward.toGo, n: every })}</span>
            <span className="text-slate tabular-nums">{t('pages.regulars.along', { along: reward.along, n: every })}</span>
          </p>
          <span aria-hidden className="mt-1.5 block h-2 overflow-hidden rounded-full bg-well">
            <span className="block h-full rounded-full bg-accent" style={{ width: `${(reward.along / every) * 100}%` }} />
          </span>
        </div>
      ) : (
        <p className="flex flex-wrap items-center gap-2 text-sm">
          <Badge tone={reward.kind === 'ready' ? 'blue' : 'cyan'}>{t('pages.regulars.nthVisit', { n: every })}</Badge>
          <span className={cn('font-medium', reward.kind === 'ready' ? 'text-ink' : 'text-slate')}>
            {t(reward.kind === 'ready' ? 'pages.regulars.rewardReady' : 'pages.regulars.rewardUsed')}
          </span>
        </p>
      )}

      <p
        className={cn(
          'mt-auto flex items-start gap-2 rounded-xl px-3 py-2 text-sm',
          consent.whatsappOptIn ? 'bg-success-wash text-success-ink' : 'bg-well text-slate',
        )}
      >
        {consent.whatsappOptIn ? (
          <MessageCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
        ) : (
          <MessageCircleOff aria-hidden className="mt-0.5 size-4 shrink-0" />
        )}
        <span>
          <span className="font-semibold">{t(consent.whatsappOptIn ? 'pages.regulars.consentYes' : 'pages.regulars.consentNo')}</span>{' '}
          {consent.whatsappOptIn
            ? consent.optedInAt && t('pages.regulars.consentSince', { date: dayMonth(consent.optedInAt, language) })
            : t('pages.regulars.consentNoNote')}
        </span>
      </p>
    </article>
  )
}
