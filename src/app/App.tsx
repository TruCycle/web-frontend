import { Suspense } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/routes/AppRoutes'
import { AppShell } from '@/app/shell/AppShell'

export function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Suspense fallback={<p className="page-status">Loading page...</p>}>
          <AppRoutes />
        </Suspense>
      </AppShell>
    </BrowserRouter>
  )
}
