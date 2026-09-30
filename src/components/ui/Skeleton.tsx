import { cn } from '../../lib/cn'

/** Soft shimmering placeholder shown while data loads. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn('block animate-pulse rounded-2xl bg-frost/70', className)} />
}
