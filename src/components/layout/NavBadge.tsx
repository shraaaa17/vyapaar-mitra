import { cn } from '../../lib/cn'

/** Small count bubble for nav items, e.g. actions awaiting approval. */
export function NavBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null
  return (
    <span
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-paytm-cyan px-1.5 text-[11px] leading-none font-bold text-paytm-blue',
        className,
      )}
    >
      {count}
      <span className="sr-only"> waiting for approval</span>
    </span>
  )
}
