import { useEffect, useMemo } from 'react'
import { useActions } from './queries'
import { useNow } from './useNow'
import { getLanguage } from '../i18n/languages'
import type { AgentAction } from '../mocks/types'
import { useCounter, type CounterEventKind, type Line } from '../store/counter'
import { useSession } from '../store/session'

type Kind = CounterEventKind | 'payment'

export type ActivityEntry = {
  id: string
  at: number
  kind: Kind
  line: Line
  detail?: { instrument: string; source: 'card' | 'upi'; visits?: number }
}

const DAY_MS = 24 * 60 * 60_000

function actionEntries(actions: AgentAction[], since: number): ActivityEntry[] {
  return actions.flatMap((action): ActivityEntry[] => {
    if (action.executedAt && ['auto_done', 'paused', 'undone'].includes(action.status)) {
      const at = new Date(action.executedAt).getTime()
      return at >= since
        ? [{ id: `${action.id}-auto`, at, kind: 'agent', line: { key: 'counter.lines.autoDone', params: { type: action.type, cap: action.costCap } } }]
        : []
    }
    const at = new Date(action.createdAt).getTime()
    if (at < since || action.status === 'completed') return []
    const line: Line = action.loan
      ? { key: 'counter.lines.loanFound', params: { amount: action.loan.amount } }
      : { key: 'counter.lines.suggested', params: { type: action.type } }
    return [{ id: `${action.id}-new`, at, kind: 'agent', line }]
  })
}

export function useActivityEntries(includeEarlierActions = false) {
  const language = useSession((state) => state.language)
  const today = useCounter((state) => state.today)
  const loadToday = useCounter((state) => state.loadToday)
  const events = useCounter((state) => state.events)
  const { data: actions, isPending: actionsPending } = useActions()
  const now = useNow(60_000)
  const locale = getLanguage(language).htmlLang
  const todayError = useCounter((state) => state.todayError)

  useEffect(() => {
    void loadToday()
  }, [loadToday])

  const entries = useMemo(() => {
    const payments: ActivityEntry[] = (today?.recent ?? []).map((payment) => ({
      id: payment.id,
      at: new Date(payment.paidAt).getTime(),
      kind: 'payment',
      line: { key: 'counter.lines.paymentIn', params: { amount: payment.amount } },
      detail: {
        instrument: payment.instrumentMasked,
        source: payment.source,
        visits: payment.customer.returning ? payment.customer.visits : undefined,
      },
    }))
    const fromEvents: ActivityEntry[] = events.map((event) => ({ id: event.id, at: event.at, kind: event.kind, line: event.line }))
    const actionsSince = includeEarlierActions ? Number.NEGATIVE_INFINITY : now - DAY_MS
    return [...payments, ...fromEvents, ...actionEntries(actions ?? [], actionsSince)].sort((a, b) => b.at - a.at)
  }, [today, events, actions, now, includeEarlierActions])

  return { entries, locale, isLoading: (today === null && !todayError) || actionsPending }
}