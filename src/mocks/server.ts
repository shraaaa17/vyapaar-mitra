import { localDateKey } from '../lib/date'
import { formatINR } from '../lib/format'
import { SPEND_CAP, UNDO_WINDOWS } from '../lib/trust'
import { safeLocalStorage } from '../lib/storage'
import { detectIntent, phrasebooks } from './answers'
import { CARD_QUEUE, cardScan, customerSegment, emptyCounter, recordPayment, UPI_QUEUE } from './counter'
import { createSeed, merchant, STORY, TOP_ITEMS, type MockDatabase } from './seed'
import type {
  ActionDecisionRequest,
  AgentAction,
  AgentRunReport,
  BriefingResponse,
  CardTapResponse,
  Checkout,
  CheckoutRequest,
  CurrentCheckoutResponse,
  LinkCardRequest,
  LinkCardResponse,
  LiveEvent,
  OtpRequest,
  OtpResponse,
  OtpVerifyRequest,
  OtpVerifyResponse,
  PaymentMethod,
  PaymentResponse,
  QueryRequest,
  QueryResponse,
  TodaySummary,
  TrustSettings,
} from './types'

/**
 * In-browser stand-in for the Vyapaar Mitra backend. Requests are routed by
 * method + path exactly like the real API, with 300–900 ms of simulated
 * latency. State lives in memory and is mirrored to localStorage so approvals,
 * undos and settings survive a page refresh.
 */

// v2: the counter moved to checkouts, linked cards and customer tags.
const STORAGE_KEY = 'vm-mock-db-v2'

export class MockApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function load(): MockDatabase {
  try {
    const raw = safeLocalStorage.getItem(STORAGE_KEY) as string | null
    // Data saved before a part existed gets that part from a fresh seed.
    if (raw) return { ...createSeed(), ...(JSON.parse(raw) as Partial<MockDatabase>) }
  } catch {
    // Unreadable saved data; start the story fresh.
  }
  return createSeed()
}

let db: MockDatabase = load()

