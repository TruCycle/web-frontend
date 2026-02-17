import { lazy } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/app/shell/AppShell'

const HomePage = lazy(() => import('@/features/home/ui/HomePage'))
const SignupPage = lazy(() => import('@/features/auth/ui/SignupPage'))
const NotificationsPage = lazy(
  () => import('@/features/notifications/ui/NotificationsPage'),
)
const MessagingPage = lazy(() => import('@/features/messaging/ui/MessagingPage'))
const Dashboard = lazy(() => import('@/features/home/ui/Dashboard'))
const PlaceholderPage = lazy(() => import('@/shared/ui/placeholder/PlaceholderPage'))

function ShellLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<ShellLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/messages" element={<MessagingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/collected" element={<PlaceholderPage title="My Collected Items" />} />
        <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
        <Route path="/support" element={<PlaceholderPage title="Support & FAQs" />} />
      </Route>
      <Route path="*" element={<Navigate replace to="/dashboard" />} />
    </Routes>
  )
}
