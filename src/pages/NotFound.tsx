import { useNavigate } from 'react-router-dom'
import { ClayButton, ClayCard } from '../components/ui'

export function NotFound() {
  const navigate = useNavigate()
  return (
    <ClayCard padding="lg" className="mx-auto mt-10 flex max-w-md flex-col items-center gap-4 text-center">
      <p className="text-card">This page doesn’t exist</p>
      <ClayButton onClick={() => navigate('/')}>Go to Home</ClayButton>
    </ClayCard>
  )
}
