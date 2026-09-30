import { RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { CONTROLLABLE_ACTIONS, RECOMMENDED_TRUST, sameTrust } from '../../lib/trust'
import type { TrustSettings } from '../../mocks/types'
import { ClayButton, ClayCard } from '../ui'
import { LoanLockedCard } from './LoanLockedCard'
import { SpendCapStepper } from './SpendCapStepper'
import { TrustActionCard } from './TrustActionCard'
import { UndoWindowChoice } from './UndoWindowChoice'

type PanelProps = {
  value: TrustSettings
  onChange: (next: TrustSettings) => void
  /** Grid columns on wide screens (Settings uses two). */
  columns?: 1 | 2
}

/**
 * Trust Settings, split in two so onboarding can ask one thing per screen.
 * Both are purely controlled: saving is up to the screen that uses them.
 */
export function TrustModesPanel({ value, onChange, columns = 1 }: PanelProps) {
  return (
    <div className={columns === 2 ? 'grid gap-4 lg:grid-cols-2' : 'flex flex-col gap-4'}>
      {CONTROLLABLE_ACTIONS.map((action) => (
        <TrustActionCard
          key={action}
          action={action}
          settings={value}
          onChange={(mode) => onChange({ ...value, modes: { ...value.modes, [action]: mode } })}
        />
      ))}
      <LoanLockedCard />
    </div>
  )
}

export function SafetyLimitsPanel({ value, onChange, columns = 1 }: PanelProps) {
  return (
    <div className={columns === 2 ? 'grid gap-4 lg:grid-cols-2' : 'flex flex-col gap-4'}>
      <ClayCard padding="md" elevation="soft">
        <SpendCapStepper value={value.campaignSpendCap} onChange={(campaignSpendCap) => onChange({ ...value, campaignSpendCap })} />
      </ClayCard>
      <ClayCard padding="md" elevation="soft">
        <UndoWindowChoice value={value.undoWindowMinutes} onChange={(undoWindowMinutes) => onChange({ ...value, undoWindowMinutes })} />
      </ClayCard>
    </div>
  )
}

/** Shown only once something differs from Mitra's suggestion. */
export function ResetTrustButton({ value, onReset }: { value: TrustSettings; onReset: () => void }) {
  const { t } = useTranslation()
  if (sameTrust(value, RECOMMENDED_TRUST)) return null
  return (
    <ClayButton variant="ghost" size="sm" onClick={onReset} leadingIcon={<RotateCcw className="size-4" />} className="self-start">
      {t('trust.reset')}
    </ClayButton>
  )
}
