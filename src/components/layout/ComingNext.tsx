import { Hammer } from 'lucide-react'
import type { ReactNode } from 'react'
import { ClayCard } from '../ui/ClayCard'
import { IconBubble } from '../ui/IconBubble'

/**
 * Temporary panel for screens whose full UI lands in a later build phase.
 * Removed once each screen is built.
 */
export function ComingNext({ phase, items, children }: { phase: number; items: string[]; children?: ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      {children}
      <ClayCard elevation="inset" tone="cloud" padding="lg" className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <IconBubble tone="cloud">
          <Hammer />
        </IconBubble>
        <div>
          <p className="font-semibold text-paytm-blue">Full screen arrives in build phase {phase}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </ClayCard>
    </div>
  )
}