/** Saved after every change, so a refresh keeps the story where it was (silently skipped if storage is blocked). */
function persist() {
  void safeLocalStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

/** Restores the pilot story to its starting state. */
export function resetMockDatabase() {
  db = createSeed()
  persist()
}

const clone = <T,>(value: T): T => structuredClone(value)
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const latency = () => 300 + Math.round(Math.random() * 600)

function findAction(id: string): AgentAction {
  const action = db.actions.find((a) => a.id === id)
  if (!action) throw new MockApiError(404, `Action ${id} not found`)
  return action
}

function applyDecision({ actionId, decision, edits }: ActionDecisionRequest): AgentAction {
  const action = findAction(actionId)
  const now = new Date()
  const campaign = action.campaignId ? db.campaigns.find((c) => c.id === action.campaignId) : undefined

  switch (decision) {
    case 'approve':
      if (action.status !== 'pending') throw new MockApiError(409, 'Only pending actions can be approved')
      if (edits?.costCap !== undefined) action.costCap = edits.costCap
      action.status = 'approved'
      action.executedAt = now.toISOString()
      break
    case 'reject':
      if (action.status !== 'pending') throw new MockApiError(409, 'Only pending actions can be rejected')
      action.status = 'rejected'
      break
    case 'pause':
      if (action.status !== 'auto_done') throw new MockApiError(409, 'Only running actions can be paused')
      action.status = 'paused'
      if (campaign) campaign.status = 'paused'
      break
    case 'resume':
      if (action.status !== 'paused') throw new MockApiError(409, 'Only paused actions can be resumed')
      action.status = 'auto_done'
      if (campaign) campaign.status = 'running'
      break
    case 'undo': {
      if (action.status !== 'auto_done' && action.status !== 'paused') {
        throw new MockApiError(409, 'Only automatic actions can be undone')
      }
      if (action.undoUntil && new Date(action.undoUntil) < now) {
        throw new MockApiError(409, 'The undo window has closed')
      }
      action.status = 'undone'
      if (campaign) campaign.status = 'stopped'
      break
    }
  }
  persist()
  return clone(action)
}

const INDIAN_MOBILE = /^[6-9]\d{9}$/

function maskPhone(phone: string) {
  return `+91 ${phone.slice(0, 2)}******${phone.slice(-2)}`
}

/** Mock OTP: any 10-digit Indian mobile gets a code, and any 6 digits except 000000 verify. */
function sendOtp({ phone }: OtpRequest): OtpResponse {
  if (!INDIAN_MOBILE.test(phone)) throw new MockApiError(422, 'Enter a valid 10-digit mobile number')
  return { phoneMasked: maskPhone(phone), resendAfterSeconds: 30 }
}

function verifyOtp({ phone, otp }: OtpVerifyRequest): OtpVerifyResponse {
  if (!INDIAN_MOBILE.test(phone)) throw new MockApiError(422, 'Enter a valid 10-digit mobile number')
  if (!/^\d{6}$/.test(otp)) throw new MockApiError(422, 'Enter the 6-digit OTP')
  // 000000 plays the part of a wrong OTP so the error state can be seen.
  if (otp === '000000') throw new MockApiError(401, 'Incorrect OTP')
  return { merchant: { ...merchant, phoneMasked: maskPhone(phone) } }
}

function updateTrust(next: TrustSettings): TrustSettings {
  const { min, max, step } = SPEND_CAP
  const cap = next.campaignSpendCap
  if (!Number.isInteger(cap) || cap < min || cap > max || cap % step !== 0) {
    throw new MockApiError(422, `Spend cap must be ₹${min}–₹${max} in steps of ₹${step}`)
  }
  if (!(UNDO_WINDOWS as readonly number[]).includes(next.undoWindowMinutes)) {
    throw new MockApiError(422, `Undo window must be one of ${UNDO_WINDOWS.join(', ')} minutes`)
  }
  // Loans can never be switched to auto, whatever the client sends.
  db.trust = { ...next, modes: { ...next.modes, loan: 'recommend_only' } }
  persist()
  return clone(db.trust)
}

// ---------- Live events ----------
// The backend pushes payments over a live stream; the mock calls listeners in the page.

type LiveListener = (event: LiveEvent) => void
const listeners = new Set<LiveListener>()

export function subscribeMockLive(listener: LiveListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function emit(event: LiveEvent) {
  listeners.forEach((listener) => listener(clone(event)))
}

// ---------- Counter ----------

const BILL_SECONDS = 60
const MAX_BILL = 100_000
/** With no real payment network, the customer "scans the QR and pays" this long after the bill opens. */
const AUTO_PAY_MS = 8_000

/** Today's counter; a new day starts with an empty till but keeps customers and cards. */
function counter() {
  const today = localDateKey()
  if (db.counter.date !== today) db.counter = emptyCounter(new Date(), db.counter)
  return db.counter
}

function todaySummary(): TodaySummary {
  const { date, payments } = counter()
  return {
    date,
    sales: payments.reduce((sum, p) => sum + p.amount, 0),
    count: payments.length,
    returning: payments.filter((p) => p.tag !== 'NEW').length,
    recent: payments.slice(-20).reverse(),
  }
}

/** The open bill, if any; one that ran out of time is marked expired on the way. */
function pendingCheckout(): Checkout | null {
  const state = counter()
  let open: Checkout | null = null
  for (const checkout of Object.values(state.checkouts)) {
    if (checkout.status !== 'pending') continue
    if (new Date(checkout.expiresAt) <= new Date()) {
      checkout.status = 'expired'
      persist()
    } else {
      open = checkout
    }
  }
  return open
}

const autoPayTimers = new Map<string, ReturnType<typeof setTimeout>>()

function scheduleAutoPay(checkout: Checkout) {
  if (autoPayTimers.has(checkout.checkoutId)) return
  const due = new Date(checkout.createdAt).getTime() + AUTO_PAY_MS - Date.now()
  const timer = setTimeout(() => {
    autoPayTimers.delete(checkout.checkoutId)
    const open = pendingCheckout()
    if (open?.checkoutId !== checkout.checkoutId) return
    const state = counter()
    const vpa = UPI_QUEUE[state.upiTurn % UPI_QUEUE.length]
    state.upiTurn += 1
    emit({ type: 'paid', ...pay(open, 'upi', vpa) })
  }, Math.max(due, 0))
  autoPayTimers.set(checkout.checkoutId, timer)
}

function stopAutoPay(checkoutId: string) {
  clearTimeout(autoPayTimers.get(checkoutId))
  autoPayTimers.delete(checkoutId)
}

function pay(checkout: Checkout, method: PaymentMethod, payerKey: string): PaymentResponse {
  stopAutoPay(checkout.checkoutId)
  const payment = recordPayment(counter(), { checkout, method, payerKey, at: new Date(), trust: db.trust, regulars: db.regulars.regulars })
  persist()
  return { payment, today: todaySummary() }
}

function createCheckout({ amount }: CheckoutRequest): Checkout {
  if (!Number.isInteger(amount) || amount < 1 || amount > MAX_BILL) {
    throw new MockApiError(422, `Bill amount must be ₹1–₹${MAX_BILL.toLocaleString('en-IN')}`)
  }
  // One bill at a time: a new one replaces any bill still open.
  const open = pendingCheckout()
  if (open) {
    open.status = 'cancelled'
    stopAutoPay(open.checkoutId)
  }
  const now = new Date()
  const checkoutId = `chk_${now.getTime().toString(36)}`
  const checkout: Checkout = {
    checkoutId,
    amount,
    status: 'pending',
    upiUri: `upi://pay?pa=rameshkirana@paytm&pn=${encodeURIComponent(merchant.storeName)}&am=${amount}.00&cu=INR&tr=${checkoutId}`,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + BILL_SECONDS * 1000).toISOString(),
  }
  counter().checkouts[checkoutId] = checkout
  persist()
  scheduleAutoPay(checkout)
  return checkout
}

function currentCheckout(): CurrentCheckoutResponse {
  const checkout = pendingCheckout()
  // After a page reload the timer is gone; pick the open bill up again.
  if (checkout) scheduleAutoPay(checkout)
  return { checkout }
}

function cancelCheckout(checkoutId: string) {
  const checkout = counter().checkouts[checkoutId]
  if (!checkout) throw new MockApiError(404, 'Checkout not found')
  if (checkout.status === 'pending') checkout.status = 'cancelled'
  stopAutoPay(checkoutId)
  persist()
  return { ok: true, checkout }
}

/**
 * Mock only: a card touching the RFID reader. With a bill open (or the one
 * named) the card pays it; with no bill open the reader just reports the card,
 * so the merchant can link it to a customer's UPI ID.
 */
function cardTap({ checkoutId }: { checkoutId?: string }): CardTapResponse {
  const state = counter()
  const open = pendingCheckout()
  if (checkoutId) {
    const named = state.checkouts[checkoutId]
    if (!named) throw new MockApiError(404, 'Checkout not found')
    if (named.status === 'expired') throw new MockApiError(410, 'Bill expired')
    if (named.status !== 'pending') throw new MockApiError(409, `Bill already ${named.status}`)
  }
  if (open) {
    const uid = CARD_QUEUE[state.cardTurn % CARD_QUEUE.length]
    state.cardTurn += 1
    return { kind: 'paid', ...pay(open, 'card', uid) }
  }
  // The demo's first unlinked card comes up first, so linking can be shown.
  const uid = CARD_QUEUE.find((id) => !state.cards[id]?.vpa) ?? CARD_QUEUE[state.cardTurn++ % CARD_QUEUE.length]
  persist()
  return { kind: 'card', card: cardScan(state, uid) }
}

const VPA = /^[a-z0-9._-]{2,}@[a-z][a-z0-9]{1,}$/i

function linkCard({ rfidUid, payerVpa }: LinkCardRequest): LinkCardResponse {
  const vpa = payerVpa.trim().toLowerCase()
  if (!VPA.test(vpa)) throw new MockApiError(422, 'Enter a UPI ID like name@paytm')
  const state = counter()
  const card = state.cards[rfidUid] ?? (state.cards[rfidUid] = { uid: rfidUid, visits: 0 })
  const customer =
    state.customers[vpa] ?? (state.customers[vpa] = { vpa, visits: 0, lastVisit: null, whatsappOptIn: false })
  // Visits made with the card before it was linked now count for the customer.
  if (card.vpa !== vpa) {
    customer.visits += card.visits
    card.visits = 0
  }
  card.vpa = vpa
  persist()
  return { rfidUid, payerVpa: vpa, segment: customerSegment(customer), visitCount: customer.visits }
}

// ---------- Agent: briefing and run ----------

function briefing(): BriefingResponse {
  const { yesterday } = db.insights.briefing
  return {
    name: merchant.name,
    yesterday: yesterday.sales,
    changePct: yesterday.comparison.changePct,
    day: yesterday.dayLabel,
    today: todaySummary().sales,
    pending: db.actions.filter((a) => a.status === 'pending').length,
  }
}

const SUGAR_REORDER_ID = 'act_reorder_sugar'
const SUGAR_INSIGHT_ID = 'ins_sugar_oil'

/**
 * "Run agent now": one agent cycle. The first run of the day spots sugar and
 * oil selling fast and raises a reorder, which follows the trust setting:
 * waits for approval, runs on its own (with undo), or is dropped when off.
 * Later runs find nothing new.
 */
function runAgent(): AgentRunReport {
  const now = new Date()
  const report: AgentRunReport = { ranAt: now.toISOString(), insightsCreated: 0, usedLLM: false, insight: null, newAction: null, today: todaySummary() }
  if (db.insights.insights.some((i) => i.id === SUGAR_INSIGHT_ID)) return report

  const title = 'Sugar and cooking oil selling fast today'
  db.insights.insights.push({
    id: SUGAR_INSIGHT_ID,
    kind: 'reorder',
    rank: db.insights.insights.length + 1,
    title,
    detail: 'About 2 days of stock left at today’s pace.',
    impactRupees: 1_900,
    impactLabel: '₹1,900 sales protected',
    risk: 'medium',
    ctaLabel: 'Review reorder',
    actionId: SUGAR_REORDER_ID,
    createdAt: now.toISOString(),
  })
  report.insightsCreated = 1
  report.insight = { title }

  const mode = db.trust.modes.reorder
  if (mode !== 'off') {
    const auto = mode === 'auto'
    const action: AgentAction = {
      id: SUGAR_REORDER_ID,
      type: 'reorder',
      title: 'Reorder sugar and cooking oil',
      summary: 'Sugar and oil are selling faster today; about 2 days of stock left.',
      why: {
        dataUsed: ['Today’s counter payments', 'Item-level sales from POS taps', 'Your current stock estimate'],
        pattern: 'Sugar and oil are selling 35% above a usual weekday.',
        confidence: 0.76,
      },
      expectedImpact: { label: 'Avoids about ₹1,900 of lost sales', rupees: 1_900 },
      risk: 'medium',
      costCap: 3_400,
      status: auto ? 'auto_done' : 'pending',
      recommendOnly: false,
      whyNotAuto: auto ? undefined : 'asks_first',
      createdAt: now.toISOString(),
      executedAt: auto ? now.toISOString() : undefined,
      undoUntil: auto ? new Date(now.getTime() + db.trust.undoWindowMinutes * 60_000).toISOString() : undefined,
      reorderItems: [
        { name: 'Sugar', quantity: '2 × 25 kg', cost: 2_200 },
        { name: 'Sunflower oil', quantity: '1 × 15 L', cost: 1_200 },
      ],
    }
    db.actions.unshift(action)
    report.newAction = clone(action)
  }
  persist()
  return report
}

// ---------- Ask Mitra ----------

/** Answers in the merchant's language, always paired with a small visual when there is a number to show. */
function answerQuery({ question, language }: QueryRequest): QueryResponse {
  const say = phrasebooks[language] ?? phrasebooks.hinglish
  const { labels } = say
  const today = todaySummary()

  switch (detectIntent(question)) {
    case 'today':
      return today.count === 0
        ? { answer: say.todayEmpty, followUps: [] }
        : {
            answer: say.today({ sales: formatINR(today.sales), payments: today.count, returning: today.returning }),
            card: { type: 'metric', label: labels.todaySoFar, value: formatINR(today.sales), caption: labels.payments(today.count) },
            followUps: [],
          }
    case 'last': {
      const last = today.recent[0]
      if (!last) return { answer: say.lastEmpty, followUps: [] }
      const minutes = Math.floor((Date.now() - new Date(last.paidAt).getTime()) / 60_000)
      return {
        answer: say.last({
          amount: formatINR(last.amount),
          method: last.method,
          payer: last.payer,
          minutes,
          visits: last.visit,
          returning: last.tag !== 'NEW',
        }),
        card: { type: 'metric', label: labels.lastPayment, value: formatINR(last.amount), caption: last.payer },
        followUps: [],
      }
    }
    case 'top': {
      const [first, ...rest] = TOP_ITEMS
      return {
        answer: say.top({ item: first.name, units: first.units, next: rest.slice(0, 2).map((i) => ({ item: i.name, units: i.units })) }),
        card: { type: 'ranking', label: labels.topThisWeek, data: TOP_ITEMS.map((i) => ({ label: i.name, value: i.units })) },
        followUps: [],
      }
    }
    case 'customers': {
      const newToday = counter().payments.filter((p) => p.tag === 'NEW').length
      const total = STORY.customersThisMonth + newToday
      return {
        answer: say.customers({ total, regulars: db.regulars.total, quiet: STORY.quietRegulars, newToday }),
        card: { type: 'metric', label: labels.customersThisMonth, value: String(total), caption: labels.customersCaption(db.regulars.total, newToday) },
        followUps: [],
      }
    }
    case 'regulars':
      return {
        answer: say.regulars({ returning: today.returning, total: db.regulars.total, thisWeek: 28 }),
        card: { type: 'metric', label: labels.returningToday, value: String(today.returning), caption: labels.ofRegulars(db.regulars.total) },
        followUps: [],
      }
    case 'loan': {
      const loan = db.actions.find((a) => a.loan)?.loan
      return loan
        ? {
            answer: say.loan({ amount: formatINR(loan.amount), emi: formatINR(loan.emi), months: loan.tenureMonths }),
            card: { type: 'metric', label: labels.preApproved, value: formatINR(loan.amount), caption: labels.loanCaption(loan.interestRatePa, loan.tenureMonths) },
            followUps: [],
          }
        : { answer: say.noLoan, followUps: [] }
    }
    case 'offer': {
      const campaign = db.campaigns[0]
      return {
        answer: say.offer({ count: campaign.audience.count, redeemed: campaign.funnel.redeemed, extra: formatINR(campaign.extraSales) }),
        card: { type: 'metric', label: labels.offerRedeemed, value: `${campaign.funnel.redeemed}/${campaign.funnel.sent}`, caption: campaign.name },
        followUps: [],
      }
    }
    case 'dip':
      return {
        answer: say.dip({ sales: formatINR(STORY.yesterdaySales), pct: Math.abs(STORY.dipPct) }),
        card: {
          type: 'bars',
          label: labels.salesLastWeek,
          data: db.outcomes.weekly.map((d) => ({ label: labels.days[d.day as keyof typeof labels.days], value: d.week1, highlight: d.day === 'Tue' })),
        },
        followUps: [],
      }
    default:
      return { answer: say.fallback({ name: merchant.name }), followUps: [] }
  }
}

type Request = { body: unknown; params: Record<string, string>; query: Record<string, string> }
type Handler = (request: Request) => unknown

const routes: Record<string, Handler> = {
  'GET /agent/insights': () => db.insights,
  'GET /agent/actions': () => db.actions,
  'POST /agent/action/approve': ({ body }) => applyDecision(body as ActionDecisionRequest),
  'PUT /agent/settings/trust': ({ body }) => updateTrust(body as TrustSettings),
  'GET /agent/settings/trust': () => db.trust,
  'GET /agent/outcomes': () => db.outcomes,
  'GET /agent/cashflow': () => db.cashflow,
  'POST /agent/query': ({ body }) => answerQuery(body as QueryRequest),
  'POST /agent/briefing': () => briefing(),
  'POST /agent/run': () => runAgent(),
  'POST /checkout': ({ body }) => createCheckout(body as CheckoutRequest),
  'GET /checkout/current': () => currentCheckout(),
  'POST /checkout/:id/cancel': ({ params }) => cancelCheckout(params.id),
  'POST /pos/link-card': ({ body }) => linkCard(body as LinkCardRequest),
  // Mock-only helpers, not part of the documented backend API.
  'GET /counter/today': () => todaySummary(),
  'POST /pos/card-tap': ({ body }) => cardTap((body ?? {}) as { checkoutId?: string }),
  'GET /agent/campaigns': () => db.campaigns,
  'GET /agent/regulars': () => db.regulars,
  'GET /merchant/profile': () => merchant,
  'POST /auth/otp': ({ body }) => sendOtp(body as OtpRequest),
  'POST /auth/verify': ({ body }) => verifyOtp(body as OtpVerifyRequest),
}

/** Finds the route for "METHOD /path", where a ":name" segment matches any value. */
function match(method: string, pathname: string): { handler: Handler; params: Record<string, string> } | null {
  const segments = pathname.split('/')
  for (const [key, handler] of Object.entries(routes)) {
    const [routeMethod, routePath] = key.split(' ')
    const pattern = routePath.split('/')
    if (routeMethod !== method || pattern.length !== segments.length) continue
    if (!pattern.every((part, i) => part.startsWith(':') || part === segments[i])) continue
    const params: Record<string, string> = {}
    pattern.forEach((part, i) => {
      if (part.startsWith(':')) params[part.slice(1)] = decodeURIComponent(segments[i])
    })
    return { handler, params }
  }
  return null
}

export async function mockRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  await wait(latency())
  const [pathname, search = ''] = path.split('?')
  const found = match(method.toUpperCase(), pathname)
  if (!found) throw new MockApiError(404, `No mock route for ${method} ${pathname}`)
  const query = Object.fromEntries(new URLSearchParams(search))
  return clone(found.handler({ body, params: found.params, query })) as T
}
