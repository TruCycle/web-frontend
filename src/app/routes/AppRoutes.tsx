import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from '@/app/shell/AppShell'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { LoadingState } from '@/shared/ui/loading/LoadingState'

const SignupPage = lazy(() => import('@/features/auth/ui/SignupPage'))
const VerifyEmailPage = lazy(() => import('@/features/auth/ui/VerifyEmailPage'))
const LoginPage = lazy(() => import('@/features/auth/ui/LoginPage'))
const PasswordResetPage = lazy(
  () => import('@/features/auth/ui/PasswordResetPage'),
)
const HomePage = lazy(() => import('@/features/home/ui/HomePage'))
const CookiesPage = lazy(() => import('@/features/legal/ui/CookiesPage'))
const PrivacyPage = lazy(() => import('@/features/legal/ui/PrivacyPage'))
const TermsPage = lazy(() => import('@/features/legal/ui/TermsPage'))
const NotificationsPage = lazy(
  () => import('@/features/notifications/ui/NotificationsPage'),
)
const MessagingPage = lazy(() => import('@/features/messaging/ui/MessagingPage'))
const Dashboard = lazy(() => import('@/features/home/ui/Dashboard'))
const CollectedItemsPage = lazy(() => import('@/features/collected/ui/CollectedItemsPage'))
const YourListingsPage = lazy(() => import('@/features/listings/ui/YourListingsPage'))
const SettingsPage = lazy(() => import('@/features/settings/ui/SettingsPage'))
const PartnerShopsPage = lazy(() => import('@/features/partner-shops/ui/PartnerShopsPage'))
const PartnerConsolePage = lazy(() => import('@/features/partner/ui/PartnerConsolePage'))
const PartnerItemsPage = lazy(() => import('@/features/partner/ui/PartnerItemsPage'))
const PartnerSettingsPage = lazy(() => import('@/features/partner/ui/PartnerSettingsPage'))
const PartnerOnboardPage = lazy(
  () => import('@/features/partner-onboarding/ui/PartnerOnboardPage'),
)
const SupportFaqPage = lazy(() => import('@/features/support/ui/SupportFaqPage'))
const AchievementsPage = lazy(() => import('@/features/gamification/ui/AchievementsPage'))
const FoundItemsPage = lazy(() => import('@/features/found-items/ui/FoundItemsPage'))
const PostFoundItemPage = lazy(() => import('@/features/found-items/ui/PostFoundItemPage'))
const MyFoundPostsPage = lazy(() => import('@/features/found-items/ui/MyFoundPostsPage'))

function ShellLayout() {
  return (
    <AppShell>
      <Suspense fallback={<LoadingState label="Loading page" />}>
        <Outlet />
      </Suspense>
    </AppShell>
  )
}

function ProtectedShellRoute() {
  const { isAuthenticated, isBootstrapping } = useAuthSession()
  const location = useLocation()

  if (isBootstrapping) {
    return <LoadingState variant="page" label="Checking session" />
  }

  if (!isAuthenticated) {
    return <Navigate replace to="/login" state={{ from: location }} />
  }

  return <Outlet />
}

function hasPartnerRole(roles: readonly string[] | undefined): boolean {
  if (!roles) {
    return false
  }

  return roles.some((role) => role.toLowerCase() === 'partner')
}

function PartnerOnlyRoute() {
  const { user } = useAuthSession()

  if (!hasPartnerRole(user?.roles)) {
    return <Navigate replace to="/partner/onboard" />
  }

  return <Outlet />
}

function PartnerOnboardRoute() {
  const { user } = useAuthSession()

  if (hasPartnerRole(user?.roles)) {
    return <Navigate replace to="/partner" />
  }

  return <Outlet />
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/cookies" element={<CookiesPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/auth/verify-email" element={<VerifyEmailPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<PasswordResetPage />} />
      <Route element={<ProtectedShellRoute />}>
        <Route element={<PartnerOnboardRoute />}>
          <Route
            path="/partner/onboard"
            element={
              <Suspense fallback={<LoadingState label="Loading page" />}>
                <PartnerOnboardPage />
              </Suspense>
            }
          />
        </Route>
        <Route element={<ShellLayout />}>
          <Route path="/browse" element={<Dashboard />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/messages" element={<MessagingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/collected" element={<CollectedItemsPage />} />
          <Route path="/listings" element={<YourListingsPage />} />
          <Route path="/found-items" element={<FoundItemsPage />} />
          <Route path="/found-items/post" element={<PostFoundItemPage />} />
          <Route path="/found-items/my-posts" element={<MyFoundPostsPage />} />
          <Route path="/selected" element={<CollectedItemsPage />} />
          <Route path="/shops" element={<PartnerShopsPage />} />
          <Route path="/partner-shops" element={<Navigate replace to="/shops" />} />
          <Route element={<PartnerOnlyRoute />}>
            <Route path="/partner" element={<PartnerConsolePage />} />
            <Route path="/partner/items" element={<PartnerItemsPage />} />
            <Route path="/partner/settings" element={<PartnerSettingsPage />} />
            <Route path="/partner/notifications" element={<NotificationsPage />} />
            <Route path="/partner/support" element={<SupportFaqPage />} />
          </Route>
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/support" element={<SupportFaqPage />} />
          <Route path="/support/:viewRole" element={<Navigate replace to="/support" />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  )
}
