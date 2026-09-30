import { Check, CloudOff, Loader2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useTrustSettings, useUpdateTrustSettings } from '../../hooks/queries'
import { RECOMMENDED_TRUST } from '../../lib/trust'
import type { TrustSettings } from '../../mocks/types'
import { ClayButton, ErrorState, Skeleton } from '../ui'
import { ResetTrustButton, SafetyLimitsPanel, TrustModesPanel } from './TrustPanels'

const SAVE_DELAY_MS = 500

/**
 * Trust Settings wired to the API for the Settings screen: every change is
 * saved on its own (quick taps on the spend cap are batched), with a small
 * status line so the merchant knows it stuck.
 */
export function ConnectedTrustSettings({ section }: { section: 'modes' | 'limits' }) {
  const { t } = useTranslation()
  const { data, isPending, isError, refetch } = useTrustSettings()
  const save = useUpdateTrustSettings()
  const [draft, setDraft] = useState<TrustSettings | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const value = draft ?? data

  useEffect(() => () => window.clearTimeout(timer.current), [])

  if (isError) return <ErrorState onRetry={() => refetch()} />
  if (isPending || !value) return <Skeleton className="h-64 rounded-clay" />

  const change = (next: TrustSettings) => {
    setDraft(next)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => save.mutate(next, { onSettled: () => setDraft(null) }), SAVE_DELAY_MS)
  }

  const Panel = section === 'modes' ? TrustModesPanel : SafetyLimitsPanel
  const status = save.isPending || draft ? 'saving' : save.isError ? 'failed' : save.isSuccess ? 'saved' : null

  return (
    <div className="flex flex-col gap-4">
      <Panel value={value} onChange={change} columns={2} />
      <div className="flex min-h-12 flex-wrap items-center justify-between gap-3">
        <ResetTrustButton value={value} onReset={() => change(RECOMMENDED_TRUST)} />
        <p role="status" className="ml-auto flex items-center gap-2 text-sm font-medium">
          {status === 'saving' && (
            <>
              <Loader2 aria-hidden className="size-4 animate-spin text-slate-soft" />
              <span className="text-slate">{t('trust.saving')}</span>
            </>
          )}
          {status === 'saved' && (
            <>
              <Check aria-hidden className="size-4 text-success-ink" />
              <span className="text-success-ink">{t('trust.saved')}</span>
            </>
          )}
          {status === 'failed' && (
            <>
              <CloudOff aria-hidden className="size-4 text-danger" />
              <span className="text-danger">{t('trust.saveFailed')}</span>
              <ClayButton variant="ghost" size="sm" onClick={() => change(value)}>
                {t('trust.retry')}
              </ClayButton>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
