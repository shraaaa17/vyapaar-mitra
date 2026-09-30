import { LogOut } from 'lucide-react'
import { ComingNext } from '../components/layout/ComingNext'
import { PageHeader } from '../components/layout/PageHeader'
import { ClayButton } from '../components/ui'
import { useSession } from '../store/session'

export function Settings() {
  const signOut = useSession((s) => s.signOut)
  return (
    <>
      <PageHeader title="Settings" />
      <ComingNext phase={9} items={['Language', 'Trust settings', 'Notification preferences', 'Profile']}>
        <div>
          <ClayButton variant="secondary" onClick={signOut} leadingIcon={<LogOut className="size-4" />}>
            Sign out
          </ClayButton>
        </div>
      </ComingNext>
    </>
  )
}
