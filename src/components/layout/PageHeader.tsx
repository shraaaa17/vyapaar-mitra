import type { ReactNode } from 'react'

/** Title block at the top of every app screen. */
export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 md:mb-8">
      <div className="min-w-0">
        <h1 className="text-[28px] leading-tight font-bold tracking-[-0.025em] md:text-[36px]">{title}</h1>
        {subtitle && <p className="mt-1 text-slate md:text-body-lg">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  )
}
