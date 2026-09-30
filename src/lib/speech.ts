import { useCallback, useEffect, useState } from 'react'
import { getLanguage } from '../i18n/languages'
import type { LanguageCode } from '../mocks/types'

/**
 * Read-aloud with the Web Speech API. Each app language maps to a list of
 * preferred voices (see i18n/languages.ts); the first one the device has wins,
 * otherwise the browser picks its default voice for the first language tag.
 */

export const speechSupported = () => typeof window !== 'undefined' && 'speechSynthesis' in window

function pickVoice(code: LanguageCode) {
  const wanted = getLanguage(code).speechLangs
  const voices = window.speechSynthesis.getVoices()
  for (const lang of wanted) {
    const exact = voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase())
    if (exact) return exact
    const loose = voices.find((v) => v.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase()))
    if (loose) return loose
  }
  return undefined
}

export function useSpeech() {
  const supported = speechSupported()
  const [speakingId, setSpeakingId] = useState<string | null>(null)

  useEffect(() => () => {
    if (supported) window.speechSynthesis.cancel()
  }, [supported])

  const stop = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    setSpeakingId(null)
  }, [supported])

  /** Speaks `text`; `id` lets the caller show which button is playing. */
  const speak = useCallback(
    (text: string, code: LanguageCode, id = 'default') => {
      if (!supported) return
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(text)
      const voice = pickVoice(code)
      utterance.lang = voice?.lang ?? getLanguage(code).speechLangs[0]
      if (voice) utterance.voice = voice
      utterance.rate = 0.95
      utterance.onend = () => setSpeakingId((current) => (current === id ? null : current))
      utterance.onerror = () => setSpeakingId((current) => (current === id ? null : current))
      setSpeakingId(id)
      window.speechSynthesis.speak(utterance)
    },
    [supported],
  )

  return { supported, speakingId, speak, stop }
}
