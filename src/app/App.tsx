import { Suspense } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/routes/AppRoutes'
import { AuthSessionProvider } from '@/shared/context/AuthSessionContext'
import { UserRoleProvider } from '@/shared/context/UserRoleContext'
import { LoadingState } from '@/shared/ui/loading/LoadingState'
import { ToastProvider } from '@/shared/ui/toast/ToastProvider'

export function App() {
  return (
    <BrowserRouter>
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
