import { Suspense } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/routes/AppRoutes'
import { UserRoleProvider } from '@/shared/context/UserRoleContext'

export function App() {
  return (
    <BrowserRouter>
      <UserRoleProvider>
        <Suspense fallback={<p className="page-status">Loading page...</p>}>
          <AppRoutes />
        </Suspense>
      </UserRoleProvider>
    </BrowserRouter>
  )
}
