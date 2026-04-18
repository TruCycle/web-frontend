import { Suspense, useEffect } from 'react'
import { BrowserRouter, useLocation } from 'react-router-dom'
import { AppRoutes } from '@/app/routes/AppRoutes'
import { initGoogleAnalytics, trackPageView } from '@/shared/lib/analytics/googleAnalytics'
import { initMetaPixel, trackMetaPageView } from '@/shared/lib/analytics/metaPixel'
import { AuthSessionProvider } from '@/shared/context/AuthSessionContext'
import { useTrackingConsent } from '@/shared/hooks/useTrackingConsent'
import { UserRoleProvider } from '@/shared/context/UserRoleContext'
import { LoadingState } from '@/shared/ui/loading/LoadingState'
import { TrackingConsentBanner } from '@/shared/ui/site/TrackingConsentBanner'
import { ToastProvider } from '@/shared/ui/toast/ToastProvider'

type AnalyticsTrackerProps = {
  readonly trackingConsentStatus: 'accepted' | 'rejected' | 'unknown'
}

function AnalyticsTracker({ trackingConsentStatus }: AnalyticsTrackerProps) {
  const location = useLocation()

  useEffect(() => {
    if (trackingConsentStatus !== 'accepted') {
      return
    }

    initGoogleAnalytics()
    initMetaPixel()
    trackPageView(`${location.pathname}${location.search}${location.hash}`)
    trackMetaPageView()
  }, [location.hash, location.pathname, location.search, trackingConsentStatus])

  return null
}

export function App() {
  const { accept, reject, status } = useTrackingConsent()

  return (
    <BrowserRouter>
      <AnalyticsTracker trackingConsentStatus={status} />
      <AuthSessionProvider>
        <UserRoleProvider>
          <ToastProvider>
            <Suspense fallback={<LoadingState variant="page" label="Loading page" />}>
              <AppRoutes />
            </Suspense>
            {status === 'unknown' ? (
              <TrackingConsentBanner onAccept={accept} onReject={reject} />
            ) : null}
          </ToastProvider>
        </UserRoleProvider>
      </AuthSessionProvider>
    </BrowserRouter>
  )
}
