import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/app/shell/AppShell'
import { LoadingState } from '@/shared/ui/loading/LoadingState'

const SignupPage = lazy(() => import('@/features/auth/ui/SignupPage'))
const LoginPage = lazy(() => import('@/features/auth/ui/LoginPage'))
const PasswordResetPage = lazy(
  () => import('@/features/auth/ui/PasswordResetPage'),
)
const NotificationsPage = lazy(
  () => import('@/features/notifications/ui/NotificationsPage'),
)
const MessagingPage = lazy(() => import('@/features/messaging/ui/MessagingPage'))
const Dashboard = lazy(() => import('@/features/home/ui/Dashboard'))
const CollectedItemsPage = lazy(() => import('@/features/collected/ui/CollectedItemsPage'))
const YourListingsPage = lazy(() => import('@/features/listings/ui/YourListingsPage'))
const SettingsPage = lazy(() => import('@/features/settings/ui/SettingsPage'))
const PartnerShopsPage = lazy(() => import('@/features/partner-shops/ui/PartnerShopsPage'))
const SupportFaqPage = lazy(() => import('@/features/support/ui/SupportFaqPage'))

function ShellLayout() {
  return (
    <AppShell>
      <Suspense fallback={<LoadingState label="Loading page" />}>
        <Outlet />
      </Suspense>
    </AppShell>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<PasswordResetPage />} />
      <Route element={<ShellLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/browse" element={<Dashboard />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/messages" element={<MessagingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/collected" element={<CollectedItemsPage />} />
        <Route path="/listings" element={<YourListingsPage />} />
        <Route path="/selected" element={<YourListingsPage />} />
        <Route path="/partner-shops" element={<PartnerShopsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/support" element={<SupportFaqPage />} />
        <Route path="/support/:viewRole" element={<SupportFaqPage />} />
      </Route>
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  )
}
