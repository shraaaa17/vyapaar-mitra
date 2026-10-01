import { AnimatePresence, motion } from 'framer-motion'
import { Check, Loader2, Sparkles, Speaker, Sunrise, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRunAgent } from '../../hooks/queries'
import { getLanguage } from '../../i18n/languages'
import { cn } from '../../lib/cn'
import { speechSupported } from '../../lib/speech'
import type { AgentRunReport } from '../../mocks/types'
import { useCounter, type Line } from '../../store/counter'
import { useSession } from '../../store/session'
import { ClayButton, ClayCard } from '../ui'
import { clockTime, lineText } from './lines'

const STEPS = ['stepObserve', 'stepReason', 'stepDecide', 'stepAct', 'stepLearn'] as const
const STEP_MS = 500

/** What an agent cycle adds to the activity feed. */
function cycleLine(report: AgentRunReport): Line {
  return report.insightsCreated > 0
    ? { key: 'counter.lines.agentInsights', params: { count: report.insightsCreated } }
    : { key: 'counter.lines.agentNothingNew' }
}

/**
 * The counter Soundbox: a large caption of what it last said, "Enable voice",
 * the morning briefing and "Run agent now" (with the Observe → Learn steps).
 * The caption is the counter's live region for screen readers.
 */
export function SoundboxCard() {
  const { t, i18n } = useTranslation()
  const language = useSession((s) => s.language)
  const caption = useCounter((s) => s.caption)
  const voiceOn = useCounter((s) => s.voiceOn)
  const speaking = useCounter((s) => s.speaking)
  const setVoice = useCounter((s) => s.setVoice)
  const briefing = useCounter((s) => s.briefing)
  const playBriefing = useCounter((s) => s.playBriefing)
  const canSpeak = speechSupported()
  const [cycle, setCycle] = useState<Line | null>(null)

  const run = useRunAgent((report) => {
    const { log, setToday } = useCounter.getState()
    setToday(report.today)
    const line = cycleLine(report)
    log('ai', { key: 'counter.feed.agentCycle' }, line)
    setCycle(line)
  })

  const locale = getLanguage(language).htmlLang

  return (
    <ClayCard as="section" aria-labelledby="soundbox-title" padding="none">
      <header className="flex items-center gap-3 px-5 pt-5 sm:px-6">
        <span aria-hidden className="inline-flex size-10 items-center justify-center rounded-xl bg-accent-wash text-accent-ink">
          <Speaker className="size-5" />
        </span>
        <h2 id="soundbox-title" className="text-lg font-bold">
          {t('counter.soundbox.title')}
        </h2>
      </header>

      <div className="px-5 pt-4 pb-5 sm:px-6 sm:pb-6">
        <div className="clay-inset flex min-h-32 flex-col gap-2 rounded-[22px] px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-eyebrow text-accent-ink uppercase">{t('counter.soundbox.caption')}</p>
            <div className="flex items-center gap-2 text-xs text-slate-soft">
              {speaking && <Equalizer />}
              {caption && !run.isPending && <time dateTime={new Date(caption.at).toISOString()}>{clockTime(caption.at, locale)}</time>}
            </div>
          </div>
          {run.isPending && <AgentSteps />}
          {/* Always mounted, so screen readers hear each new caption (it hides behind the steps during a run). */}
          <p aria-live="polite" className={cn('text-xl leading-snug font-semibold text-ink sm:text-[22px]', run.isPending && 'sr-only')}>
            {caption ? lineText(i18n.t, caption.line) : <span aria-hidden>—</span>}
          </p>
        </div>

        {!canSpeak && <p className="mt-3 text-sm text-slate-soft">{t('counter.soundbox.voiceUnsupported')}</p>}
        {briefing === 'error' && (
          <p role="alert" className="mt-3 text-sm font-medium text-danger-ink">
            {t('counter.soundbox.briefingFailed')}
          </p>
        )}
        {run.isError && (
          <p role="alert" className="mt-3 text-sm font-medium text-danger-ink">
            {t('counter.soundbox.runFailed')}
          </p>
        )}
        {/* The cycle's result goes to the activity feed; screen readers hear it here. */}
        <p aria-live="polite" className="sr-only">
          {cycle && !run.isPending ? `${t('counter.feed.agentCycle')}: ${lineText(i18n.t, cycle)}` : ''}
        </p>

        {/* Buttons share a row while they fit and wrap (full width on phones) when they don't. */}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:*:flex-auto">
          {canSpeak && (
            <ClayButton
              variant="secondary"
              aria-pressed={voiceOn}
              onClick={() => setVoice(!voiceOn)}
              leadingIcon={voiceOn ? <Volume2 className="size-[18px]" /> : <VolumeX className="size-[18px]" />}
              className="aria-pressed:bg-accent-wash"
            >
              {voiceOn ? t('counter.soundbox.voiceOn') : t('counter.soundbox.voiceEnable')}
            </ClayButton>
          )}
          <ClayButton
            variant="secondary"
            onClick={() => void playBriefing()}
            aria-disabled={briefing === 'loading' || undefined}
            leadingIcon={briefing === 'loading' ? <Loader2 className="size-[18px] animate-spin" /> : <Sunrise className="size-[18px]" />}
          >
            {t('counter.soundbox.briefing')}
          </ClayButton>
          <ClayButton
            onClick={() => {
              if (run.isPending) return
              setCycle(null)
              run.mutate()
            }}
            aria-disabled={run.isPending || undefined}
            leadingIcon={run.isPending ? <Loader2 className="size-[18px] animate-spin" /> : <Sparkles className="size-[18px]" />}
          >
            {run.isPending ? t('counter.soundbox.running') : t('counter.soundbox.runAgent')}
          </ClayButton>
        </div>
      </div>
    </ClayCard>
  )
}

/** Observe → Reason → Decide → Act → Learn, ticking off while the agent runs. */
function AgentSteps() {
  const { t } = useTranslation()
  const [active, setActive] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setActive((i) => Math.min(i + 1, STEPS.length - 1)), STEP_MS)
    return () => window.clearInterval(id)
  }, [])

  return (
    <ol aria-label={t('counter.soundbox.running')} className="flex flex-col gap-1.5">
      {STEPS.map((step, i) => {
        const done = i < active
        const current = i === active
        return (
          <li
            key={step}
            aria-current={current ? 'step' : undefined}
            className={cn('flex items-center gap-2.5 text-sm', done ? 'text-slate' : current ? 'font-semibold text-ink' : 'text-slate-soft')}
          >
            <span
              aria-hidden
              className={cn(
                'inline-flex size-5 shrink-0 items-center justify-center rounded-full',
                done ? 'bg-success text-white' : current ? 'bg-accent text-on-accent' : 'bg-line',
              )}
            >
              {done ? <Check className="size-3" strokeWidth={3} /> : current ? <Loader2 className="size-3 animate-spin" /> : null}
            </span>
            {t(`counter.soundbox.${step}`)}
          </li>
        )
      })}
    </ol>
  )
}

/** Three bars that bounce while the Soundbox is talking. */
function Equalizer() {
  return (
    <AnimatePresence>
      <motion.span aria-hidden className="flex h-4 items-end gap-0.5" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1 rounded-full bg-coral"
            animate={{ height: ['30%', '100%', '45%', '80%', '30%'] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </motion.span>
    </AnimatePresence>
  )
}
