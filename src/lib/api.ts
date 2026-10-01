import { MockApiError, mockRequest, subscribeMockLive } from '../mocks/server'
import type {
  ActionDecisionRequest,
  AgentAction,
  AgentRunReport,
  BriefingResponse,
  Campaign,
  CardTapResponse,
  CashflowResponse,
  Checkout,
  CurrentCheckoutResponse,
  InsightsResponse,
  LinkCardResponse,
  LiveEvent,
  Merchant,
  OtpRequest,
  OtpResponse,
  OtpVerifyRequest,
  OtpVerifyResponse,
  OutcomesResponse,
  QueryRequest,
  QueryResponse,
  RegularsResponse,
  TodaySummary,
  TrustSettings,
} from '../mocks/types'
import { merchantId } from './merchant'

/**
 * Typed API client. When VITE_API_BASE_URL is set, requests go to the real
 * backend; otherwise they are served by the in-browser mock.
 */

const baseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(method: 'GET' | 'POST' | 'PUT', path: string, body?: unknown): Promise<T> {
  if (!baseUrl) {
    try {
      return await mockRequest<T>(method, path, body)
    } catch (error) {
      if (error instanceof MockApiError) throw new ApiError(error.status, error.message)
      throw error
    }
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) throw new ApiError(response.status, await response.text())
  return (await response.json()) as T
}

export const api = {
  getInsights: () => request<InsightsResponse>('GET', '/agent/insights'),
  getActions: () => request<AgentAction[]>('GET', '/agent/actions'),
  decideAction: (payload: ActionDecisionRequest) => request<AgentAction>('POST', '/agent/action/approve', payload),
  getTrustSettings: () => request<TrustSettings>('GET', '/agent/settings/trust'),
  updateTrustSettings: (settings: TrustSettings) => request<TrustSettings>('PUT', '/agent/settings/trust', settings),
  getOutcomes: () => request<OutcomesResponse>('GET', '/agent/outcomes'),
  getCashflow: () => request<CashflowResponse>('GET', '/agent/cashflow'),
  query: (payload: QueryRequest) => request<QueryResponse>('POST', '/agent/query', payload),
  getCampaigns: () => request<Campaign[]>('GET', '/agent/campaigns'),
  getRegulars: () => request<RegularsResponse>('GET', '/agent/regulars'),
  getMerchant: () => request<Merchant>('GET', '/merchant/profile'),
  sendOtp: (payload: OtpRequest) => request<OtpResponse>('POST', '/auth/otp', payload),
  verifyOtp: (payload: OtpVerifyRequest) => request<OtpVerifyResponse>('POST', '/auth/verify', payload),
  briefing: () => request<BriefingResponse>('POST', '/agent/briefing', { merchantId: merchantId() }),
  runAgent: () => request<AgentRunReport>('POST', '/agent/run', { merchantId: merchantId() }),
  createCheckout: (amount: number) => request<Checkout>('POST', '/checkout', { merchantId: merchantId(), amount }),
  cancelCheckout: (checkoutId: string) =>
    request<{ ok: boolean }>('POST', `/checkout/${encodeURIComponent(checkoutId)}/cancel`, { merchantId: merchantId() }),
  currentCheckout: () => request<CurrentCheckoutResponse>('GET', `/checkout/current?merchantId=${encodeURIComponent(merchantId())}`),
  linkCard: (rfidUid: string, payerVpa: string) =>
    request<LinkCardResponse>('POST', '/pos/link-card', { merchantId: merchantId(), rfidUid, payerVpa }),
  // Mock only: the counter's running total and a stand-in for a card touching the RFID reader.
  getToday: () => request<TodaySummary>('GET', '/counter/today'),
  cardTap: (checkoutId?: string) => request<CardTapResponse>('POST', '/pos/card-tap', { merchantId: merchantId(), checkoutId }),
}

/**
 * Payments that arrive on their own (a customer paying by QR). The mock calls
 * back in the page; a real backend would push these over its live stream.
 */
export function subscribeLive(listener: (event: LiveEvent) => void): () => void {
  if (!baseUrl) return subscribeMockLive(listener)
  const source = new EventSource(`${baseUrl.replace(/\/$/, '')}/live?merchantId=${encodeURIComponent(merchantId())}`)
  const onPaid = (message: MessageEvent<string>) => {
    try {
      listener(JSON.parse(message.data) as LiveEvent)
    } catch {
      // Ignore anything that isn't a payment this app understands.
    }
  }
  source.addEventListener('paid', onPaid)
  return () => source.close()
}
