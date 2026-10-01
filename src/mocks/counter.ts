import { localDateKey } from '../lib/date'
import { maskUid, maskVpa } from '../lib/mask'
import type { CardScan, Checkout, CustomerSegment, Payment, PaymentMethod, Regular, TrustSettings } from './types'

/**
 * The mock's counter: customers known by UPI handle, RFID cards (linked to a
 * handle or not), and today's checkouts and payments. Seed data and the mock
 * server both record payments through `recordPayment`, so visit counts, tags
 * and rewards always agree.
 */

/** The counter Soundbox. Payments carry its ID, but the UI never shows it. */
export const TERMINAL_ID = 'PTSB-MUM-0042177'
export const REWARD_EVERY = 12
/** A customer who hasn't come for this long is "lapsed". */
const LAPSED_DAYS = 30
const DAY_MS = 24 * 60 * 60_000

export type CustomerRecord = {
  vpa: string
  /** What the merchant calls them, when known ("Sharma ji"). */
  name?: string
  visits: number
  lastVisit: string | null
  whatsappOptIn: boolean
  /** The Regulars list entry that mirrors this customer. */
  regularId?: string
}

export type CardRecord = {
  uid: string
  /** UPI handle the card is linked to, so card and UPI build one history. */
  vpa?: string
  /** Visits made with the card before it was linked. */
  visits: number
}

export type CounterDb = {
  date: string
  checkouts: Record<string, Checkout>
  /** Today's payments, oldest first. */
  payments: Payment[]
  customers: Record<string, CustomerRecord>
  cards: Record<string, CardRecord>
  /** Which UPI payer and which card come next. */
  upiTurn: number
  cardTurn: number
}

/** Who pays by UPI next, in turn: a regular on their 12th visit, a lapsed customer, a newcomer… */
export const UPI_QUEUE = [
  'anita.m@ybl',
  'gupta.ji@okaxis',
  'rahul.s@paytm',
  'sharma.ji@paytm',
  'meena.k@paytm',
  'arjun.t@okhdfcbank',
  'deepa.r@okicici',
  'kavya.b@ybl',
]

/** Cards that touch the reader, in turn. Two are linked to UPI handles, two are not. */
export const CARD_QUEUE = ['04:A3:1F:9C', '04:7B:22:E1', '04:C9:5D:30', '04:58:0E:B7']

const daysAgo = (now: Date, days: number) => new Date(now.getTime() - days * DAY_MS).toISOString()

function createCustomers(now: Date): Record<string, CustomerRecord> {
  const list: CustomerRecord[] = [
    { vpa: 'sharma.ji@paytm', name: 'Sharma ji', visits: 14, lastVisit: daysAgo(now, 2), whatsappOptIn: true },
    { vpa: 'gupta.ji@okaxis', name: 'Gupta ji', visits: 6, lastVisit: daysAgo(now, 45), whatsappOptIn: true },
    { vpa: 'anita.m@ybl', visits: 11, lastVisit: daysAgo(now, 1), whatsappOptIn: true, regularId: 'cust_12' },
    { vpa: 'deepa.r@okicici', visits: 10, lastVisit: daysAgo(now, 3), whatsappOptIn: true, regularId: 'cust_85' },
    { vpa: 'meena.k@paytm', visits: 9, lastVisit: daysAgo(now, 2), whatsappOptIn: true, regularId: 'cust_09' },
    { vpa: 'priya.n@ybl', visits: 5, lastVisit: daysAgo(now, 4), whatsappOptIn: true, regularId: 'cust_46' },
  ]
  return Object.fromEntries(list.map((c) => [c.vpa, c]))
}

function createCards(): Record<string, CardRecord> {
  return {
    '04:A3:1F:9C': { uid: '04:A3:1F:9C', vpa: 'sharma.ji@paytm', visits: 0 },
    '04:7B:22:E1': { uid: '04:7B:22:E1', visits: 0 },
    '04:C9:5D:30': { uid: '04:C9:5D:30', vpa: 'deepa.r@okicici', visits: 0 },
    '04:58:0E:B7': { uid: '04:58:0E:B7', visits: 2 },
  }
}

