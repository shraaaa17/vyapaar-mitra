/**
 * The merchant this counter belongs to. The backend takes it with every
 * counter and agent call; set VITE_MERCHANT_ID to point at another shop.
 */
export const merchantId = () => (import.meta.env.VITE_MERCHANT_ID as string | undefined) ?? 'MID-RAMESH-001'
