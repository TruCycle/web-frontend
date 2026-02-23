import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/app/shell/AppShell'
import { LoadingState } from '@/shared/ui/loading/LoadingState'

const SignupPage = lazy(() => import('@/features/auth/ui/SignupPage'))
const LoginPage = lazy(() => import('@/features/auth/ui/LoginPage'))
const WelcomePage = lazy(() => import('@/features/auth/ui/WelcomePage'))
const PasswordResetRequestPage = lazy(
  () => import('@/features/auth/ui/PasswordResetRequestPage'),
)
const PasswordResetOtpPage = lazy(
  () => import('@/features/auth/ui/PasswordResetOtpPage'),
)
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
const PlaceholderPage = lazy(() => import('@/shared/ui/placeholder/PlaceholderPage'))
const PartnerShopsPage = lazy(() => import('@/features/partner-shops/ui/PartnerShopsPage'))

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
      <Route path="/welcome" element={<WelcomePage />} />
      <Route path="/reset-password/request" element={<PasswordResetRequestPage />} />
      <Route path="/reset-password/otp" element={<PasswordResetOtpPage />} />
      <Route path="/reset-password" element={<PasswordResetPage />} />
      <Route element={<ShellLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/messages" element={<MessagingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/collected" element={<CollectedItemsPage />} />
        <Route path="/listings" element={<YourListingsPage />} />
        <Route path="/selected" element={<YourListingsPage />} />
        <Route path="/partner-shops" element={<PartnerShopsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/support" element={<PlaceholderPage title="Support & FAQs" />} />
      </Route>
      <Route path="*" element={<Navigate replace to="/dashboard" />} />
    </Routes>
  )
}
