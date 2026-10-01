import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useSpeech } from '../../lib/speech'
import type { LanguageCode } from '../../mocks/types'
import { useCounter } from '../../store/counter'
import { useSession } from '../../store/session'
import { lineText } from './lines'

/** Captions older than this (e.g. restored after a reload) are shown but not read out. */
const FRESH_MS = 5_000

/**
 * Voices the Soundbox asks for, best first. English and Hinglish (Hindi in
 * Latin letters) sound most natural from an Indian English voice, then a
 * Hindi one, then any English voice; Hindi and Marathi use their own.
 */
const SOUNDBOX_VOICES: Record<LanguageCode, { langs: string[]; rupees: string }> = {
  hinglish: { langs: ['en-IN', 'hi-IN', 'en-GB', 'en-US'], rupees: 'rupaye' },
  en: { langs: ['en-IN', 'hi-IN', 'en-GB', 'en-US'], rupees: 'rupaye' },
  hi: { langs: ['hi-IN'], rupees: 'रुपये' },
  mr: { langs: ['mr-IN', 'hi-IN'], rupees: 'रुपये' },
}

/** "₹1,200 prapt hue 🙏" → "1,200 rupaye prapt hue": amounts read as words, emoji dropped. */
function forSpeech(text: string, rupees: string) {
  return text
    .replace(/₹\s?([\d,]+)/g, `$1 ${rupees}`)
    .replace(/[\p{Extended_Pictographic}️‍]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

/**
 * The Soundbox's voice. Lives in the app shell, so a caption is read out
 * wherever the merchant is, in the language the app is set to.
 */
export function SoundboxVoice() {
  const { i18n } = useTranslation()
  const caption = useCounter((s) => s.caption)
  const voiceOn = useCounter((s) => s.voiceOn)
  const language = useSession((s) => s.language)
  const { supported, speak, stop, speakingId } = useSpeech()
  const spoken = useRef<number | null>(null)

  useEffect(() => {
    if (!caption || !caption.speak || !voiceOn || !supported || spoken.current === caption.id) return
    spoken.current = caption.id
    if (Date.now() - caption.at > FRESH_MS) return
    const { langs, rupees } = SOUNDBOX_VOICES[language] ?? SOUNDBOX_VOICES.hinglish
    speak(forSpeech(lineText(i18n.t, caption.line), rupees), language, 'soundbox', langs)
  }, [caption, voiceOn, supported, language, speak, i18n])

  useEffect(() => {
    if (!voiceOn) stop()
  }, [voiceOn, stop])

  useEffect(() => {
    useCounter.setState({ speaking: speakingId === 'soundbox' })
  }, [speakingId])

  return null
}
