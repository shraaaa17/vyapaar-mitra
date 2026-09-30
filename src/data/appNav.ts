import {
  House,
  ListChecks,
  Megaphone,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export type AppNavItem = {
  to: string
  label: string
  /** Short label for the mobile tab bar. */
  shortLabel?: string
  icon: LucideIcon
  /** Shows the pending-approval count. */
  badge?: 'pending'
}

/** Primary sections: bottom tabs on mobile, top of the sidebar on desktop. */
export const primaryNav: AppNavItem[] = [
  { to: '/', label: 'Home', icon: House },
  { to: '/actions', label: 'Actions', icon: ListChecks, badge: 'pending' },
  { to: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { to: '/credit', label: 'Credit & Cashflow', shortLabel: 'Credit', icon: Wallet },
  { to: '/ask', label: 'Ask Mitra', icon: Sparkles },
]

/** Secondary sections: the "More" sheet on mobile, lower sidebar on desktop. */
export const moreNav: AppNavItem[] = [
  { to: '/regulars', label: 'Regulars', icon: Users },
  { to: '/impact', label: 'Impact', icon: TrendingUp },
  { to: '/settings', label: 'Settings', icon: Settings },
]
