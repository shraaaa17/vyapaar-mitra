import { LayoutGrid } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useUi } from '../../store/ui'
import { Logo } from '../ui/Logo'
import { useTranslation } from 'react-i18next'

/** Top bar on mobile: wordmark plus the "More" menu (Regulars, Impact, Settings). */
export function MobileHeader() {
  const { t } = useTranslation()
  const moreOpen = useUi((s) => s.moreOpen)
  const setMoreOpen = useUi((s) => s.setMoreOpen)

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line/60 bg-canvas/95 px-4 md:hidden">
      <Link to="/" aria-label={t('shell.homeLink')} className="rounded-full">
        <Logo compact />
      </Link>
      <button
        type="button"
        onClick={() => setMoreOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={moreOpen}
        className="clay-button inline-flex h-12 items-center gap-2 bg-surface px-4 text-sm font-semibold text-ink [box-shadow:var(--clay-shadow-soft)]"
      >
        <LayoutGrid aria-hidden className="size-[18px]" />
        {t('nav.more')}
      </button>
    </header>
  )
}
