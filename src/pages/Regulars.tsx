<<<<<<< HEAD
import { Check, Search, ShieldCheck, ShieldX, Star, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../components/layout/PageHeader'
import { Badge, ClayCard, ErrorState, MetricCard, Skeleton } from '../components/ui'
import { useRegulars } from '../hooks/queries'
import { getLanguage } from '../i18n/languages'
import { formatINR } from '../lib/format'
import type { Regular } from '../mocks/types'
import { useSession } from '../store/session'

type ConsentFilter = 'all' | 'optedIn' | 'notOptedIn'

function lastVisitLabel(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(new Date(date))
}

function RegularRow({ regular, locale }: { regular: Regular; locale: string }) {
  const { t } = useTranslation()
  const progress = Math.min((regular.visits / regular.reward.everyNVisits) * 100, 100)
  const rewardTone = regular.reward.status === 'earned' ? 'success' : regular.reward.status === 'redeemed' ? 'neutral' : 'cyan'

  return (
    <li className="grid gap-3 border-t border-line py-4 md:grid-cols-[minmax(8rem,1.1fr)_minmax(10rem,1.4fr)_minmax(6.5rem,0.8fr)_minmax(6.5rem,0.8fr)_minmax(8rem,1fr)] md:items-center md:gap-4 md:py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span aria-hidden className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-well text-slate">
          <Users className="size-[18px]" />
        </span>
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{regular.masked}</p>
          <p className="text-xs text-slate-soft">{t('pages.regulars.visitCount', { count: regular.visits })}</p>
        </div>
      </div>

      <div className="min-w-0">
        <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium text-slate">{t('pages.regulars.rewardProgress', { count: regular.visits, target: regular.reward.everyNVisits })}</span>
          <Badge tone={rewardTone} icon={regular.reward.status === 'earned' ? <Star /> : regular.reward.status === 'redeemed' ? <Check /> : undefined}>
            {t(`pages.regulars.reward.${regular.reward.status}`)}
          </Badge>
        </div>
        <span aria-hidden className="block h-2 overflow-hidden rounded-full bg-well">
          <span className="block h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 md:block">
        <span className="text-xs text-slate-soft md:hidden">{t('pages.regulars.lastVisit')}</span>
        <span className="text-sm font-medium text-ink tabular-nums">{lastVisitLabel(regular.lastVisit, locale)}</span>
      </div>

      <div className="flex items-center justify-between gap-2 md:block">
        <span className="text-xs text-slate-soft md:hidden">{t('pages.regulars.averageBasket')}</span>
        <span className="text-sm font-semibold text-ink tabular-nums">{formatINR(regular.avgBasket)}</span>
      </div>

      <div className="flex items-center justify-between gap-2 md:justify-start">
        <span className="text-xs text-slate-soft md:hidden">{t('pages.regulars.whatsappConsent')}</span>
        {regular.consent.whatsappOptIn ? (
          <span className="inline-flex items-center gap-2 text-sm font-medium text-success-ink">
            <ShieldCheck aria-hidden className="size-4" />
            <span>{t('pages.regulars.optedInStatus')}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 text-sm font-medium text-slate">
            <ShieldX aria-hidden className="size-4" />
            <span>{t('pages.regulars.notOptedInStatus')}</span>
          </span>
        )}
      </div>
    </li>
  )
}

export function Regulars() {
  const { t } = useTranslation()
  const language = useSession((state) => state.language)
  const { data, isPending, isError, refetch } = useRegulars()
  const [query, setQuery] = useState('')
  const [consent, setConsent] = useState<ConsentFilter>('all')
  const locale = getLanguage(language).htmlLang

  const visible = useMemo(() => {
    const regulars = data?.regulars ?? []
    const normalized = query.trim().toLowerCase()
    return regulars.filter((regular) => {
      const matchesQuery = !normalized || regular.masked.toLowerCase().includes(normalized)
      const matchesConsent = consent === 'all'
        || (consent === 'optedIn' && regular.consent.whatsappOptIn)
        || (consent === 'notOptedIn' && !regular.consent.whatsappOptIn)
      return matchesQuery && matchesConsent
    })
  }, [data, query, consent])

  return (
    <>
      <PageHeader title={t('pages.regulars.title')} subtitle={t('pages.regulars.subtitle')} />
      {isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : isPending ? (
        <div className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-3"><Skeleton className="h-32 rounded-clay" /><Skeleton className="h-32 rounded-clay" /><Skeleton className="h-32 rounded-clay" /></div>
          <Skeleton className="h-96 rounded-clay" />
        </div>
      ) : data ? (
        <div className="flex flex-col gap-5 lg:gap-6">
          <section aria-label={t('pages.regulars.summary')} className="grid gap-4 sm:grid-cols-3">
            <MetricCard label={t('pages.regulars.total')} value={data.total} icon={<Users />} />
            <MetricCard
              label={t('pages.regulars.optedIn')}
              value={data.regulars.filter((regular) => regular.consent.whatsappOptIn).length}
              delta={{ label: t('pages.regulars.shownCount', { count: data.regulars.length }), direction: 'neutral' }}
              icon={<ShieldCheck />}
            />
            <MetricCard
              label={t('pages.regulars.rewardsReady')}
              value={data.regulars.filter((regular) => regular.reward.status === 'earned').length}
              icon={<Star />}
            />
          </section>

          <ClayCard as="section" aria-labelledby="regulars-list-title" padding="none">
            <header className="flex flex-col gap-4 border-b border-line px-5 py-5 sm:px-6">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 id="regulars-list-title" className="text-lg font-bold text-ink">{t('pages.regulars.listTitle')}</h2>
                  <p className="mt-1 text-sm text-slate">{t('pages.regulars.shownOf', { shown: visible.length, total: data.regulars.length, customers: data.total })}</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <label className="relative block w-full lg:max-w-sm">
                  <span className="sr-only">{t('pages.regulars.searchLabel')}</span>
                  <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-soft" />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={t('pages.regulars.searchPlaceholder')}
                    className="clay-inset h-12 w-full rounded-full pl-11 pr-4 text-sm text-ink placeholder:text-slate-soft"
                  />
                </label>
                <div role="group" aria-label={t('pages.regulars.filterLabel')} className="flex flex-wrap gap-2">
                  {(['all', 'optedIn', 'notOptedIn'] as const).map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      aria-pressed={consent === filter}
                      onClick={() => setConsent(filter)}
                      className={`min-h-12 rounded-full px-4 text-sm font-semibold transition-colors ${consent === filter ? 'bg-accent text-on-accent' : 'bg-well text-ink hover:bg-surface-2'}`}
                    >
                      {t(`pages.regulars.filter.${filter}`)}
                    </button>
                  ))}
                </div>
              </div>
            </header>

            {visible.length === 0 ? (
              <p className="m-5 rounded-2xl bg-well px-4 py-4 text-slate sm:m-6">{t('pages.regulars.noResults')}</p>
            ) : (
              <div className="px-5 sm:px-6">
                <div aria-hidden className="hidden grid-cols-[minmax(8rem,1.1fr)_minmax(10rem,1.4fr)_minmax(6.5rem,0.8fr)_minmax(6.5rem,0.8fr)_minmax(8rem,1fr)] gap-4 py-3 text-xs font-semibold text-slate-soft md:grid">
                  <span>{t('pages.regulars.customer')}</span>
                  <span>{t('pages.regulars.rewardStatus')}</span>
                  <span>{t('pages.regulars.lastVisit')}</span>
                  <span>{t('pages.regulars.averageBasket')}</span>
                  <span>{t('pages.regulars.whatsappConsent')}</span>
                </div>
                <ul>
                  {visible.map((regular) => <RegularRow key={regular.id} regular={regular} locale={locale} />)}
                </ul>
              </div>
            )}
          </ClayCard>
        </div>
      ) : null}
    </>
  )
}
=======
import { useTranslation } from 'react-i18next'
import { ComingNext } from '../components/layout/ComingNext'
import { PageHeader } from '../components/layout/PageHeader'
import { ErrorState, MetricCard, Skeleton } from '../components/ui'
import { useRegulars } from '../hooks/queries'

export function Regulars() {
  const { t } = useTranslation()
  const { data, isPending, isError, refetch } = useRegulars()
  return (
    <>
      <PageHeader title={t('pages.regulars.title')} subtitle={t('pages.regulars.subtitle')} />
      <ComingNext phase={5} items={[t('pages.regulars.next1'), t('pages.regulars.next2'), t('pages.regulars.next3')]}>
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isPending ? (
          <Skeleton className="h-36 rounded-clay" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard label={t('pages.regulars.total')} value={data.total} />
            <MetricCard label={t('pages.regulars.optedIn')} value={data.regulars.filter((r) => r.consent.whatsappOptIn).length} />
          </div>
        )}
      </ComingNext>
    </>
  )
}
>>>>>>> 71ba05fa0220e615d57ef8290c5ba200c7bc64c6
