import { lazy } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/app/shell/AppShell'

const HomePage = lazy(() => import('@/features/home/ui/HomePage'))
const SignupPage = lazy(() => import('@/features/auth/ui/SignupPage'))
const NotificationsPage = lazy(
  () => import('@/features/notifications/ui/NotificationsPage'),
)
const MessagingPage = lazy(() => import('@/features/messaging/ui/MessagingPage'))

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
      </Route>
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  )
}
