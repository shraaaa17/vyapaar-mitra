import type { LanguageCode } from '../mocks/types'

export type LanguageOption = {
  code: LanguageCode
  /** Name written in the language itself, shown in pickers. */
  nativeName: string
  /** Name in English, shown as a hint under the native name. */
  englishName: string
  /** i18next language code. Hinglish is Hindi written in Latin script. */
  i18nCode: string
  /** Value for <html lang>, so screen readers pick the right voice. */
  htmlLang: string
  /** Preferred Web Speech voices for read-aloud, best first. */
  speechLangs: string[]
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'hinglish', nativeName: 'Hinglish', englishName: 'Hindi in English letters', i18nCode: 'hi-Latn', htmlLang: 'hi-Latn', speechLangs: ['hi-IN', 'en-IN'] },
  { code: 'en', nativeName: 'English', englishName: 'English', i18nCode: 'en', htmlLang: 'en-IN', speechLangs: ['en-IN', 'en-GB', 'en-US'] },
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi', i18nCode: 'hi', htmlLang: 'hi', speechLangs: ['hi-IN'] },
  { code: 'mr', nativeName: 'मराठी', englishName: 'Marathi', i18nCode: 'mr', htmlLang: 'mr', speechLangs: ['mr-IN', 'hi-IN'] },
]

export function getLanguage(code: LanguageCode): LanguageOption {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0]
}
