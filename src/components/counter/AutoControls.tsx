import { Pause, Play, Undo2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNow } from '../../hooks/useNow'
import type { AgentAction } from '../../mocks/types'
import { ClayButton } from '../ui'
import type { Decide } from './useDecide'
import { useWhy } from './useWhy'
import { WhyButton, WhyPanel } from './WhyPanel'

/**
 * Pause (or Resume), Undo while the undo window is open, and "Why?" for
 * something Mitra did on its own. Used on the Counter and on Campaigns.
 */
export function AutoControls({
  action,
  busy,
  failed,
  onDecide,
}: {
  action: AgentAction
  busy: boolean
  failed: boolean
  onDecide: Decide
}) {
  const { t } = useTranslation()
  const why = useWhy()
  const now = useNow(15_000)
  const paused = action.status === 'paused'
  const live = paused || action.status === 'auto_done'
  const undoLeft = action.undoUntil ? Math.ceil((new Date(action.undoUntil).getTime() - now) / 60_000) : 0
  const canUndo = live && undoLeft > 0

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        {live && (
          <ClayButton
            size="sm"
            variant="secondary"
            aria-disabled={busy || undefined}
            onClick={() => !busy && onDecide({ actionId: action.id, decision: paused ? 'resume' : 'pause' })}
            leadingIcon={paused ? <Play className="size-4" /> : <Pause className="size-4" />}
          >
            {paused ? t('counter.approvals.resume') : t('counter.approvals.pause')}
          </ClayButton>
        )}
        {canUndo && (
          <ClayButton
            size="sm"
            variant="secondary"
            aria-disabled={busy || undefined}
            onClick={() => !busy && onDecide({ actionId: action.id, decision: 'undo' })}
            leadingIcon={<Undo2 className="size-4" />}
          >
            {t('counter.approvals.undo')}
          </ClayButton>
        )}
        <WhyButton {...why} className={live ? 'ml-auto' : '-ml-3'} />
      </div>
      {live && (
        <p className="text-sm text-slate-soft">
          {canUndo ? t('counter.approvals.undoLeft', { count: undoLeft }) : t('counter.approvals.undoClosed')}
        </p>
      )}
      {failed && (
        <p role="alert" className="text-sm font-medium text-danger-ink">
          {t('counter.approvals.failed')}
        </p>
      )}
      <WhyPanel why={action.why} open={why.open} panelId={why.panelId} />
    </>
  )
}
