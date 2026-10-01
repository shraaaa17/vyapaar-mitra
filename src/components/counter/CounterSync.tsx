import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { queryKeys } from '../../hooks/queries'
import { subscribeLive } from '../../lib/api'
import { useCounter } from '../../store/counter'

/**
 * Keeps the counter store in step with the server wherever the merchant is:
 * payments pushed live (a customer paying by QR) land in the store, a bill
 * left open before a reload is picked up again, and screens built on visit
 * counts (Regulars, offers) refetch after each payment.
 */
export function CounterSync() {
  const client = useQueryClient()
  const revision = useCounter((s) => s.revision)

  useEffect(() => {
    const { loadToday, resumeBill } = useCounter.getState()
    void loadToday()
    void resumeBill()
    return subscribeLive((event) => {
      if (event.type === 'paid') useCounter.getState().receivePayment(event.payment, event.today)
    })
  }, [])

  useEffect(() => {
    if (revision === 0) return
    void client.invalidateQueries({ queryKey: queryKeys.regulars })
    void client.invalidateQueries({ queryKey: queryKeys.campaigns })
  }, [revision, client])

  return null
}
