import { CheckCircle2, IndianRupee, Receipt, Sparkles, Sunrise, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '../../lib/cn'
import type { ActivityEntry } from '../../hooks/useActivityEntries'
import { clockTime, lineText } from './lines'

type Kind = ActivityEntry['kind']

const KIND_STYLE: Record<Kind, { icon: LucideIcon; className: string }> = {
  payment: { icon: IndianRupee, className: 'bg-success-wash text-success-ink' },
  agent: { icon: Sparkles, className: 'bg-accent-wash text-accent-ink' },
  decision: { icon: CheckCircle2, className: 'bg-surface-2 text-ink' },
  bill: { icon: Receipt, className: 'bg-well text-slate' },
  briefing: { icon: Sunrise, className: 'bg-caution-wash text-caution-ink' },
}

export function ActivityRows({ entries, locale }: { entries: ActivityEntry[]; locale: string }) {
  const { t, i18n } = useTranslation()
  return (
    <ol className="flex flex-col">
      {entries.map((entry, i) => {
        const { icon: Icon, className } = KIND_STYLE[entry.kind]
        return (
          <li key={entry.id} className={cn('flex gap-3 py-3', i > 0 && 'border-t border-line')}>
            <time dateTime={new Date(entry.at).toISOString()} className="w-[4.5rem] shrink-0 pt-1.5 text-xs font-medium text-slate-soft tabular-nums">
              {clockTime(entry.at, locale)}
            </time>
            <span aria-hidden className={cn('mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-lg', className)}>
              <Icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn('text-[15px] leading-snug', entry.kind === 'payment' ? 'font-semibold text-ink' : 'text-ink')}>
                {lineText(i18n.t, entry.line)}
              </p>
              {entry.detail && (
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate">
                  <span className="tabular-nums">
                    {t(entry.detail.source === 'card' ? 'counter.bill.sourceCard' : 'counter.bill.sourceUpi')} · {entry.detail.instrument}
                  </span>
                  {entry.detail.visits !== undefined && (
                    <span className="rounded-full bg-coral-wash px-2 py-0.5 text-xs font-semibold text-coral-ink">
                      {t('counter.activity.returning', { count: entry.detail.visits })}
                    </span>
                  )}
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}