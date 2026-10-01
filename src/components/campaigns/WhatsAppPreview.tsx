import { CheckCheck, Store } from 'lucide-react'
import { useTranslation } from 'react-i18next'

/**
 * The offer as customers saw it: a WhatsApp-style chat from the shop's
 * business account, with the time it went out and blue "read" ticks.
 */
export function WhatsAppPreview({ storeName, message, time }: { storeName: string; message: string; time?: string }) {
  const { t } = useTranslation()
  return (
    <figure className="overflow-hidden rounded-[22px] border border-line bg-well">
      <figcaption className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3">
        <span aria-hidden className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-success-wash text-success-ink">
          <Store className="size-5" />
        </span>
        <span className="min-w-0">
          <span lang="en" className="block truncate font-semibold text-ink">
            {storeName}
          </span>
          <span className="block text-xs text-slate">{t('pages.campaigns.businessAccount')}</span>
        </span>
      </figcaption>
      <div className="px-4 py-5">
        <div className="relative max-w-[34ch] rounded-2xl rounded-tl-sm bg-success-wash px-3.5 pt-2.5 pb-2 text-ink [box-shadow:0_1px_2px_rgb(10_31_68/0.08)]">
          <p lang="hi-Latn" className="text-[15px] leading-relaxed break-words whitespace-pre-line">
            {message}
          </p>
          {time && (
            <p className="mt-1 flex items-center justify-end gap-1 text-xs text-slate">
              <span className="tabular-nums">{time}</span>
              <CheckCheck aria-hidden className="size-4 text-accent-ink" />
              <span className="sr-only">{t('pages.campaigns.readTicks')}</span>
            </p>
          )}
        </div>
      </div>
    </figure>
  )
}
