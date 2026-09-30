import { createSeed, merchant, STORY, type MockDatabase } from './seed'
import type {
  ActionDecisionRequest,
  AgentAction,
  OtpRequest,
  OtpResponse,
  OtpVerifyRequest,
  OtpVerifyResponse,
  QueryRequest,
  QueryResponse,
  TrustSettings,
} from './types'

/**
 * In-browser stand-in for the Vyapaar Mitra backend. Requests are routed by
 * method + path exactly like the real API, with 300–900 ms of simulated
 * latency. State lives in memory and is mirrored to localStorage so approvals,
 * undos and settings survive a page refresh.
 */

const STORAGE_KEY = 'vm-mock-db-v1'

export class MockApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function load(): MockDatabase {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as MockDatabase
  } catch {
    // Storage can be unavailable (private mode); fall back to a fresh seed.
  }
  return createSeed()
}

let db: MockDatabase = load()

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // Non-fatal: the session just won't survive a refresh.
  }
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

/** Mock OTP: any 10-digit Indian mobile gets a code, and any 6 digits verify. */
function sendOtp({ phone }: OtpRequest): OtpResponse {
  if (!INDIAN_MOBILE.test(phone)) throw new MockApiError(422, 'Enter a valid 10-digit mobile number')
  return { phoneMasked: maskPhone(phone), resendAfterSeconds: 30 }
}

function verifyOtp({ phone, otp }: OtpVerifyRequest): OtpVerifyResponse {
  if (!INDIAN_MOBILE.test(phone)) throw new MockApiError(422, 'Enter a valid 10-digit mobile number')
  if (!/^\d{6}$/.test(otp)) throw new MockApiError(422, 'Enter the 6-digit OTP')
  return { merchant: { ...merchant, phoneMasked: maskPhone(phone) } }
}

function updateTrust(next: TrustSettings): TrustSettings {
  // Loans can never be switched to auto, whatever the client sends.
  db.trust = { ...next, modes: { ...next.modes, loan: 'recommend_only' } }
  persist()
  return clone(db.trust)
}

/** Keyword-matched answers for Ask Mitra, always paired with a small visual. */
function answerQuery({ question }: QueryRequest): QueryResponse {
  const q = question.toLowerCase()
  const followUps = ['Pichle hafte kaunsa din slow tha?', 'Kitne regular customers aaye?', 'Loan mil sakta hai?']

  if (/slow|din|day|week|hafte|dip|kam/.test(q)) {
    return {
      answer: `Mangalwar sabse slow tha: ₹${STORY.yesterdaySales.toLocaleString('en-IN')}, jo pichle Mangalwar se ${Math.abs(STORY.dipPct)}% kam hai. Yeh pattern 8 mein se 6 hafton mein dikha hai.`,
      card: {
        type: 'bars',
        label: 'Sales last week (₹)',
        data: db.outcomes.weekly.map((d) => ({ label: d.day, value: d.week1, highlight: d.day === 'Tue' })),
      },
      followUps: followUps.filter((f) => !f.includes('din')),
    }
  }
  if (/regular|customer|grahak|kitne/.test(q)) {
    return {
      answer: `Aapke ${db.regulars.total} regular customers hain. Is hafte 28 aaye, 12 abhi tak nahi aaye. Unhe Tuesday offer bhi gaya hai.`,
      card: { type: 'metric', label: 'Regular customers', value: String(db.regulars.total), caption: '28 visited this week' },
      followUps: followUps.filter((f) => !f.includes('regular')),
    }
  }
  if (/loan|credit|udhaar|paisa|cash/.test(q)) {
    const loan = db.actions.find((a) => a.loan)?.loan
    return {
      answer: loan
        ? `Haan, aap ₹${loan.amount.toLocaleString('en-IN')} ke pre-approved loan ke liye eligible ho sakte hain. EMI ₹${loan.emi.toLocaleString('en-IN')} × ${loan.tenureMonths} mahine. Yeh sirf salah hai, faisla aapka.`
        : 'Abhi koi loan offer nahi hai.',
      card: loan ? { type: 'metric', label: 'Pre-approved (recommend only)', value: `₹${loan.amount.toLocaleString('en-IN')}`, caption: `${loan.interestRatePa}% p.a. · ${loan.tenureMonths} months` } : undefined,
      followUps: followUps.filter((f) => !f.includes('Loan')),
    }
  }
  return {
    answer: `${merchant.name} ji, main aapki sales, regular customers, offers aur cashflow ke baare mein bata sakta hoon. Neeche se koi sawaal chuniye.`,
    followUps,
  }
}

type Handler = (body: unknown) => unknown

const routes: Record<string, Handler> = {
  'GET /agent/insights': () => db.insights,
  'GET /agent/actions': () => db.actions,
  'POST /agent/action/approve': (body) => applyDecision(body as ActionDecisionRequest),
  'PUT /agent/settings/trust': (body) => updateTrust(body as TrustSettings),
  'GET /agent/settings/trust': () => db.trust,
  'GET /agent/outcomes': () => db.outcomes,
  'GET /agent/cashflow': () => db.cashflow,
  'POST /agent/query': (body) => answerQuery(body as QueryRequest),
  // Mock-only helpers, not part of the documented backend API.
  'GET /agent/campaigns': () => db.campaigns,
  'GET /agent/regulars': () => db.regulars,
  'GET /merchant/profile': () => merchant,
  'POST /auth/otp': (body) => sendOtp(body as OtpRequest),
  'POST /auth/verify': (body) => verifyOtp(body as OtpVerifyRequest),
}

export async function mockRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  await wait(latency())
  const handler = routes[`${method.toUpperCase()} ${path}`]
  if (!handler) throw new MockApiError(404, `No mock route for ${method} ${path}`)
  return clone(handler(body)) as T
}
