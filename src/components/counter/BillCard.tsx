import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Check, Clock3, CreditCard, Gift, Loader2, Nfc, ReceiptIndianRupee, Smartphone, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { useMerchant } from '../../hooks/queries'
import { useNow } from '../../hooks/useNow'
import { cn } from '../../lib/cn'
import { formatINR } from '../../lib/format'
import type { Checkout, Payment } from '../../mocks/types'
import { useCounter, type BillFlow } from '../../store/counter'
import { ClayButton, ClayCard } from '../ui'
import { CardLink } from './CardLink'
import { QrPattern } from './QrPattern'

const QUICK_AMOUNTS = [50, 120, 240, 310, 500]
const MAX_AMOUNT = 100_000

/**
 * New bill → QR and "Tap card" with a 60-second expiry → payment received.
 * With no bill open, a customer's card can be linked to their UPI ID.
 * The Soundbox caption (the counter's live region) announces payments, so
 * this card only moves focus to the next useful control when the old one
 * vanishes, and announces an expired bill itself.
 */
export function BillCard() {
  const { t } = useTranslation()
  const flow = useCounter((s) => s.flow)
  const cardRef = useRef<HTMLDivElement>(null)
  const expired = flow.step === 'idle' && flow.expired

  return (
    <ClayCard ref={cardRef} as="section" aria-labelledby="bill-title" padding="none" className="overflow-hidden">
      <header className="flex items-center gap-3 px-5 pt-5 sm:px-6">
        <span aria-hidden className="inline-flex size-10 items-center justify-center rounded-xl bg-accent-wash text-accent-ink">
          <ReceiptIndianRupee className="size-5" />
        </span>
        <h2 id="bill-title" className="text-lg font-bold">
          {t('counter.bill.title')}
        </h2>
      </header>
      <div className="px-5 pt-4 pb-5 sm:px-6 sm:pb-6">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={flow.step === 'creating' ? 'idle' : flow.step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <FlowStep flow={flow} cardRef={cardRef} />
          </motion.div>
        </AnimatePresence>
        <p aria-live="polite" className="sr-only">
          {expired ? t('counter.bill.expired') : ''}
        </p>
      </div>
    </ClayCard>
  )
}

function FlowStep({ flow, cardRef }: { flow: BillFlow; cardRef: RefObject<HTMLDivElement | null> }) {
  switch (flow.step) {
    case 'idle':
    case 'creating':
      return (
        <div className="flex flex-col gap-5">
          <AmountForm flow={flow} cardRef={cardRef} />
          {flow.step === 'idle' && <CardLink />}
        </div>
      )
    case 'awaiting':
      return <Awaiting checkout={flow.checkout} tapping={flow.tapping} error={flow.error} cardRef={cardRef} />
    case 'paid':
      return <Paid payment={flow.payment} cardRef={cardRef} />
  }
}

/**
 * Moves focus to `target` when this step appears, but only if focus was in the
 * bill card (or lost to the page), so a payment or an expired bill never pulls
 * focus away from something else the merchant is doing.
 */
function useStepFocus<T extends HTMLElement>(cardRef: RefObject<HTMLDivElement | null>) {
  const target = useRef<T>(null)
  useEffect(() => {
    const active = document.activeElement
    if (active === document.body || active === null || cardRef.current?.contains(active)) {
      target.current?.focus({ preventScroll: true })
    }
    // cardRef is a stable ref object, so this runs once, when the step appears.
  }, [cardRef])
  return target
}

function AmountForm({ flow, cardRef }: { flow: Extract<BillFlow, { step: 'idle' | 'creating' }>; cardRef: RefObject<HTMLDivElement | null> }) {
  const { t } = useTranslation()
  const createBill = useCounter((s) => s.createBill)
  const cancelBill = useCounter((s) => s.cancelBill)
  const inputRef = useStepFocus<HTMLInputElement>(cardRef)
  const [value, setValue] = useState(() => (flow.amount ? String(flow.amount) : ''))
  const [invalid, setInvalid] = useState(false)
  const [expiredShown, setExpiredShown] = useState(flow.step === 'idle' && !!flow.expired)
  const inputId = useId()
  const errorId = useId()
  const busy = flow.step === 'creating'
  const amount = Number(value)

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    if (!Number.isInteger(amount) || amount < 1 || amount > MAX_AMOUNT) {
      setInvalid(true)
      inputRef.current?.focus()
      return
    }
    setInvalid(false)
    setExpiredShown(false)
    void createBill(amount)
  }

  const error = invalid ? t('counter.bill.invalid') : flow.step === 'idle' && flow.error === 'create' ? t('counter.bill.createFailed') : null

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {expiredShown && (
        <div className="flex items-start gap-3 rounded-2xl bg-caution-wash px-4 py-3">
          <Clock3 aria-hidden className="mt-0.5 size-5 shrink-0 text-caution-ink" />
          <div>
            <p className="font-semibold text-ink">{t('counter.bill.expired')}</p>
            <p className="text-sm text-slate">{t('counter.bill.expiredBody')}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className="text-sm font-semibold text-ink">
          {t('counter.bill.amountLabel')}
        </label>
        <div
          className={cn(
            'clay-inset flex h-[72px] items-center gap-2 rounded-2xl px-4',
            'focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-navy',
            error && invalid && 'ring-2 ring-danger',
          )}
        >
          <span aria-hidden className="text-3xl font-bold text-slate">
            ₹
          </span>
          <input
            ref={inputRef}
            id={inputId}
            value={value}
            onChange={(e) => {
              setValue(e.target.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 6))
              setInvalid(false)
            }}
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="go"
            placeholder="0"
            readOnly={busy}
            aria-invalid={invalid || undefined}
            aria-describedby={error ? errorId : undefined}
            size={1}
            className="h-full w-full min-w-0 flex-1 bg-transparent text-[34px] font-bold tracking-tight text-ink tabular-nums outline-none placeholder:text-slate-soft/60 focus-visible:outline-none focus-visible:[box-shadow:none]"
          />
        </div>
      </div>

      <div role="group" aria-label={t('counter.bill.quick')} className="flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((quick) => {
          const selected = amount === quick
          return (
            <button
              key={quick}
              type="button"
              disabled={busy}
              aria-pressed={selected}
              aria-label={t('counter.bill.quickAmount', { amount: formatINR(quick) })}
              onClick={() => {
                setValue(String(quick))
                setInvalid(false)
              }}
              className={cn(
                'h-12 min-w-[4.25rem] rounded-full px-4 text-[15px] font-semibold tabular-nums transition-colors disabled:opacity-60',
                selected
                  ? 'bg-accent text-on-accent [box-shadow:var(--clay-shadow-accent)]'
                  : 'bg-surface text-ink [box-shadow:var(--clay-shadow-soft)] hover:bg-accent-wash',
              )}
            >
              {formatINR(quick)}
            </button>
          )
        })}
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-sm font-medium text-danger-ink">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <ClayButton
          type="submit"
          size="lg"
          fullWidth
          aria-disabled={busy || undefined}
          leadingIcon={busy ? <Loader2 className="size-5 animate-spin" /> : <ReceiptIndianRupee className="size-5" />}
        >
          {busy ? (
            t('counter.bill.creating')
          ) : (
            <span className="inline-flex flex-wrap items-center justify-center gap-x-2">
              <span>{t('counter.bill.create')}</span>
              <ArrowRight aria-hidden className="size-[18px]" />
              <span>{t('counter.bill.createFor')}</span>
            </span>
          )}
        </ClayButton>
        {busy && (
          <ClayButton type="button" variant="secondary" size="lg" onClick={cancelBill}>
            {t('counter.bill.cancelCreating')}
          </ClayButton>
        )}
      </div>
    </form>
  )
}

