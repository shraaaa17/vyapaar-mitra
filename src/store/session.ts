import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LanguageCode } from '../mocks/types'

type SessionState = {
  signedIn: boolean
  phone: string | null
  onboarded: boolean
  language: LanguageCode
  signIn: (phone: string) => void
  completeOnboarding: () => void
  setLanguage: (language: LanguageCode) => void
  signOut: () => void
}

/** Merchant session and preferences, persisted across reloads. */
export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      signedIn: false,
      phone: null,
      onboarded: false,
      language: 'hinglish',
      signIn: (phone) => set({ signedIn: true, phone }),
      completeOnboarding: () => set({ onboarded: true }),
      setLanguage: (language) => set({ language }),
      signOut: () => set({ signedIn: false, phone: null }),
    }),
    { name: 'vm-session-v1' },
  ),
)
