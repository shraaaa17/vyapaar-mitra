import { createBrowserRouter } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { AppShell } from './components/layout/AppShell'
import { LoginRoute, OnboardingRoute, RequireMerchant } from './components/layout/RouteGuards'
import { Actions } from './pages/Actions'
import { AskMitra } from './pages/AskMitra'
import { Campaigns } from './pages/Campaigns'
import { Credit } from './pages/Credit'
import { DesignSystem } from './pages/DesignSystem'
import { Home } from './pages/Home'
import { Impact } from './pages/Impact'
import { NotFound } from './pages/NotFound'
import { Regulars } from './pages/Regulars'
import { Settings } from './pages/Settings'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginRoute /> },
  { path: '/onboarding', element: <OnboardingRoute /> },
  {
    // Internal reference page for the clay design system.
    path: '/design-system',
    element: (
      <>
        <Navbar />
        <DesignSystem />
      </>
    ),
  },
  {
    element: <RequireMerchant />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Home /> },
          { path: 'actions', element: <Actions /> },
          { path: 'campaigns', element: <Campaigns /> },
          { path: 'credit', element: <Credit /> },
          { path: 'ask', element: <AskMitra /> },
          { path: 'regulars', element: <Regulars /> },
          { path: 'impact', element: <Impact /> },
          { path: 'settings', element: <Settings /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
  },
])
