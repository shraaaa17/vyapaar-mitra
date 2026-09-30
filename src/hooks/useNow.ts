import { useEffect, useState } from 'react'

/** Current time, refreshed every `intervalMs` until it reaches `until`. */
export function useNow(intervalMs = 1000, until = Infinity) {
  const [now, setNow] = useState(() => Date.now())
  const active = now < until
  useEffect(() => {
    if (!active) return
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs, active])
  return now
}
