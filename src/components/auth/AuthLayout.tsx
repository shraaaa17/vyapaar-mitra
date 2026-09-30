import { Lock, Megaphone, Sunrise } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { LanguageSelect } from '../language/LanguageSelect'
import { MitraHero } from '../illustrations'
import { FloatingOrb, Logo } from '../ui'

/**
 * Sign-in frame: Mitra greets the merchant beside the form on wide screens,
 * and above it (smaller, speech bubble to the side) on phones.
 */
export function AuthLayout({ bubble, children }: { bubble: string; children: ReactNode }) {
  const { t } = useTranslation()
  const promises = [
    { icon: Sunrise, text: t('auth.promise1') },
    { icon: Megaphone, text: t('auth.promise2') },
    { icon: Lock, text: t('auth.promise3') },
  ]

  return (
    <div className="flex min-h-dvh flex-col bg-cloud">
      <header className="mx-auto flex w-full max-w-[1160px] items-center justify-between gap-3 px-4 pt-4 md:px-8 md:pt-6">
        <Logo />
        <LanguageSelect />
      </header>

      <main
        id="main"
        className="mx-auto grid w-full max-w-[1160px] flex-1 content-center gap-3 px-4 pt-2 pb-6 md:grid-cols-[minmax(0,1fr)_minmax(0,440px)] md:items-center md:gap-10 md:px-8 lg:gap-16"
      >
        <section className="relative flex items-end gap-2 md:flex-col md:items-center md:gap-6">
          {/* Soft stage behind Mitra (wide screens) */}
          <div aria-hidden className="pointer-events-none absolute inset-x-[6%] top-[4%] bottom-[22%] hidden rounded-full bg-[radial-gradient(closest-side,#d6f3fd,rgb(214_243_253/0))] md:block" />
          <FloatingOrb size="md" float className="absolute top-[6%] left-[4%] hidden opacity-80 lg:inline-flex" />
          <FloatingOrb size="sm" float pulse={false} className="absolute top-[36%] right-[6%] hidden [animation-delay:-3s] lg:inline-flex" />

          <div className="relative w-full md:max-w-[520px]">
            <div className="flex items-end gap-1 md:block">
              <MitraHero className="h-[168px] shrink-0 sm:h-[200px] md:mx-auto md:h-[min(52vh,470px)]" />
              <p
                className="relative mb-auto ml-1 rounded-3xl rounded-bl-md bg-white px-4 py-3 text-[15px] leading-snug font-semibold text-paytm-blue [box-shadow:var(--clay-shadow-soft)] md:absolute md:top-[4%] md:left-[60%] md:mb-0 md:ml-0 md:max-w-[240px] md:text-base lg:left-[62%]"
                aria-live="polite"
              >
                {bubble}
              </p>
            </div>
          </div>

          <ul className="hidden w-full max-w-[460px] flex-col gap-2.5 lg:flex">
            {promises.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 rounded-2xl bg-white/70 px-4 py-2.5 text-[15px] font-medium text-paytm-blue [box-shadow:var(--clay-shadow-soft)]">
                <Icon aria-hidden className="size-5 shrink-0 text-paytm-cyan-ink" />
                {text}
              </li>
            ))}
          </ul>
        </section>

        <div className="w-full">{children}</div>
      </main>

      <footer className="px-4 pb-5 text-center text-xs text-slate-soft">{t('auth.footer')}</footer>
    </div>
  )
}
