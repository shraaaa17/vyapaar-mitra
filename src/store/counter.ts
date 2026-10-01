import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { en } from '../i18n/locales/en'
import { api, ApiError } from '../lib/api'
import { localDateKey } from '../lib/date'
import { maskUid, maskVpa } from '../lib/mask'
import { safeLocalStorage } from '../lib/storage'
import type { ActionType, CardScan, Checkout, LinkCardResponse, Payment, PaymentMethod, TodaySummary } from '../mocks/types'

/**
 * The counter's shared store. One payment updates everything that depends on
 * it in a single step: today's sales, the bill card, the Soundbox caption and
 * `revision`, which Ask Vyapaar Mitra keys its answers on so they refresh.
 * The activity feed lists today's payments from `today`, so it follows too.
 * Captions and feed lines are stored as translation keys with values, so
 * switching language rewrites them.
 */

type PluralFree<K> = K extends `${infer Base}_${'one' | 'other'}` ? Base : K
type Counter = typeof en.counter
export type LineKey = `counter.lines.${PluralFree<keyof Counter['lines']>}` | `counter.feed.${PluralFree<keyof Counter['feed']>}`

/** Money values are rupees; `type` is shown as the action's name ("the WhatsApp offer"). */
export type LineParams = {
  amount?: number
  today?: number
  yesterday?: number
  pct?: number
  visits?: number
  count?: number
  name?: string
  day?: string
  type?: ActionType
  via?: PaymentMethod
  /** Already masked or display-ready: a customer label, card UID or UPI handle. */
  to?: string
  uid?: string
  vpa?: string
}

export type Line = { key: LineKey; params?: LineParams }

/** Where an activity entry comes from; sets its label and the colour of its edge. */
export type FeedSource = 'soundbox' | 'whatsapp' | 'dashboard' | 'ai'

/** A feed entry's text: a translated line, or text from the agent (titles are in English). */
export type FeedBody = Line | { text: string; lang?: string }

export type CounterEvent = { id: string; at: number; source: FeedSource; label: Line; body: FeedBody }

export type Caption = {
  id: number
  at: number
  line: Line
  /** Read aloud when voice is on. */
  speak: boolean
}

export type BillFlow =
  | { step: 'idle'; amount?: number; error?: 'create'; expired?: boolean }
  | { step: 'creating'; amount: number }
  | { step: 'awaiting'; checkout: Checkout; tapping: boolean; error?: 'tap' }
  | { step: 'paid'; payment: Payment }

/** A card the reader picked up with no bill open, offered for linking to a UPI ID. */
export type CardAlert = {
  scan: CardScan
  status: 'idle' | 'linking' | 'linked'
  linked?: LinkCardResponse
  error?: 'invalid' | 'failed'
}

type CounterState = {
  today: TodaySummary | null
  todayError: boolean
  /** Bumped on every payment; anything derived from today's payments refreshes on it. */
  revision: number
  flow: BillFlow
  /** The card waiting at the reader, if any. */
  card: CardAlert | null
  cardReading: boolean
  cardReadFailed: boolean
  caption: Caption | null
  /** Today's counter events (briefings, agent cycles, decisions, linked cards), newest first. */
  events: CounterEvent[]
  eventsDate: string
  /** Starts off on every visit, like the Soundbox's own "Enable voice" button. */
  voiceOn: boolean
  /** True while the Soundbox voice is reading a caption. */
  speaking: boolean
  briefing: 'idle' | 'loading' | 'error'

  loadToday: () => Promise<void>
  /** Picks up a bill still open on the server, e.g. after a reload. */
  resumeBill: () => Promise<void>
  createBill: (amount: number) => Promise<void>
  /** The customer taps a card on the reader while the bill is open. */
  tapCard: () => Promise<void>
  cancelBill: () => void
  nextCustomer: () => void
  /** A payment reported by the server (live stream) or by a card tap. Safe to call twice. */
  receivePayment: (payment: Payment, today: TodaySummary) => void
  /** A card touches the reader with no bill open. */
  readCard: () => Promise<void>
  linkCard: (vpa: string) => Promise<void>
  closeCard: () => void
  setVoice: (on: boolean) => void
  playBriefing: () => Promise<void>
  /** Shows (and, if `speak`, reads out) a Soundbox line. */
  say: (line: Line, speak?: boolean) => void
  /** Adds an entry to today's activity feed. */
  log: (source: FeedSource, label: Line, body: FeedBody) => void
  /** Takes a fresher summary, e.g. from an agent run. */
  setToday: (today: TodaySummary) => void
}