function formatClock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

function Awaiting({
  checkout,
  tapping,
  error,
  cardRef,
}: {
  checkout: Checkout
  tapping: boolean
  error?: 'tap'
  cardRef: RefObject<HTMLDivElement | null>
}) {
  const { t } = useTranslation()
  const tapCard = useCounter((s) => s.tapCard)
  const cancelBill = useCounter((s) => s.cancelBill)
  const { data: merchant } = useMerchant()
  const tapRef = useStepFocus<HTMLButtonElement>(cardRef)
  const now = useNow(250)
  const expiresAt = new Date(checkout.expiresAt).getTime()
  const total = (expiresAt - new Date(checkout.createdAt).getTime()) / 1000
  const left = Math.max(0, Math.ceil((expiresAt - now) / 1000))
  const amount = formatINR(checkout.amount)
  const urgent = left <= 10

  return (
    <div className="flex flex-col gap-4">
      <div className="text-center">
        <p className="text-sm font-medium text-slate">{t('counter.bill.amountToPay')}</p>
        <p className="text-[44px] leading-tight font-extrabold tracking-tight text-ink tabular-nums">{amount}</p>
      </div>

      <figure className="mx-auto flex w-fit flex-col items-center rounded-[22px] border border-line bg-surface p-3 [box-shadow:var(--clay-shadow-soft)]">
        <QrPattern seed={checkout.checkoutId} label={t('counter.bill.qrLabel', { amount, store: merchant?.storeName ?? '' })} className="size-44 sm:size-48" />
      </figure>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center gap-2 rounded-[22px] bg-well px-3 py-4 text-center">
          <span aria-hidden className="inline-flex size-11 items-center justify-center rounded-full bg-surface text-ink [box-shadow:var(--clay-shadow-soft)]">
            <Smartphone className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="block font-bold text-ink">{t('counter.bill.scanQr')}</span>
            <span className="text-sm text-slate">{t('counter.bill.scanQrHint')}</span>
          </span>
        </div>
        <button
          ref={tapRef}
          type="button"
          onClick={() => void tapCard()}
          aria-disabled={tapping || undefined}
          className={cn(
            'relative flex flex-col items-center gap-2 rounded-[22px] bg-accent-wash px-3 py-4 text-center transition-colors',
            '[box-shadow:var(--clay-rim)] hover:bg-[#d3f2fd] aria-disabled:cursor-progress',
          )}
        >
          {/* A soft halo breathing around the tile, so the eye goes to the reader. */}
          {!tapping && (
            <span aria-hidden className="pointer-events-none absolute inset-0 rounded-[22px] ring-2 ring-accent/50 motion-safe:animate-pulse motion-reduce:hidden" />
          )}
          <span aria-hidden className="relative inline-flex size-11 items-center justify-center rounded-full bg-accent text-on-accent [box-shadow:var(--clay-shadow-accent)]">
            {tapping ? <Loader2 className="size-5 animate-spin" /> : <Nfc className="size-6" />}
            {!tapping && <span className="absolute inset-0 animate-ping rounded-full bg-accent/30 [animation-duration:1.6s] motion-reduce:hidden" />}
          </span>
          <span className="leading-tight">
            <span className="block font-bold text-ink">{tapping ? t('counter.bill.reading') : t('counter.bill.tapCard')}</span>
            <span className="text-sm text-slate">{t('counter.bill.tapCardHint')}</span>
          </span>
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <p className={cn('inline-flex items-center justify-center gap-1.5 text-sm font-semibold tabular-nums', urgent ? 'text-caution-ink' : 'text-slate')}>
          <Clock3 aria-hidden className="size-4" />
          {t('counter.bill.expiresIn', { time: formatClock(left) })}
        </p>
        {/* Time left as a bar; screen readers get one warning at 10 seconds instead of a ticking count. */}
        <div aria-hidden className="h-2 overflow-hidden rounded-full bg-well">
          <div
            className={cn('h-full rounded-full transition-[width] duration-300 ease-linear', urgent ? 'bg-caution' : 'bg-accent')}
            style={{ width: `${(left / total) * 100}%` }}
          />
        </div>
        <p aria-live="polite" className="sr-only">
          {urgent && left > 0 ? t('counter.bill.expiresSoon') : ''}
        </p>
      </div>

      {error === 'tap' && (
        <p role="alert" className="text-sm font-medium text-danger-ink">
          {t('counter.bill.tapFailed')}
        </p>
      )}

      <ClayButton variant="secondary" onClick={cancelBill} disabled={tapping} leadingIcon={<X className="size-4" />} className="self-center">
        {t('counter.bill.cancel')}
      </ClayButton>
    </div>
  )
}

