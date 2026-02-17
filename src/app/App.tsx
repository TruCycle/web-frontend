import { Suspense } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from '@/app/routes/AppRoutes'

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<p className="page-status">Loading page...</p>}>
        <AppRoutes />
      </Suspense>
    </BrowserRouter>
  )
}
