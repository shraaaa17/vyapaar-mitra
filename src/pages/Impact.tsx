<<<<<<< HEAD
import { ArrowUpRight, Check, Lightbulb, Sparkles, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '../components/layout/PageHeader'
import { ClayButton, ClayCard, ErrorState, Skeleton } from '../components/ui'
import { useOutcomes } from '../hooks/queries'
import { weekdayName } from '../i18n/weekdays'
import { formatINR } from '../lib/format'

function WeeklySalesChart({ data }: { data: { day: string; week1: number; week2: number }[] }) {
  const { t } = useTranslation()
  const max = Math.max(...data.flatMap(({ week1, week2 }) => [week1, week2]), 1)
  const summary = data.map(({ day, week1, week2 }) =>
    `${weekdayName(t, day)}: ${t('pages.impact.weekOne')} ${formatINR(week1)}, ${t('pages.impact.weekTwo')} ${formatINR(week2)}`,
  ).join('. ')

  return (
    <figure aria-label={`${t('pages.impact.weeklyComparison')}. ${summary}`}>
      <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <span className="inline-flex items-center gap-2 text-slate">
          <span aria-hidden className="size-3 rounded-sm bg-accent" />
          {t('pages.impact.weekOne')}
        </span>
        <span className="inline-flex items-center gap-2 text-slate">
          <span aria-hidden className="size-3 rounded-sm bg-coral" />
          {t('pages.impact.weekTwo')}
        </span>
        <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-soft">
              <span aria-hidden className="size-2.5 rounded-full bg-caution" />
          {t('pages.impact.offerDay')}
        </span>
      </div>

      <div className="relative h-60 border-b border-line">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-line" />
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-line" />
        <ul className="relative flex h-full items-end justify-around gap-1 px-1 sm:gap-3 sm:px-4">
          {data.map((point) => {
            const offerDay = point.day.toLowerCase() === 'tue'
            const firstHeight = (point.week1 / max) * 100
            const secondHeight = (point.week2 / max) * 100
            return (
              <li key={point.day} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                <div className="flex h-full items-end justify-center gap-1 sm:gap-2">
                  <span
                    aria-hidden
                    className="w-[min(24px,42%)] rounded-t-md bg-accent"
                    style={{ height: `${firstHeight}%` }}
                  />
                  <span
                    aria-hidden
                    className="w-[min(24px,42%)] rounded-t-md bg-coral"
                    style={{ height: `${secondHeight}%` }}
                  />
                </div>
                <span className={`flex min-h-9 items-center justify-center gap-1 text-xs ${offerDay ? 'font-bold text-caution-ink' : 'text-slate-soft'}`}>
                  {weekdayName(t, point.day)}
                  {offerDay && <span aria-hidden className="size-1.5 rounded-full bg-caution" />}
                </span>
              </li>
            )
          })}
        </ul>
      </div>
      <figcaption className="mt-3 text-sm text-slate">{t('pages.impact.chartCaption')}</figcaption>
      <ul className="sr-only">
        {data.map((point) => (
          <li key={point.day}>
            {weekdayName(t, point.day)}: {t('pages.impact.weekOne')} {formatINR(point.week1)}, {t('pages.impact.weekTwo')} {formatINR(point.week2)}
          </li>
        ))}
      </ul>
    </figure>
  )
}

export function Impact() {
  const { t } = useTranslation()
  const { data, isPending, isError, refetch } = useOutcomes()

  return (
    <>
      <PageHeader title={t('pages.impact.title')} subtitle={t('pages.impact.subtitle')} />
      {isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : isPending ? (
        <div className="flex flex-col gap-5">
          <Skeleton className="h-36 rounded-clay" />
          <Skeleton className="h-80 rounded-clay" />
          <Skeleton className="h-56 rounded-clay" />
        </div>
      ) : (
        <div className="flex flex-col gap-5 lg:gap-6">
          <section aria-label={t('pages.impact.summary')} className="grid gap-4 sm:grid-cols-3">
            <ClayCard elevation="soft" padding="md" className="flex flex-col gap-3">
              <p className="text-sm font-medium text-slate">{t('pages.impact.before')}</p>
              <p className="text-[34px] leading-none font-bold text-ink tabular-nums">{formatINR(data.headline.before.sales)}</p>
              <p className="text-sm text-slate-soft">{data.headline.before.label}</p>
            </ClayCard>
            <ClayCard elevation="soft" padding="md" className="flex flex-col gap-3">
              <p className="text-sm font-medium text-slate">{t('pages.impact.after')}</p>
              <p className="text-[34px] leading-none font-bold text-ink tabular-nums">{formatINR(data.headline.after.sales)}</p>
              <p className="text-sm text-slate-soft">{data.headline.after.label}</p>
            </ClayCard>
            <ClayCard elevation="soft" padding="md" className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate">{t('pages.impact.change')}</p>
                <TrendingUp aria-hidden className="size-5 text-success-ink" />
              </div>
              <p className="text-[34px] leading-none font-bold text-ink tabular-nums">+{data.headline.changePct}%</p>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-success-wash px-3 py-1 text-xs font-semibold text-success-ink">
                <ArrowUpRight aria-hidden className="size-3.5" />
                {t('pages.impact.pilotLabel')}
              </span>
            </ClayCard>
          </section>

          {data.headline.simulated && (
            <p className="flex items-center gap-2 rounded-2xl bg-caution-wash px-4 py-3 text-sm font-medium text-caution-ink">
              <TrendingUp aria-hidden className="size-4" />
              {t('pages.impact.simulationNote')}
            </p>
          )}

          <ClayCard as="section" aria-labelledby="impact-chart-title" padding="none">
            <header className="border-b border-line px-5 py-5 sm:px-6">
              <h2 id="impact-chart-title" className="text-lg font-bold text-ink">{t('pages.impact.weeklyComparison')}</h2>
              <p className="mt-1 text-sm text-slate">{data.headline.label}</p>
            </header>
            <div className="p-5 sm:p-6">
              <WeeklySalesChart data={data.weekly} />
            </div>
          </ClayCard>

          <div className="grid items-start gap-5 lg:grid-cols-2 lg:gap-6">
            <ClayCard as="section" aria-labelledby="impact-learned-title" padding="none">
              <header className="flex items-center gap-3 px-5 pt-5 sm:px-6">
                <span aria-hidden className="inline-flex size-10 items-center justify-center rounded-xl bg-accent-wash text-accent-ink">
                  <Lightbulb className="size-5" />
                </span>
                <h2 id="impact-learned-title" className="text-lg font-bold text-ink">{t('pages.impact.learnedTitle')}</h2>
              </header>
              <ul className="flex flex-col px-5 pt-3 pb-5 sm:px-6 sm:pb-6">
                {data.learned.map((item, index) => (
                  <li key={`${index}-${item}`} className="flex gap-3 border-t border-line py-3 text-[15px] leading-relaxed text-ink">
                    <CheckMark />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </ClayCard>

            <ClayCard as="section" aria-labelledby="impact-next-title" padding="none">
              <header className="flex items-center gap-3 px-5 pt-5 sm:px-6">
                <span aria-hidden className="inline-flex size-10 items-center justify-center rounded-xl bg-coral-wash text-coral-ink">
                  <Sparkles className="size-5" />
                </span>
                <h2 id="impact-next-title" className="text-lg font-bold text-ink">{t('pages.impact.nextTitle')}</h2>
              </header>
              <ol className="flex flex-col px-5 pt-3 pb-5 sm:px-6 sm:pb-6">
                {data.nextWeek.map((item, index) => (
                  <li key={`${index}-${item}`} className="flex gap-3 border-t border-line py-3 text-[15px] leading-relaxed text-ink">
                    <span aria-hidden className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-well text-xs font-bold text-slate">{index + 1}</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
              <div className="border-t border-line px-5 py-3 sm:px-6">
                <ClayButton variant="secondary" href="/campaigns">{t('pages.impact.viewCampaign')}</ClayButton>
              </div>
            </ClayCard>
          </div>
        </div>
      )}
    </>
  )
}

function CheckMark() {
  return <span aria-hidden className="mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-success-wash text-success-ink"><Check className="size-3.5" /></span>
}
=======
import { useTranslation } from 'react-i18next'
import { ComingNext } from '../components/layout/ComingNext'
import { PageHeader } from '../components/layout/PageHeader'
import { ErrorState, MetricCard, Skeleton } from '../components/ui'
import { useOutcomes } from '../hooks/queries'
import { formatINR } from '../lib/format'

export function Impact() {
  const { t } = useTranslation()
  const { data, isPending, isError, refetch } = useOutcomes()
  return (
    <>
      <PageHeader title={t('pages.impact.title')} subtitle={t('pages.impact.subtitle')} />
      <ComingNext phase={7} items={[t('pages.impact.next1'), t('pages.impact.next2')]}>
        {isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : isPending ? (
          <Skeleton className="h-36 rounded-clay" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <MetricCard
              label={t('pages.impact.tuesdayBeforeAfter')}
              value={`${formatINR(data.headline.before.sales)} → ${formatINR(data.headline.after.sales)}`}
              delta={{ label: t('pages.impact.pilot', { pct: data.headline.changePct }), direction: 'up' }}
            />
          </div>
        )}
      </ComingNext>
    </>
  )
}
>>>>>>> 71ba05fa0220e615d57ef8290c5ba200c7bc64c6
