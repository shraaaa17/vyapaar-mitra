import { NavLink } from 'react-router-dom'
import { moreNav, primaryNav, type AppNavItem } from '../../data/appNav'
import { useMerchant, usePendingCount } from '../../hooks/queries'
import { cn } from '../../lib/cn'
import { FloatingOrb } from '../ui/FloatingOrb'
import { Logo } from '../ui/Logo'
import { NavBadge } from './NavBadge'
import { useTranslation } from 'react-i18next'

function SidebarLink({ item, pendingCount }: { item: AppNavItem; pendingCount: number }) {
  const { t } = useTranslation()
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        cn(
          'group flex min-h-12 items-center gap-3 rounded-2xl px-4 text-[15px] font-medium transition-all duration-200',
          isActive
            ? 'bg-white text-paytm-blue [box-shadow:var(--clay-shadow-soft)]'
            : 'text-slate hover:bg-white/60 hover:text-paytm-blue',
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'inline-flex size-9 items-center justify-center rounded-xl transition-colors',
              isActive ? 'bg-paytm-blue text-white' : 'bg-mist text-paytm-blue group-hover:bg-sky-wash',
            )}
          >
            <Icon aria-hidden className="size-[18px]" />
          </span>
          <span className="flex-1">{t(item.labelKey)}</span>
          {item.badge === 'pending' && <NavBadge count={pendingCount} />}
        </>
      )}
    </NavLink>
  )
}

/** Desktop and tablet navigation (≥768px). */
export function Sidebar() {
  const { t } = useTranslation()
  const pendingCount = usePendingCount()
  const { data: merchant } = useMerchant()

  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r border-frost/70 bg-cloud px-4 py-6 md:flex lg:w-72">
      <div className="px-2">
        <Logo />
      </div>

      <nav aria-label={t('nav.main')} className="flex flex-1 flex-col gap-6 overflow-y-auto">
        <ul className="flex flex-col gap-1.5">
          {primaryNav.map((item) => (
            <li key={item.to}>
              <SidebarLink item={item} pendingCount={pendingCount} />
            </li>
          ))}
        </ul>
        <div>
          <p className="px-4 pb-2 text-eyebrow text-slate-soft uppercase">{t('nav.more')}</p>
          <ul className="flex flex-col gap-1.5">
            {moreNav.map((item) => (
              <li key={item.to}>
                <SidebarLink item={item} pendingCount={pendingCount} />
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="clay-soft flex items-center gap-3 p-3">
        <span className="inline-flex size-10 items-center justify-center rounded-full bg-paytm-blue text-sm font-bold text-white">
          {merchant?.name.charAt(0) ?? 'R'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-paytm-blue">{merchant?.storeName ?? t('shell.yourStore')}</p>
          <p className="truncate text-xs text-slate-soft">{merchant?.id ?? '···'}</p>
        </div>
        <FloatingOrb size="xs" label={t('shell.watching')} />
      </div>
    </aside>
  )
}