const MAX_EVENTS = 60

// Each bill gets a token; a late reply for a bill the merchant already left is ignored.
let flowToken = 0
let expiryTimer: number | undefined
let captionId = 0
let eventId = 0
/** Checkouts whose payment has been taken in, so a payment reported twice counts once. */
const received = new Set<string>()

function clearExpiry() {
  window.clearTimeout(expiryTimer)
  expiryTimer = undefined
}

/** What the Soundbox says for a payment ("₹120 prapt hue, card se."). */
export function paymentLine(payment: Payment): Line {
  const params = { amount: payment.amount, via: payment.method, visits: payment.visit }
  return { key: payment.rewardDue ? 'counter.lines.paidReward' : 'counter.lines.paid', params }
}

/** The newer of two summaries of the same day (replies can arrive out of order). */
function fresher(current: TodaySummary | null, next: TodaySummary) {
  if (!current || current.date !== next.date) return next
  return next.count >= current.count ? next : current
}

export const useCounter = create<CounterState>()(
  persist(
    (set, get) => {
      const expire = (checkout: Checkout) => {
        const flow = get().flow
        // A tap already on its way decides for itself (the server refuses it once the bill has expired).
        if (flow.step !== 'awaiting' || flow.checkout.checkoutId !== checkout.checkoutId || flow.tapping) return
        flowToken += 1
        clearExpiry()
        set({ flow: { step: 'idle', amount: checkout.amount, expired: true } })
      }

      const showBill = (checkout: Checkout) => {
        set({ flow: { step: 'awaiting', checkout, tapping: false }, card: null, cardReadFailed: false })
        clearExpiry()
        const ms = new Date(checkout.expiresAt).getTime() - Date.now()
        expiryTimer = window.setTimeout(() => expire(checkout), Math.max(ms, 0))
      }

      return {
        today: null,
        todayError: false,
        revision: 0,
        flow: { step: 'idle' },
        card: null,
        cardReading: false,
        cardReadFailed: false,
        caption: null,
        events: [],
        eventsDate: localDateKey(),
        voiceOn: false,
        speaking: false,
        briefing: 'idle',

        loadToday: async () => {
          try {
            const today = await api.getToday()
            set((s) => ({ today: fresher(s.today, today), todayError: false }))
          } catch {
            set({ todayError: true })
          }
        },

        resumeBill: async () => {
          const token = flowToken
          try {
            const { checkout } = await api.currentCheckout()
            if (checkout && token === flowToken && get().flow.step === 'idle') showBill(checkout)
          } catch {
            // Nothing to pick up; the merchant starts a new bill.
          }
        },

        createBill: async (amount) => {
          const token = ++flowToken
          clearExpiry()
          set({ flow: { step: 'creating', amount }, card: null })
          try {
            const checkout = await api.createCheckout(amount)
            if (token !== flowToken) {
              void api.cancelCheckout(checkout.checkoutId).catch(() => undefined)
              return
            }
            showBill(checkout)
          } catch {
            if (token === flowToken) set({ flow: { step: 'idle', error: 'create', amount } })
          }
        },

        tapCard: async () => {
          const flow = get().flow
          if (flow.step !== 'awaiting' || flow.tapping) return
          set({ flow: { ...flow, tapping: true, error: undefined } })
          try {
            const result = await api.cardTap(flow.checkout.checkoutId)
            if (result.kind === 'paid') {
              get().receivePayment(result.payment, result.today)
            } else {
              // The bill was already settled (paid by QR a moment ago); the live update has moved on.
              set((s) => (s.flow.step === 'awaiting' && s.flow.checkout.checkoutId === flow.checkout.checkoutId ? { flow: { ...s.flow, tapping: false } } : {}))
            }
          } catch (error) {
            const now = get().flow
            if (now.step !== 'awaiting' || now.checkout.checkoutId !== flow.checkout.checkoutId) return
            if (error instanceof ApiError && error.status === 410) {
              set({ flow: { ...now, tapping: false } })
              expire(flow.checkout)
            } else {
              set({ flow: { ...now, tapping: false, error: 'tap' } })
            }
          }
        },

        cancelBill: () => {
          const flow = get().flow
          if (flow.step === 'creating') {
            flowToken += 1
            set({ flow: { step: 'idle', amount: flow.amount } })
            return
          }
          if (flow.step !== 'awaiting' || flow.tapping) return
          flowToken += 1
          clearExpiry()
          void api.cancelCheckout(flow.checkout.checkoutId).catch(() => undefined)
          set({ flow: { step: 'idle', amount: flow.checkout.amount } })
        },

        nextCustomer: () => {
          flowToken += 1
          clearExpiry()
          set({ flow: { step: 'idle' } })
        },

        receivePayment: (payment, today) => {
          if (received.has(payment.checkoutId)) {
            set((s) => ({ today: fresher(s.today, today) }))
            return
          }
          received.add(payment.checkoutId)
          const flow = get().flow
          const forThisBill = flow.step === 'awaiting' && flow.checkout.checkoutId === payment.checkoutId
          if (forThisBill) {
            flowToken += 1
            clearExpiry()
          }
          set((s) => ({
            ...(forThisBill ? { flow: { step: 'paid', payment } as BillFlow } : {}),
            today: fresher(s.today, today),
            revision: s.revision + 1,
          }))
          get().say(paymentLine(payment))
        },

        readCard: async () => {
          if (get().cardReading) return
          set({ cardReading: true, cardReadFailed: false })
          try {
            const result = await api.cardTap()
            if (result.kind === 'card') set({ card: { scan: result.card, status: 'idle' } })
            // A bill opened elsewhere (another tab) was open after all: the card paid it.
            else get().receivePayment(result.payment, result.today)
          } catch {
            set({ cardReadFailed: true })
          } finally {
            set({ cardReading: false })
          }
        },

        linkCard: async (vpa) => {
          const card = get().card
          if (!card || card.status === 'linking') return
          set({ card: { ...card, status: 'linking', error: undefined } })
          try {
            const linked = await api.linkCard(card.scan.rfidUid, vpa)
            set((s) => (s.card?.scan.rfidUid === card.scan.rfidUid ? { card: { ...card, status: 'linked', linked } } : {}))
            get().log(
              'ai',
              { key: 'counter.feed.cardLinked' },
              { key: 'counter.lines.cardLinked', params: { uid: maskUid(linked.rfidUid), vpa: maskVpa(linked.payerVpa) } },
            )
          } catch (error) {
            const reason = error instanceof ApiError && error.status === 422 ? 'invalid' : 'failed'
            set((s) => (s.card?.scan.rfidUid === card.scan.rfidUid ? { card: { ...card, status: card.linked ? 'linked' : 'idle', error: reason } } : {}))
          }
        },

        closeCard: () => set({ card: null }),

        setVoice: (voiceOn) => {
          set({ voiceOn })
          if (voiceOn) get().say({ key: 'counter.lines.voiceReady' })
        },

        playBriefing: async () => {
          if (get().briefing === 'loading') return
          set({ briefing: 'loading' })
          try {
            const b = await api.briefing()
            const line: Line = {
              key: 'counter.lines.briefing',
              params: { name: b.name, yesterday: b.yesterday, pct: Math.abs(b.changePct), day: b.day, today: b.today, count: b.pending },
            }
            set({ briefing: 'idle' })
            get().say(line)
            get().log('soundbox', { key: 'counter.feed.soundbox' }, line)
          } catch {
            set({ briefing: 'error' })
          }
        },

        say: (line, speak = true) => set({ caption: { id: ++captionId, at: Date.now(), line, speak } }),

        log: (source, label, body) =>
          set((s) => {
            const date = localDateKey()
            const kept = s.eventsDate === date ? s.events : []
            const event: CounterEvent = { id: `evt_${Date.now().toString(36)}_${++eventId}`, at: Date.now(), source, label, body }
            return { events: [event, ...kept].slice(0, MAX_EVENTS), eventsDate: date }
          }),

        setToday: (today) => set((s) => ({ today: fresher(s.today, today) })),
      }
    },
    {
      name: 'vm-counter-v2',
      storage: createJSONStorage(() => safeLocalStorage),
      // Only today's feed survives a refresh. An open bill is picked up from the server instead.
      partialize: (s) => ({ events: s.events, eventsDate: s.eventsDate }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<CounterState> | undefined
        if (!saved) return current
        const sameDay = saved.eventsDate === localDateKey()
        return { ...current, events: sameDay ? (saved.events ?? []) : [], eventsDate: localDateKey() }
      },
    },
  ),
)
