import { ArrowRight, Smartphone } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ClayButton, ClayCard, FloatingOrb } from '../components/ui'
import { useSession } from '../store/session'

/** Minimal mocked sign-in. The full phone + OTP flow and language picker land in build phase 2. */
export function Login() {
  const signIn = useSession((s) => s.signIn)
  const [phone, setPhone] = useState('')
  const valid = /^\d{10}$/.test(phone)

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (valid) signIn(phone)
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <ClayCard padding="lg" className="flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <FloatingOrb size="lg" float />
          <div>
            <h1 className="text-[28px] font-bold tracking-[-0.02em]">Vyapaar Mitra</h1>
            <p className="text-slate">Aapka AI business saathi</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label htmlFor="phone" className="text-sm font-semibold text-paytm-blue">
            Paytm registered mobile number
          </label>
          <div className="clay-inset flex h-14 items-center gap-3 rounded-2xl px-4 focus-within:ring-3 focus-within:ring-paytm-cyan">
            <Smartphone aria-hidden className="size-5 text-slate-soft" />
            <span className="font-semibold text-paytm-blue">+91</span>
            <input
              id="phone"
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="98765 43210"
              className="h-full min-w-0 flex-1 bg-transparent text-lg font-medium text-paytm-blue outline-none placeholder:text-slate-soft/60"
            />
          </div>
          <ClayButton type="submit" size="lg" fullWidth disabled={!valid} trailingIcon={<ArrowRight className="size-5" />}>
            Continue
          </ClayButton>
        </form>
        <p className="text-center text-xs text-slate-soft">Hackathon prototype · sign-in is simulated</p>
      </ClayCard>
    </main>
  )
}
