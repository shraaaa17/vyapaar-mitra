import { Outlet } from 'react-router-dom'
import { BottomTabs } from './BottomTabs'
import { MobileHeader } from './MobileHeader'
import { MoreSheet } from './MoreSheet'
import { Sidebar } from './Sidebar'
import { useTranslation } from 'react-i18next'

/**
 * Signed-in layout. One component tree for every screen size: a sidebar from
 * 768px up, a header + bottom tab bar below it. Pages render into a centred
 * ~1100px column.
 */
export function AppShell() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('main')?.focus()
        }}
        className="sr-only z-[60] rounded-full bg-paytm-blue px-5 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        {t('shell.skipToContent')}
      </a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileHeader />
        <main id="main" tabIndex={-1} className="flex-1 pb-28 outline-none md:pb-12">
          <div className="mx-auto w-full max-w-[1100px] px-4 pt-6 sm:px-6 md:pt-10 lg:px-10">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomTabs />
      <MoreSheet />
    </div>
  )
}
