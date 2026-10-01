import { create } from 'zustand'

type UiState = {
  moreOpen: boolean
<<<<<<< HEAD
  chatOpen: boolean
  chatMinimized: boolean
  setMoreOpen: (open: boolean) => void
  setChatOpen: (open: boolean) => void
  setChatMinimized: (minimized: boolean) => void
=======
  setMoreOpen: (open: boolean) => void
>>>>>>> 71ba05fa0220e615d57ef8290c5ba200c7bc64c6
}

/** Transient UI state shared across the shell (not persisted). */
export const useUi = create<UiState>()((set) => ({
  moreOpen: false,
<<<<<<< HEAD
  chatOpen: false,
  chatMinimized: false,
  setMoreOpen: (moreOpen) => set({ moreOpen }),
  setChatOpen: (chatOpen) => set({ chatOpen }),
  setChatMinimized: (chatMinimized) => set({ chatMinimized }),
=======
  setMoreOpen: (moreOpen) => set({ moreOpen }),
>>>>>>> 71ba05fa0220e615d57ef8290c5ba200c7bc64c6
}))
