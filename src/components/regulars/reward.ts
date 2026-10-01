import type { Regular } from '../../mocks/types'

/** Where a regular stands on the loyalty reward: ready, just used, or how far along. */
export function rewardState({ visits, reward }: Regular) {
  const every = reward.everyNVisits
  const along = visits % every
  if (reward.status === 'earned') return { kind: 'ready', along: every, toGo: 0 } as const
  if (along === 0 && visits > 0) return { kind: 'used', along: every, toGo: 0 } as const
  return { kind: 'progress', along, toGo: every - along } as const
}
