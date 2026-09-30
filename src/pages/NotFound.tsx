import { ClayButton, ClayCard } from '../components/ui'

export function NotFound() {
  return (
    <ClayCard padding="lg" className="mx-auto mt-10 flex max-w-md flex-col items-center gap-4 text-center">
      <p className="text-card">This page doesn’t exist</p>
      <ClayButton href="/">Go to Home</ClayButton>
    </ClayCard>
  )
}
