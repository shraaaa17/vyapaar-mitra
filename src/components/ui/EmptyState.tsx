import { Illustration } from '../illustrations/Illustration'
import { ClayCard } from './ClayCard'

/** Nothing to show yet: Mitra waiting beside a short explanation. */
export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <ClayCard padding="lg" className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
      <Illustration name="mitra-empty" className="w-24 shrink-0 sm:w-28" />
      <div>
        <p className="text-card">{title}</p>
        <p className="mt-1 text-slate">{message}</p>
      </div>
    </ClayCard>
  )
}
