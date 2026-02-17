import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/app/shell/AppShell'

const SignupPage = lazy(() => import('@/features/auth/ui/SignupPage'))
const NotificationsPage = lazy(
  () => import('@/features/notifications/ui/NotificationsPage'),
)
const MessagingPage = lazy(() => import('@/features/messaging/ui/MessagingPage'))
const Dashboard = lazy(() => import('@/features/home/ui/Dashboard'))
const CollectedItemsPage = lazy(() => import('@/features/collected/ui/CollectedItemsPage'))
const YourListingsPage = lazy(() => import('@/features/listings/ui/YourListingsPage'))
const PlaceholderPage = lazy(() => import('@/shared/ui/placeholder/PlaceholderPage'))

function ShellLayout() {
  return (
    <AppShell>
      <Suspense fallback={<p>Loading...</p>}>
        <Outlet />
      </Suspense>
    </AppShell>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<ShellLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/messages" element={<MessagingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/collected" element={<CollectedItemsPage />} />
        <Route path="/listings" element={<YourListingsPage />} />
        <Route path="/selected" element={<YourListingsPage />} />
        <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
        <Route path="/support" element={<PlaceholderPage title="Support & FAQs" />} />
      </Route>
      <Route path="*" element={<Navigate replace to="/dashboard" />} />
    </Routes>
  )
}
