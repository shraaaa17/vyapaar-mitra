import { ArrowRight, ShieldCheck } from 'lucide-react'
import { ClayButton, ClayCard, IconBubble } from '../components/ui'
import { useSession } from '../store/session'

/** Placeholder onboarding. Language picker and Trust Settings land in build phase 2. */
export function Onboarding() {
  const completeOnboarding = useSession((s) => s.completeOnboarding)
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <ClayCard padding="lg" className="flex w-full max-w-md flex-col items-center gap-6 text-center">
        <IconBubble size="lg">
          <ShieldCheck />
        </IconBubble>
        <div>
          <h1 className="text-[26px] font-bold tracking-[-0.02em]">You stay in control</h1>
          <p className="mt-2 text-slate">
            Mitra can send small marketing offers on its own. Loans and big decisions always wait for you.
          </p>
        </div>
        <ClayButton size="lg" fullWidth onClick={completeOnboarding} trailingIcon={<ArrowRight className="size-5" />}>
          Start using Vyapaar Mitra
        </ClayButton>
      </ClayCard>
    </main>
  )
}
