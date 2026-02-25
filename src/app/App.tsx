import { Suspense } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/routes/AppRoutes'
import { UserRoleProvider } from '@/shared/context/UserRoleContext'
import { LoadingState } from '@/shared/ui/loading/LoadingState'

export function App() {
  return (
    <BrowserRouter>
      <UserRoleProvider>
        <Suspense fallback={<LoadingState variant="page" label="Loading page" />}>
          <AppRoutes />
        </Suspense>
      </UserRoleProvider>
    </BrowserRouter>
  )
}
