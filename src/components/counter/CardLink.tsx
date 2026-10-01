import { CheckCircle2, CreditCard, Link2, Loader2, Nfc, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { maskVpa } from '../../lib/mask'
import { useCounter } from '../../store/counter'
import { ClayButton } from '../ui'

/** Customers the merchant links cards to most often, one tap each. */
const QUICK_LINKS = [
  { vpa: 'sharma.ji@paytm', label: 'counter.card.sharma' },
  { vpa: 'gupta.ji@okaxis', label: 'counter.card.gupta' },
] as const

/**
 * With no bill open, a card on the RFID reader isn't a payment: the merchant
 * can link it to the customer's UPI ID so card and UPI visits build one
 * history. "Link a customer's card" asks the reader for the card.
 */
export function CardLink() {
  const { t } = useTranslation()
  const card = useCounter((s) => s.card)
  const reading = useCounter((s) => s.cardReading)
  const readFailed = useCounter((s) => s.cardReadFailed)
  const readCard = useCounter((s) => s.readCard)

  if (card) return <CardAlert />

  return (
    <div className="flex flex-col gap-2 border-t border-line pt-4">
      <ClayButton
        variant="secondary"
        fullWidth
        onClick={() => void readCard()}
        aria-disabled={reading || undefined}
        aria-describedby="link-card-hint"
        leadingIcon={reading ? <Loader2 className="size-[18px] animate-spin" /> : <Nfc className="size-[18px]" />}
      >
        {reading ? t('counter.bill.readingCard') : t('counter.bill.linkCard')}
      </ClayButton>
      <p id="link-card-hint" className="text-center text-sm text-slate-soft">
        {t('counter.bill.linkCardHint')}
      </p>
      {readFailed && (
        <p role="alert" className="text-sm font-medium text-danger-ink">
          {t('counter.bill.readFailed')}
        </p>
      )}
    </div>
  )
}

function CardAlert() {
  const { t } = useTranslation()
  const card = useCounter((s) => s.card)!
  const linkCard = useCounter((s) => s.linkCard)
  const closeCard = useCounter((s) => s.closeCard)
  const [vpa, setVpa] = useState('')
  const inputId = useId()
  const errorId = useId()
  const headingRef = useRef<HTMLParagraphElement>(null)
  const { scan, status, linked, error } = card
  const busy = status === 'linking'

  // The alert replaces the button that asked for the card, so focus moves to it.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true })
  }, [scan.rfidUid])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!busy && vpa.trim()) void linkCard(vpa.trim())
  }

  return (
    <section aria-labelledby={`${inputId}-title`} className="flex flex-col gap-3 rounded-[22px] border border-accent/40 bg-accent-wash p-4">
      <div className="flex items-start gap-3">
        <span aria-hidden className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-surface text-accent-ink">
          <CreditCard className="size-[18px]" />
        </span>
        <p id={`${inputId}-title`} ref={headingRef} tabIndex={-1} className="min-w-0 flex-1 pt-1 text-ink outline-none">
          <span className="font-bold">{t('counter.card.scanned')}</span>{' '}
          <code className="rounded-md bg-surface px-1.5 py-0.5 font-mono text-[15px] font-semibold">{scan.uidMasked}</code>{' '}
          <span className="text-sm text-slate">
            {scan.known ? t('counter.card.known', { count: scan.visitCount }) : t('counter.card.newCard')}
          </span>
        </p>
        <button
          type="button"
          onClick={closeCard}
          aria-label={t('counter.card.close')}
          className="-mt-1.5 -mr-1.5 inline-flex size-12 shrink-0 items-center justify-center rounded-full text-slate hover:bg-surface hover:text-ink"
        >
          <X aria-hidden className="size-5" />
        </button>
      </div>

      <p className="text-sm text-slate">{t('counter.card.noBill')}</p>

      <div role="group" aria-label={t('counter.card.quickLink')} className="flex flex-wrap gap-2">
        {QUICK_LINKS.map((quick) => (
          <ClayButton
            key={quick.vpa}
            size="sm"
            variant="secondary"
            aria-disabled={busy || undefined}
            onClick={() => !busy && void linkCard(quick.vpa)}
          >
            {t(quick.label)}
          </ClayButton>
        ))}
      </div>

      <form onSubmit={submit} noValidate className="flex flex-wrap gap-2">
        <label htmlFor={inputId} className="sr-only">
          {t('counter.card.vpaLabel')}
        </label>
        <input
          id={inputId}
          value={vpa}
          onChange={(e) => setVpa(e.target.value)}
          placeholder={t('counter.card.vpaPlaceholder')}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          inputMode="email"
          enterKeyHint="done"
          aria-invalid={error === 'invalid' || undefined}
          aria-describedby={error ? errorId : undefined}
          className="clay-inset h-12 min-w-0 flex-1 basis-52 rounded-full px-4 text-[15px] text-ink placeholder:text-slate-soft"
        />
        <ClayButton
          type="submit"
          className="shrink-0 max-[379px]:grow"
          aria-disabled={busy || undefined}
          leadingIcon={busy ? <Loader2 className="size-[18px] animate-spin" /> : <Link2 className="size-[18px]" />}
        >
          {busy ? t('counter.card.linking') : t('counter.card.link')}
        </ClayButton>
      </form>

      <div aria-live="polite">
        {error ? (
          <p id={errorId} className="text-sm font-medium text-danger-ink">
            {t(error === 'invalid' ? 'counter.card.invalid' : 'counter.card.failed')}
          </p>
        ) : (
          linked && (
            <p className="flex items-start gap-2 text-[15px] font-semibold text-success-ink">
              <CheckCircle2 aria-hidden className="mt-0.5 size-[18px] shrink-0" />
              {t('counter.card.linked', {
                vpa: maskVpa(linked.payerVpa),
                segment: t(`counter.segment.${linked.segment}`),
                count: linked.visitCount,
              })}
            </p>
          )
        )}
      </div>
    </section>
  )
}
