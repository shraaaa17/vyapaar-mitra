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
import type { en } from '../i18n/locales/en'

type NavKey = `nav.${Exclude<keyof typeof en.nav, 'main' | 'more'>}`

export type AppNavItem = {
  to: string
  labelKey: NavKey
  /** Shorter label for the mobile tab bar. */
  shortLabelKey?: NavKey
  icon: LucideIcon
  /** Shows the pending-approval count. */
  badge?: 'pending'
}

/** Primary sections: bottom tabs on mobile, top of the sidebar on desktop. */
export const primaryNav: AppNavItem[] = [
  { to: '/', labelKey: 'nav.home', icon: House },
  { to: '/actions', labelKey: 'nav.actions', icon: ListChecks, badge: 'pending' },
  { to: '/campaigns', labelKey: 'nav.campaigns', icon: Megaphone },
  { to: '/credit', labelKey: 'nav.credit', shortLabelKey: 'nav.creditShort', icon: Wallet },
  { to: '/ask', labelKey: 'nav.ask', shortLabelKey: 'nav.askShort', icon: Sparkles },
]

/** Secondary sections: the "More" sheet on mobile, lower sidebar on desktop. */
export const moreNav: AppNavItem[] = [
  { to: '/regulars', labelKey: 'nav.regulars', icon: Users },
  { to: '/impact', labelKey: 'nav.impact', icon: TrendingUp },
  { to: '/settings', labelKey: 'nav.settings', icon: Settings },
]
