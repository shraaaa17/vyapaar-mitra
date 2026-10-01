import { useState } from 'react'
import { useActionDecision } from '../../hooks/queries'
import type { ActionDecisionRequest, AgentAction } from '../../mocks/types'
import { useCounter, type Line } from '../../store/counter'

/** What a confirmed decision adds to the activity feed, under "You". */
function decisionLine(action: AgentAction, { decision }: ActionDecisionRequest): Line {
  switch (decision) {
    case 'approve':
      return action.loan ? { key: 'counter.lines.loanApplied', params: { amount: action.loan.amount } } : { key: 'counter.lines.approved' }
    case 'reject':
      return { key: 'counter.lines.rejected' }
    case 'pause':
      return { key: 'counter.lines.paused', params: { type: action.type } }
    case 'resume':
      return { key: 'counter.lines.resumed', params: { type: action.type } }
    case 'undo':
      return { key: 'counter.lines.undone', params: { type: action.type } }
  }
}

/**
 * Approve / reject / pause / resume / undo from any screen. Each confirmed
 * decision is logged to the Counter's activity feed; `busyId` is the action
 * waiting on the server and `failedId` the one whose last decision failed.
 */
export function useDecide() {
  const [failedId, setFailedId] = useState<string | null>(null)
  const decision = useActionDecision((action, request) =>
    useCounter.getState().log('ai', { key: 'counter.feed.you' }, decisionLine(action, request)),
  )

  const decide = (request: ActionDecisionRequest) => {
    setFailedId(null)
    decision.mutate(request, { onError: () => setFailedId(request.actionId) })
  }
  const busyId = decision.isPending ? decision.variables?.actionId : undefined

  return { decide, busyId, failedId }
}

export type Decide = ReturnType<typeof useDecide>['decide']