export function emptyCounter(now: Date, carry?: Pick<CounterDb, 'customers' | 'cards' | 'upiTurn' | 'cardTurn'>): CounterDb {
  return {
    date: localDateKey(now),
    checkouts: {},
    payments: [],
    customers: carry?.customers ?? createCustomers(now),
    cards: carry?.cards ?? createCards(),
    upiTurn: carry?.upiTurn ?? 0,
    cardTurn: carry?.cardTurn ?? 0,
  }
}

function segmentOf(visits: number, lastVisit: string | null, at: Date): CustomerSegment {
  if (visits === 0) return 'NEW'
  if (lastVisit && at.getTime() - new Date(lastVisit).getTime() > LAPSED_DAYS * DAY_MS) return 'LAPSED'
  return 'REGULAR'
}

export function customerSegment(customer: CustomerRecord, at = new Date()) {
  return segmentOf(customer.visits, customer.lastVisit, at)
}

export function customerLabel(customer: CustomerRecord) {
  return customer.name ?? maskVpa(customer.vpa)
}

/** What the reader reports for a card touched with no bill open. */
export function cardScan(state: CounterDb, uid: string): CardScan {
  const card = state.cards[uid]
  const customer = card?.vpa ? state.customers[card.vpa] : undefined
  const visitCount = customer ? customer.visits : (card?.visits ?? 0)
  return { rfidUid: uid, uidMasked: maskUid(uid), known: visitCount > 0, visitCount }
}

type PaymentInput = {
  checkout: Checkout
  method: PaymentMethod
  /** UPI handle for UPI, card UID for a card. */
  payerKey: string
  at: Date
  trust: TrustSettings
  regulars: Regular[]
}

/**
 * Takes a payment for a pending checkout: counts the visit, tags the customer,
 * flags the loyalty reward and, if marketing may run on its own and the
 * customer agreed to WhatsApp, notes the message the agent sends.
 */
export function recordPayment(state: CounterDb, { checkout, method, payerKey, at, trust, regulars }: PaymentInput): Payment {
  let customer: CustomerRecord | undefined
  let card: CardRecord | undefined
  if (method === 'card') {
    card = state.cards[payerKey] ?? (state.cards[payerKey] = { uid: payerKey, visits: 0 })
    customer = card.vpa ? state.customers[card.vpa] : undefined
  } else {
    customer = state.customers[payerKey] ?? (state.customers[payerKey] = { vpa: payerKey, visits: 0, lastVisit: null, whatsappOptIn: false })
  }

  const before = customer ? customer.visits : card!.visits
  const tag = segmentOf(before, customer ? customer.lastVisit : before > 0 ? daysAgo(at, 7) : null, at)
  const visit = before + 1
  if (customer) {
    customer.visits = visit
    customer.lastVisit = at.toISOString()
  } else {
    card!.visits = visit
  }

  const regular = customer?.regularId ? regulars.find((r) => r.id === customer.regularId) : undefined
  if (regular) {
    regular.visits = visit
    regular.lastVisit = at.toISOString()
    if (visit % regular.reward.everyNVisits === 0) regular.reward.status = 'earned'
  }

  const rewardDue = tag !== 'NEW' && visit % REWARD_EVERY === 0
  const mayMessage = trust.modes.marketing === 'auto' && customer?.whatsappOptIn
  const whatsappKind = rewardDue ? 'reward' : tag === 'LAPSED' ? 'welcomeBack' : null

  checkout.status = 'paid'
  const payment: Payment = {
    checkoutId: checkout.checkoutId,
    amount: checkout.amount,
    method,
    payer: customer ? maskVpa(customer.vpa) : maskUid(payerKey),
    txnId: `TXN${at.getTime().toString().slice(-10)}`,
    tag,
    visit,
    rewardDue,
    whatsapp: mayMessage && whatsappKind && customer ? { to: customerLabel(customer), kind: whatsappKind } : undefined,
    terminalId: TERMINAL_ID,
    paidAt: at.toISOString(),
  }
  state.payments.push(payment)
  return payment
}

/** A checkout made and paid in one go, for the payments already taken this morning. */
export function seedPayment(state: CounterDb, input: Omit<PaymentInput, 'checkout'> & { amount: number; index: number }) {
  const checkout: Checkout = {
    checkoutId: `chk_seed_${input.index}`,
    amount: input.amount,
    status: 'pending',
    upiUri: '',
    createdAt: input.at.toISOString(),
    expiresAt: input.at.toISOString(),
  }
  state.checkouts[checkout.checkoutId] = checkout
  return recordPayment(state, { ...input, checkout })
}
