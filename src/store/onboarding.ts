import { create } from 'zustand'
import { RECOMMENDED_TRUST } from '../lib/trust'
import type { TrustSettings } from '../mocks/types'

/**
 * Trust choices made during onboarding. Kept in memory until the last step,
 * which saves them with one PUT /agent/settings/trust.
 */
export const useOnboardingDraft = create<{
  trust: TrustSettings
  setTrust: (trust: TrustSettings) => void
  reset: () => void
}>()((set) => ({
  trust: RECOMMENDED_TRUST,
  setTrust: (trust) => set({ trust }),
  reset: () => set({ trust: RECOMMENDED_TRUST }),
}))
