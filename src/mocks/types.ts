/**
 * Domain types shared by the mock API and the UI. They describe the contract
 * the real backend is expected to honour, so swapping the mock for a live API
 * should need no UI changes.
 */

export type RiskLevel = 'low' | 'medium' | 'high'

export type ActionType = 'marketing' | 'pricing' | 'reorder' | 'loan'

/** How the merchant lets the agent handle each action type. */
export type TrustMode = 'auto' | 'ask' | 'off' | 'recommend_only'

export type LanguageCode = 'hinglish' | 'en' | 'hi' | 'mr'

export type Merchant = {
  id: string
  name: string
  storeName: string
  category: string
  city: string
  phoneMasked: string
}

/** Mock sign-in (not part of the documented backend API). */
export type OtpRequest = { phone: string }
export type OtpResponse = { phoneMasked: string; resendAfterSeconds: number }
export type OtpVerifyRequest = { phone: string; otp: string }
export type OtpVerifyResponse = { merchant: Merchant }

export type TrustSettings = {
  modes: Record<Exclude<ActionType, 'loan'>, Exclude<TrustMode, 'recommend_only'>> & {
    /** Loans are locked: the agent can only ever recommend them. */
    loan: 'recommend_only'
  }
  /** Maximum spend (₹) the agent may commit to a single campaign. */
  campaignSpendCap: number
  /** Minutes after an automatic action during which it can still be undone. */
  undoWindowMinutes: number
}

// ---------- Insights / morning briefing ----------

export type InsightKind = 'sales_dip' | 'loyalty' | 'cash_crunch' | 'reorder' | 'credit'

export type Insight = {
  id: string
  kind: InsightKind
  rank: number
  title: string
  detail: string
  /** Rupee impact of acting on this insight (positive = gain, negative = risk). */
  impactRupees: number
  impactLabel: string
  risk: RiskLevel
  ctaLabel: string
  /** Action this insight leads to, when one exists. */
  actionId?: string
  /** When the agent raised it; today's show in the counter's activity feed. */
  createdAt?: string
}

export type Briefing = {
  date: string
  greetingName: string
  yesterday: {
    dayLabel: string
    sales: number
    comparison: { label: string; sales: number; changePct: number }
  }
  /** The agent's one-line read of the situation. */
  reasoning: string
  /** Text read aloud by the "Listen" button. */
  spokenSummary: string
}

export type InsightsResponse = {
  briefing: Briefing
  insights: Insight[]
}

// ---------- Actions ----------

export type ActionStatus =
  | 'pending' // waiting for the merchant
  | 'approved' // merchant approved a pending action
  | 'rejected'
  | 'auto_done' // executed automatically under trust settings
  | 'paused'
  | 'undone'
  | 'completed' // finished, with a measured outcome

export type ActionWhy = {
  dataUsed: string[]
  pattern: string
  /** 0–1 */
  confidence: number
}

export type LoanOffer = {
  lender: string
  amount: number
  tenureMonths: number
  interestRatePa: number
  emi: number
  totalInterest: number
}

export type AgentAction = {
  id: string
  type: ActionType
  title: string
  summary: string
  why: ActionWhy
  expectedImpact: { label: string; rupees: number }
  risk: RiskLevel
  /** Spend ceiling (₹) for actions that cost money. */
  costCap?: number
  status: ActionStatus
  /** True when trust rules forbid execution; the merchant decides. */
  recommendOnly: boolean
  createdAt: string
  executedAt?: string
  undoUntil?: string
  outcome?: { label: string; changePct?: number; simulated: boolean }
  campaignId?: string
  /** Why a pending action waits for the merchant instead of running on its own. */
  whyNotAuto?: 'asks_first' | 'high_stakes'
  loan?: LoanOffer
  reorderItems?: { name: string; quantity: string; cost: number }[]
}

export type ActionDecision = 'approve' | 'reject' | 'pause' | 'resume' | 'undo'

export type ActionDecisionRequest = {
  actionId: string
  decision: ActionDecision
  /** Optional edits made before approving, e.g. a lower cost cap. */
  edits?: { costCap?: number }
}

// ---------- Campaigns & regulars ----------

export type Campaign = {
  id: string
  actionId: string
  name: string
  channel: 'whatsapp'
  message: string
  audience: { label: string; count: number }
  funnel: { sent: number; delivered: number; read: number; redeemed: number }
  discountCost: number
  extraSales: number
  status: 'running' | 'paused' | 'stopped' | 'completed'
  simulated: boolean
}

export type Regular = {
  id: string
  masked: string
  visits: number
  lastVisit: string
  avgBasket: number
  reward: { status: 'progress' | 'earned' | 'redeemed'; everyNVisits: number }
  consent: { whatsappOptIn: boolean; optedInAt?: string }
}

