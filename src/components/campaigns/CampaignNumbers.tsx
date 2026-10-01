import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/cn'
import { formatINR } from '../../lib/format'
import type { Campaign } from '../../mocks/types'

const STEPS = ['sent', 'delivered', 'read', 'redeemed'] as const

const ratioFormat = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 })

/** Share of `part` in `whole` as a whole percent, 0 when there's nothing to divide by. */
const percent = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0)

/**
 * Sent → delivered → read → redeemed. Every bar is measured against the
 * messages sent; the numbers are written out, so the bars are only a picture.
 */
export function Funnel({ funnel }: { funnel: Campaign['funnel'] }) {
  const { t } = useTranslation()
  return (
    <ol className="flex flex-col gap-3">
      {STEPS.map((step) => {
        const pct = percent(funnel[step], funnel.sent)
        const last = step === 'redeemed'
        return (
          <li key={step}>
            <p className="flex items-baseline justify-between gap-3">
              <span className={cn('text-sm', last ? 'font-semibold text-ink' : 'text-slate')}>{t(`pages.campaigns.${step}`)}</span>
              <span className="text-right">
                <span className="text-lg font-bold text-ink tabular-nums">{funnel[step]}</span>
                {step !== 'sent' && (
                  <>
                    {' '}
                    <span className="ml-1 text-sm text-slate tabular-nums">{t('pages.campaigns.ofSent', { pct })}</span>
                  </>
                )}
              </span>
            </p>
            <span aria-hidden className="mt-1.5 block h-2.5 overflow-hidden rounded-full bg-well">
              <span className={cn('block h-full rounded-full', last ? 'bg-success' : 'bg-accent')} style={{ width: `${pct}%` }} />
            </span>
          </li>
        )
      })}
    </ol>
  )
}

/** What the discount cost against the extra sales it brought, and how much of the spend cap it used. */
export function CostVsSales({ campaign, cap }: { campaign: Campaign; cap?: number }) {
  const { t } = useTranslation()
  const { discountCost, extraSales } = campaign
  const scale = Math.max(discountCost, extraSales)
  const capUsed = cap ? Math.min(100, percent(discountCost, cap)) : 0
  const rows = [
    { label: t('pages.campaigns.discountCost'), value: discountCost, bar: 'bg-coral' },
    { label: t('pages.campaigns.extraSales'), value: extraSales, bar: 'bg-success' },
  ]

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:items-start lg:gap-x-8">
      <dl className="flex flex-col gap-3">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[1fr_auto] items-baseline gap-x-3">
            <dt className="text-sm text-slate">{row.label}</dt>
            <dd className="text-lg font-bold text-ink tabular-nums">{formatINR(row.value)}</dd>
            {/* The bar only pictures the figure above it. */}
            <dd aria-hidden className="col-span-2 mt-1.5 h-2.5 overflow-hidden rounded-full bg-well">
              <span className={cn('block h-full rounded-full', row.bar)} style={{ width: `${percent(row.value, scale)}%` }} />
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-4">
        {discountCost > 0 && (
          <p className="rounded-xl bg-success-wash px-3 py-2 text-sm font-medium text-success-ink">
            {t('pages.campaigns.ratio', { ratio: ratioFormat.format(extraSales / discountCost) })}
          </p>
        )}
        {cap !== undefined && (
          <div>
            <p className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-slate">{t('pages.campaigns.capTitle')}</span>
              <span className="font-semibold text-ink tabular-nums">
                {t('pages.campaigns.capUsed', { used: formatINR(discountCost), cap: formatINR(cap) })}
              </span>
            </p>
            <span aria-hidden className="mt-1.5 block h-2 overflow-hidden rounded-full bg-well">
              <span className="block h-full rounded-full bg-accent" style={{ width: `${capUsed}%` }} />
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
