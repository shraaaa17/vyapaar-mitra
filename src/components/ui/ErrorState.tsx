import { RefreshCw, WifiOff } from 'lucide-react'
import { ClayButton } from './ClayButton'
import { ClayCard } from './ClayCard'
import { IconBubble } from './IconBubble'

/** Friendly failure message with a retry button. */
export function ErrorState({
  title = 'Couldn’t load this',
  message = 'Check your internet and try again.',
  onRetry,
}: {
  title?: string
  message?: string
  onRetry?: () => void
}) {
  return (
    <ClayCard role="alert" padding="lg" className="flex flex-col items-center gap-4 text-center">
      <IconBubble tone="caution" size="lg">
        <WifiOff />
      </IconBubble>
      <div>
        <p className="text-card">{title}</p>
        <p className="mt-1 text-slate">{message}</p>
      </div>
      {onRetry && (
        <ClayButton variant="secondary" onClick={onRetry} leadingIcon={<RefreshCw className="size-4" />}>
          Try again
        </ClayButton>
      )}
    </ClayCard>
  )
}