function Paid({ payment, cardRef }: { payment: Payment; cardRef: RefObject<HTMLDivElement | null> }) {
  const { t } = useTranslation()
  const nextCustomer = useCounter((s) => s.nextCustomer)
  const nextRef = useStepFocus<HTMLButtonElement>(cardRef)
  const card = payment.method === 'card'
  const MethodIcon = card ? CreditCard : Smartphone

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <SuccessTick />
      <p className="text-[34px] leading-tight font-extrabold tracking-tight text-ink tabular-nums">
        {t('counter.bill.received', { amount: formatINR(payment.amount) })}
      </p>
      <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[15px] text-slate">
        <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
          <MethodIcon aria-hidden className="size-4" />
          {t(card ? 'counter.bill.methodCard' : 'counter.bill.methodUpi')}
        </span>
        <span aria-hidden>·</span>
        <span className="tabular-nums">{payment.payer}</span>
        <span aria-hidden>·</span>
        <span className="text-xs text-slate-soft tabular-nums">
          <span className="sr-only">{t('counter.bill.txnLabel')} </span>
          {payment.txnId}
        </span>
      </p>
      <p
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold',
          payment.tag === 'REGULAR' ? 'bg-coral-wash text-coral-ink' : 'bg-accent-wash text-accent-ink',
        )}
      >
        <span className="sr-only">{t('counter.bill.tagLabel')}: </span>
        <span className="tracking-[0.06em] uppercase">{t(`counter.segment.${payment.tag}`)}</span>
        <span aria-hidden>·</span>
        <span>{t('counter.bill.visitNo', { count: payment.visit })}</span>
      </p>

      {payment.rewardDue && (
        <p className="flex w-full items-center gap-3 rounded-2xl border border-coral/30 bg-coral-wash px-4 py-3 text-left font-semibold text-coral-ink">
          <Gift aria-hidden className="size-5 shrink-0" />
          {t('counter.bill.reward', { count: payment.visit })}
        </p>
      )}

      <ClayButton ref={nextRef} size="lg" fullWidth onClick={nextCustomer} leadingIcon={<ReceiptIndianRupee className="size-5" />}>
        {t('counter.bill.nextCustomer')}
      </ClayButton>
    </div>
  )
}

/** Green tick that pops in, with a small burst of coins (skipped for reduced motion). */
function SuccessTick() {
  const reduce = useReducedMotion()
  const coins = ['#00baf2', '#f23a5c', '#0f9d6b', '#ffc83d', '#00baf2', '#f23a5c', '#ffc83d', '#0f9d6b']
  return (
    <span aria-hidden className="relative inline-flex size-[76px] shrink-0 items-center justify-center">
      {!reduce &&
        coins.map((color, i) => {
          const angle = (i / coins.length) * Math.PI * 2
          return (
            <motion.span
              key={i}
              className="absolute size-2.5 rounded-full"
              style={{ backgroundColor: color }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0.6 }}
              animate={{ x: Math.cos(angle) * 52, y: Math.sin(angle) * 52, opacity: 0, scale: 1 }}
              transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
            />
          )
        })}
      <motion.span
        className="relative inline-flex size-[76px] items-center justify-center rounded-full bg-success text-white [box-shadow:0_10px_24px_rgb(15_157_107/0.3)]"
        initial={reduce ? false : { scale: 0.4 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 12, stiffness: 260 }}
      >
        <Check className="size-10" strokeWidth={3} />
      </motion.span>
    </span>
  )
}
