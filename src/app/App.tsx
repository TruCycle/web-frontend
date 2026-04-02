import { Suspense, useEffect } from 'react'
import { BrowserRouter, useLocation } from 'react-router-dom'
import { AppRoutes } from '@/app/routes/AppRoutes'
import { trackPageView } from '@/shared/lib/analytics/googleAnalytics'
import { AuthSessionProvider } from '@/shared/context/AuthSessionContext'
import { UserRoleProvider } from '@/shared/context/UserRoleContext'
import { LoadingState } from '@/shared/ui/loading/LoadingState'
import { ToastProvider } from '@/shared/ui/toast/ToastProvider'

function GoogleAnalyticsPageTracker() {
  const location = useLocation()

  useEffect(() => {
    trackPageView(`${location.pathname}${location.search}${location.hash}`)
  }, [location.hash, location.pathname, location.search])

  return null
}

export function App() {
  return (
    <BrowserRouter>
      <GoogleAnalyticsPageTracker />
      <AuthSessionProvider>
        <UserRoleProvider>
          <ToastProvider>
            <Suspense fallback={<LoadingState variant="page" label="Loading page" />}>
              <AppRoutes />
            </Suspense>
          </ToastProvider>
        </UserRoleProvider>
      </AuthSessionProvider>
    </BrowserRouter>
  )
}
