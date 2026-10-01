import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Maximize2, MessageCircle, Minus, SendHorizontal, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../../lib/api'
import { illustrationUrl } from '../illustrations/manifest'
import { AnswerVisual } from '../counter/AskCard'
import type { QueryResponse } from '../../mocks/types'
import { useCounter } from '../../store/counter'
import { useSession } from '../../store/session'
import { useUi } from '../../store/ui'
import { ClayButton } from '../ui'

const CHIPS = ['chipToday', 'chipLast', 'chipRegulars', 'chipDip', 'chipLoan'] as const
type ChatMessage = {
  id: string
  role: 'user' | 'mitra'
  text?: string
  response?: QueryResponse
  loading?: boolean
  error?: boolean
  refreshed?: boolean
}
type LatestQuestion = { answerId: string; text: string; revision: number; language: string }

let messageId = 0

export function FloatingChat() {
  const { t } = useTranslation()
  const language = useSession((s) => s.language)
  const revision = useCounter((s) => s.revision)
  const open = useUi((s) => s.chatOpen)
  const minimized = useUi((s) => s.chatMinimized)
  const setChatOpen = useUi((s) => s.setChatOpen)
  const setChatMinimized = useUi((s) => s.setChatMinimized)
  const reduceMotion = useReducedMotion()
  const [draft, setDraft] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [latest, setLatest] = useState<LatestQuestion | null>(null)
  const launcherRef = useRef<HTMLButtonElement>(null)
  const restoreRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const conversationRef = useRef<HTMLDivElement>(null)
  const requestVersions = useRef(new Map<string, number>())

  const requestAnswer = (answerId: string, text: string, queryLanguage: string, refreshed: boolean, showLoading = true) => {
    const version = (requestVersions.current.get(answerId) ?? 0) + 1
    requestVersions.current.set(answerId, version)
    if (showLoading) {
      setMessages((current) => current.map((message) =>
        message.id === answerId ? { ...message, loading: true, error: false, refreshed } : message,
      ))
    }
    void api.query({ question: text, language: queryLanguage as typeof language }).then(
      (response) => {
        if (requestVersions.current.get(answerId) !== version) return
        setMessages((current) => current.map((message) =>
          message.id === answerId ? { ...message, response, loading: false, error: false, refreshed } : message,
        ))
      },
      () => {
        if (requestVersions.current.get(answerId) !== version) return
        setMessages((current) => current.map((message) =>
          message.id === answerId ? { ...message, loading: false, error: true } : message,
        ))
      },
    )
  }

  useEffect(() => {
    if (!latest || (latest.revision === revision && latest.language === language)) return
    const timeout = window.setTimeout(() => requestAnswer(latest.answerId, latest.text, language, true, false), 0)
    return () => window.clearTimeout(timeout)
  }, [latest, revision, language])

  useEffect(() => {
    if (!open) return
    if (minimized) restoreRef.current?.focus()
    else inputRef.current?.focus()
  }, [open, minimized])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setChatMinimized(false)
        setChatOpen(false)
        window.requestAnimationFrame(() => launcherRef.current?.focus())
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, setChatMinimized, setChatOpen])

  useEffect(() => {
    const conversation = conversationRef.current
    if (conversation) conversation.scrollTop = conversation.scrollHeight
  }, [messages])

  const openChat = () => {
    setChatMinimized(false)
    setChatOpen(true)
  }

  const closeChat = () => {
    setChatMinimized(false)
    setChatOpen(false)
    window.requestAnimationFrame(() => launcherRef.current?.focus())
  }

  const ask = (text: string) => {
    const question = text.trim()
    if (!question) return
    const id = `chat-${++messageId}`
    const answerId = `${id}-answer`
    setMessages((current) => [
      ...current,
      { id, role: 'user', text: question },
      { id: answerId, role: 'mitra', loading: true },
    ])
    setLatest({ answerId, text: question, revision, language })
    requestAnswer(answerId, question, language, false)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    ask(draft)
    setDraft('')
  }

  const panelMotion = reduceMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 10 } }

  return (
    <>
      {!open && (
        <button
          ref={launcherRef}
          type="button"
          onClick={openChat}
          aria-label={t('counter.ask.launcher')}
          aria-haspopup="dialog"
          aria-expanded={false}
          className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 inline-flex size-14 items-center justify-center rounded-full bg-accent text-on-accent [box-shadow:var(--clay-shadow-accent)] transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:right-6 md:bottom-6"
        >
          <MessageCircle aria-hidden className="size-6" />
          <span className="sr-only">{t('counter.ask.launcher')}</span>
        </button>
      )}

      <AnimatePresence>
        {open && minimized && (
          <motion.button
            ref={restoreRef}
            type="button"
            onClick={() => setChatMinimized(false)}
            aria-label={t('counter.ask.restore')}
            className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 inline-flex min-h-12 items-center gap-2 rounded-full bg-accent px-4 font-semibold text-on-accent [box-shadow:var(--clay-shadow-accent)] md:right-6 md:bottom-6"
            {...panelMotion}
            transition={{ duration: reduceMotion ? 0.12 : 0.18 }}
          >
            <MessageCircle aria-hidden className="size-5" />
            {t('counter.ask.title')}
            <Maximize2 aria-hidden className="size-4" />
          </motion.button>
        )}
        {open && !minimized && (
          <motion.section
            role="dialog"
            aria-label={t('counter.ask.panelLabel')}
            aria-modal={false}
            className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 flex h-[min(35rem,calc(100dvh-7rem-env(safe-area-inset-bottom)))] min-h-80 w-[calc(100vw-2rem)] max-w-[23.75rem] flex-col overflow-hidden rounded-[22px] border border-line bg-surface [box-shadow:var(--clay-shadow-raised)] md:right-6 md:bottom-6"
            {...panelMotion}
            transition={{ duration: reduceMotion ? 0.12 : 0.18, ease: 'easeOut' }}
          >
            <header className="flex min-h-16 items-center gap-3 border-b border-line px-4">
              <span aria-hidden className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent-wash text-accent-ink">
                <MessageCircle className="size-5" />
              </span>
              <h2 className="min-w-0 flex-1 text-base font-bold text-ink">{t('counter.ask.title')}</h2>
              <button
                type="button"
                onClick={() => setChatMinimized(true)}
                aria-label={t('counter.ask.minimize')}
                className="inline-flex size-12 shrink-0 items-center justify-center rounded-full text-slate hover:bg-well focus-visible:outline-2 focus-visible:outline-accent"
              >
                <Minus aria-hidden className="size-5" />
              </button>
              <button
                type="button"
                onClick={closeChat}
                aria-label={t('counter.ask.close')}
                className="inline-flex size-12 shrink-0 items-center justify-center rounded-full text-slate hover:bg-well focus-visible:outline-2 focus-visible:outline-accent"
              >
                <X aria-hidden className="size-5" />
              </button>
            </header>

            <div ref={conversationRef} role="log" aria-label={t('counter.ask.conversation')} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 && <p className="my-auto text-center text-sm text-slate">{t('counter.ask.empty')}</p>}
              {messages.map((message) => message.role === 'user' ? (
                <div key={message.id} className="flex justify-end">
                  <div className="max-w-[88%] rounded-[22px] bg-accent px-4 py-3 text-on-accent">
                    <p className="text-xs font-semibold text-on-accent/80">{t('counter.ask.youAsked')}</p>
                    <p className="mt-0.5 text-sm font-medium">{message.text}</p>
                  </div>
                </div>
              ) : (
                <div key={message.id} className="flex items-start gap-2.5">
                  <img src={illustrationUrl('mitra-avatar')} alt={t('counter.ask.avatar')} className="size-9 shrink-0 rounded-full bg-well object-cover" />
                  <div className="min-w-0 max-w-[88%] rounded-[22px] bg-well px-4 py-3 text-ink">
                    {message.loading ? (
                      <p role="status" aria-label={t('counter.ask.thinking')} className="animate-pulse text-lg font-bold text-slate">…</p>
                    ) : message.error ? (
                      <div className="flex flex-col items-start gap-2">
                        <p role="alert" className="text-sm text-danger-ink">{t('counter.ask.error')}</p>
                        <ClayButton
                          variant="secondary"
                          className="min-h-12"
                          onClick={() => latest?.answerId === message.id && requestAnswer(message.id, latest.text, language, false)}
                        >
                          {t('common.tryAgain')}
                        </ClayButton>
                      </div>
                    ) : message.response ? (
                      <div aria-live="polite" className="space-y-2">
                        <p className="text-sm leading-relaxed">{message.response.answer}</p>
                        {message.response.card && <AnswerVisual card={message.response.card} />}
                        <p className="text-xs font-medium text-slate-soft">
                          {message.refreshed ? t('counter.ask.refreshed') : t('counter.ask.live')}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-line px-4 pt-3 pb-4">
              <div role="group" aria-label={t('counter.ask.suggestions')} className="mb-3 flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                {CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => ask(t(`counter.ask.${chip}`))}
                    className="min-h-12 rounded-full bg-well px-3 py-2 text-left text-xs font-medium text-ink transition-colors hover:bg-surface-2"
                  >
                    {t(`counter.ask.${chip}`)}
                  </button>
                ))}
              </div>
              <form onSubmit={submit} className="flex gap-2">
                <label htmlFor="floating-chat-input" className="sr-only">{t('counter.ask.label')}</label>
                <input
                  ref={inputRef}
                  id="floating-chat-input"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder={t('counter.ask.placeholder')}
                  autoComplete="off"
                  enterKeyHint="send"
                  className="clay-inset h-12 min-w-0 flex-1 rounded-full px-4 text-sm text-ink placeholder:text-slate-soft"
                />
                <button
                  type="submit"
                  aria-label={t('counter.ask.send')}
                  disabled={!draft.trim()}
                  className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-on-accent disabled:opacity-50"
                >
                  <SendHorizontal aria-hidden className="size-5" />
                </button>
              </form>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </>
  )
}