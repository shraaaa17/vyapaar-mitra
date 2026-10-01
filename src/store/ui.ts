import { create } from 'zustand'

type UiState = {
  moreOpen: boolean
  chatOpen: boolean
  chatMinimized: boolean
  setMoreOpen: (open: boolean) => void
  setChatOpen: (open: boolean) => void
  setChatMinimized: (minimized: boolean) => void
}

/** Transient UI state shared across the shell (not persisted). */
export const useUi = create<UiState>()((set) => ({
  moreOpen: false,
  chatOpen: false,
  chatMinimized: false,
  setMoreOpen: (moreOpen) => set({ moreOpen }),
  setChatOpen: (chatOpen) => set({ chatOpen }),
  setChatMinimized: (chatMinimized) => set({ chatMinimized }),
}))
