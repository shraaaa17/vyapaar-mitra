import { ComingNext } from '../components/layout/ComingNext'
import { PageHeader } from '../components/layout/PageHeader'

export function AskMitra() {
  return (
    <>
      <PageHeader title="Ask Mitra" subtitle="Poochiye kuch bhi: sales, customers, cash." />
      <ComingNext phase={8} items={['Chat with suggested Hinglish questions', 'Voice input with the mic button', 'Answers with a small number card or chart']} />
    </>
  )
}
