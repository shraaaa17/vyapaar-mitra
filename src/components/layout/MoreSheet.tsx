import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ChevronRight, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { moreNav } from '../../data/appNav'
import { useMerchant } from '../../hooks/queries'
import { cn } from '../../lib/cn'
import { useUi } from '../../store/ui'
import { IconBubble } from '../ui/IconBubble'
import { useTranslation } from 'react-i18next'

/** Mobile bottom sheet holding the secondary sections. */
export function MoreSheet() {
  const { t } = useTranslation()
  const open = useUi((s) => s.moreOpen)
  const setOpen = useUi((s) => s.setMoreOpen)
  const { pathname } = useLocation()
  const { data: merchant } = useMerchant()
  const reduceMotion = useReducedMotion()
  const closeRef = useRef<HTMLButtonElement>(null)

  // Close whenever navigation happens.
  useEffect(() => setOpen(false), [pathname, setOpen])

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, setOpen])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <motion.div
            aria-hidden
            className="absolute inset-0 bg-paytm-blue/30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="more-sheet-title"
            className="absolute inset-x-0 bottom-0 rounded-t-[32px] bg-cloud px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+20px)] [box-shadow:0_-16px_40px_rgb(0_46_110/0.18)]"
            initial={reduceMotion ? { opacity: 0 } : { y: '100%' }}
            animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
          >
            <div aria-hidden className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-frost" />
            <div className="mb-4 flex items-center justify-between px-1">
              <h2 id="more-sheet-title" className="text-lg font-bold">
                {t('nav.more')}
              </h2>
              <button
                ref={closeRef}
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t('shell.closeMenu')}
                className="clay-button inline-flex size-12 items-center justify-center bg-white text-paytm-blue [box-shadow:var(--clay-shadow-soft)]"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>

            <ul className="clay-card flex flex-col p-2">
              {moreNav.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'flex min-h-14 items-center gap-3 rounded-2xl px-3 font-medium text-paytm-blue transition-colors hover:bg-cloud',
                          isActive && 'bg-sky-wash',
                        )
                      }
                    >
                      <IconBubble size="sm">
                        <Icon />
                      </IconBubble>
                      <span className="flex-1">{t(item.labelKey)}</span>
                      <ChevronRight aria-hidden className="size-5 text-slate-soft" />
                    </NavLink>
                  </li>
                )
              })}
            </ul>

            {merchant && (
              <p className="mt-4 text-center text-xs text-slate-soft">
                {merchant.storeName} · {merchant.id}
              </p>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
