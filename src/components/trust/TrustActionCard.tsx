import { AnimatePresence, motion } from 'framer-motion'
import { Ban, Hand, ShieldCheck, TriangleAlert, Zap } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { formatINR } from '../../lib/format'
import { REGULARS_COUNT, TRUST_MODES, type ControllableAction, type ControllableMode } from '../../lib/trust'
import type { TrustSettings } from '../../mocks/types'
import { ClayCard, IconBubble, SegmentedChoice } from '../ui'
import { ACTION_COPY, MODE_LABEL, MODE_WHAT } from './copy'
import { StakesLabel } from './StakesLabel'

const MODE_ICON: Record<ControllableMode, typeof Zap> = { auto: Zap, ask: Hand, off: Ban }

/** One action type: what it looks like in this shop, and Auto / Ask me first / Off. */
export function TrustActionCard({
  action,
  settings,
  onChange,
}: {
  action: ControllableAction
  settings: TrustSettings
  onChange: (mode: ControllableMode) => void
}) {
  const { t } = useTranslation()
  const whatId = useId()
  const copy = ACTION_COPY[action]
  const mode = settings.modes[action]
  const title = t(copy.title)

  return (
    <ClayCard padding="md" elevation="soft" className="flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <IconBubble size="md">
          <copy.icon />
        </IconBubble>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-lg leading-snug font-semibold">{title}</h3>
            <StakesLabel risk={copy.risk}>{t(copy.stakes)}</StakesLabel>
          </div>
          <p className="mt-0.5 text-[15px] text-slate">{t(copy.example, { count: REGULARS_COUNT })}</p>
        </div>
      </div>

      <SegmentedChoice
        legend={t('trust.modesLegend', { action: title })}
        hideLegend
        value={mode}
        onChange={onChange}
        describedBy={whatId}
        options={TRUST_MODES.map((m) => {
          const Icon = MODE_ICON[m]
          return { value: m, label: t(MODE_LABEL[m]), icon: <Icon /> }
        })}
      />

      <div id={whatId} aria-live="polite" className="flex flex-col gap-2">
        <p className="text-[15px] font-medium text-paytm-blue">{t(MODE_WHAT[mode])}</p>
        <AnimatePresence initial={false}>
          {mode === 'auto' && (
            <motion.p
              key="net"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2 overflow-hidden rounded-2xl bg-success-wash px-3 py-2 text-sm font-medium text-success-ink"
            >
              <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0" />
              {t('trust.safetyNet', { cap: formatINR(settings.campaignSpendCap), minutes: settings.undoWindowMinutes })}
            </motion.p>
          )}
          {mode === 'auto' && action === 'reorder' && (
            <motion.p
              key="warn"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2 overflow-hidden rounded-2xl bg-caution-wash px-3 py-2 text-sm font-medium text-caution-ink"
            >
              <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
              {t('trust.reorderAutoWarning', { minutes: settings.undoWindowMinutes })}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </ClayCard>
  )
}
