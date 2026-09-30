import { NavLink } from 'react-router-dom'
import { primaryNav } from '../../data/appNav'
import { usePendingCount } from '../../hooks/queries'
import { cn } from '../../lib/cn'
import { NavBadge } from './NavBadge'

/** Mobile bottom tab bar (<768px). */
export function BottomTabs() {
  const pendingCount = usePendingCount()

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-frost/70 bg-white pb-[env(safe-area-inset-bottom)] [box-shadow:0_-8px_24px_rgb(0_46_110/0.06)] md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {primaryNav.map((item) => {
          const Icon = item.icon
          return (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'relative flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[11px] font-medium transition-colors',
                    isActive ? 'text-paytm-blue' : 'text-slate-soft hover:text-paytm-blue',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'relative inline-flex h-8 w-12 items-center justify-center rounded-full transition-all duration-200',
                        isActive && 'bg-sky-wash text-paytm-cyan-600',
                      )}
                    >
                      <Icon aria-hidden className="size-[22px]" strokeWidth={isActive ? 2.4 : 2} />
                      {item.badge === 'pending' && (
                        <NavBadge count={pendingCount} className="absolute -top-1 -right-1 h-[18px] min-w-[18px] text-[10px]" />
                      )}
                    </span>
                    <span className={cn(isActive && 'font-semibold')}>{item.shortLabel ?? item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
