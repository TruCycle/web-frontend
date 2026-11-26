import { lazy, Suspense } from 'react'
import { Route } from 'react-router-dom'
import { LoadingState } from '@/shared/ui/loading/LoadingState'

function createInternalVisionRoute() {
  const InternalVisionPage = lazy(() => import('@/features/internal/ui/InternalVisionPage'))

  return (
    <Route
      path="/internal/vision"
      element={
        <Suspense fallback={<LoadingState variant="page" label="" />}>
          <InternalVisionPage />
        </Suspense>
      }
    />
  )
}

// The staging route inventory scans AppRoutes.tsx. Keep this registration
// separate and omit its lazy import from the staging browser bundle.
export const internalVisionRoute = import.meta.env.MODE === 'staging' ? null : createInternalVisionRoute()
