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

export type QueryRequest = { question: string; language: LanguageCode }

export type QueryResponse = {
  answer: string
  card?: QueryCard
  followUps: string[]
}