export type RegularsResponse = {
  total: number
  regulars: Regular[]
}

// ---------- Outcomes / learning ----------

export type OutcomesResponse = {
  headline: {
    label: string
    before: { label: string; sales: number }
    after: { label: string; sales: number }
    changePct: number
    simulated: boolean
  }
  learned: string[]
  nextWeek: string[]
  weekly: { day: string; week1: number; week2: number }[]
}

// ---------- Cashflow ----------

export type CashflowDay = {
  date: string
  inflow: number
  outflow: number
  balance: number
}

export type CashflowResponse = {
  days: CashflowDay[]
  /** Index into `days` where balance first drops below the safety threshold. */
  shortfallDayIndex: number
  safetyThreshold: number
  reorderActionId: string
  loanActionId: string
}

// ---------- Ask Mitra ----------

export type QueryCard =
  | { type: 'metric'; label: string; value: string; caption?: string }
  | { type: 'bars'; label: string; data: { label: string; value: number; highlight?: boolean }[] }
  /** Items ranked by a count (units sold), longest bar first. */
  | { type: 'ranking'; label: string; data: { label: string; value: number }[] }

export type QueryRequest = { question: string; language: LanguageCode; merchantId?: string }

export type QueryResponse = {
  answer: string
  card?: QueryCard
  followUps: string[]
}

// ---------- Counter (checkout at the till) ----------
// Paths and request bodies follow the Vyapaar Mitra backend: POST /checkout,
// POST /checkout/:id/cancel, GET /checkout/current, POST /pos/link-card,
// POST /agent/briefing and POST /agent/run, each with the merchant ID.

export type PaymentMethod = 'card' | 'upi'

/** How the merchant's history sees this customer before today's visit. */
export type CustomerSegment = 'NEW' | 'REGULAR' | 'LAPSED'

/** A bill waiting for a UPI QR scan or a card tap on the RFID reader. */
export type Checkout = {
  checkoutId: string
  amount: number
  status: 'pending' | 'paid' | 'cancelled' | 'expired'
  /** UPI intent the counter QR stands for. */
  upiUri: string
  createdAt: string
  expiresAt: string
}

export type CheckoutRequest = { merchantId: string; amount: number }
export type MerchantRequest = { merchantId: string }
export type CurrentCheckoutResponse = { checkout: Checkout | null }

export type Payment = {
  /** Same as the checkout it paid. */
  checkoutId: string
  amount: number
  method: PaymentMethod
  /** Masked payer: a UPI handle ("sh•••@paytm") or an unlinked card ("Card ••:••:22:E1"). */
  payer: string
  txnId: string
  tag: CustomerSegment
  /** Visit number, counting this one. */
  visit: number
  /** True when this visit earns the loyalty reward. */
  rewardDue: boolean
  /** WhatsApp message the agent sent because of this payment (demo, never really sent). */
  whatsapp?: { to: string; kind: 'reward' | 'welcomeBack' }
  /** Device that took the payment. Internal only: the UI never shows it. */
  terminalId: string
  paidAt: string
}

export type TodaySummary = {
  /** Local date, YYYY-MM-DD. */
  date: string
  sales: number
  /** Number of payments today. */
  count: number
  /** Payments today from customers who had been before. */
  returning: number
  /** Today's latest payments, newest first (at most 20). */
  recent: Payment[]
}

export type PaymentResponse = { payment: Payment; today: TodaySummary }

/** A card read by the RFID reader with no bill open. */
export type CardScan = {
  rfidUid: string
  /** The UID as the UI may show it, e.g. "••:••:22:E1". */
  uidMasked: string
  known: boolean
  visitCount: number
}

/** POST /pos/card-tap (mock only): stands in for a card touching the reader. */
export type CardTapResponse = { kind: 'paid'; payment: Payment; today: TodaySummary } | { kind: 'card'; card: CardScan }

export type LinkCardRequest = { merchantId: string; rfidUid: string; payerVpa: string }
export type LinkCardResponse = { rfidUid: string; payerVpa: string; segment: CustomerSegment; visitCount: number }

/** Pushed by the server (the backend's live stream; the mock's in-page events). */
export type LiveEvent = { type: 'paid'; payment: Payment; today: TodaySummary }

// ---------- Agent ----------

export type BriefingResponse = {
  name: string
  yesterday: number
  changePct: number
  /** English weekday, e.g. "Tuesday". */
  day: string
  today: number
  pending: number
}

export type AgentRunReport = {
  ranAt: string
  /** New insights this cycle; 0 when today's are already raised. */
  insightsCreated: number
  usedLLM: boolean
  insight: { title: string } | null
  /** An action the run created, already handled per the trust settings. */
  newAction: AgentAction | null
  today: TodaySummary
}
