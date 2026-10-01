import type { StateStorage } from 'zustand/middleware'

/**
 * Browser storage that never throws. Private windows, blocked site data and
 * full quotas make localStorage/sessionStorage throw on access; the app then
 * simply runs without remembering anything.
 */
function safe(getStorage: () => Storage): StateStorage {
  return {
    getItem: (name) => {
      try {
        return getStorage().getItem(name)
      } catch {
        return null
      }
    },
    setItem: (name, value) => {
      try {
        getStorage().setItem(name, value)
      } catch {
        // Not saved; the app keeps working for this visit.
      }
    },
    removeItem: (name) => {
      try {
        getStorage().removeItem(name)
      } catch {
        // Nothing to remove.
      }
    },
  }
}

export const safeLocalStorage = safe(() => window.localStorage)
export const safeSessionStorage = safe(() => window.sessionStorage)
