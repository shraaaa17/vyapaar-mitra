import { Navbar } from './components/Navbar'
import { DesignSystem } from './pages/DesignSystem'

export default function App() {
  return (
    <>
      <a
        href="#top"
        className="sr-only z-[60] rounded-full bg-paytm-blue px-5 py-3 font-semibold text-white focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
      >
        Skip to content
      </a>
      <Navbar />
      <DesignSystem />
    </>
  )
}
