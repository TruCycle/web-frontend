import { createContext, useContext } from 'react'
import type {
  AuthUser,
  LoginPayload,
  RegisterPayload,
  RegistrationResult,
  ResetPasswordPayload,
  UpgradeToPartnerPayload,
} from '@/features/auth/types'

interface LoginOptions {
  readonly rememberSession: boolean
}

interface AuthSessionContextValue {
  readonly user: AuthUser | null
  readonly isAuthenticated: boolean
  readonly isBootstrapping: boolean
  readonly isSessionUnavailable: boolean
  retrySession: () => Promise<void>
  login: (payload: LoginPayload, options: LoginOptions) => Promise<void>
  loginWithGoogle: (idToken: string) => Promise<void>
  register: (payload: RegisterPayload) => Promise<RegistrationResult>
  verifyEmail: (token: string) => Promise<void>
  upgradeToPartner: (payload: UpgradeToPartnerPayload) => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  resetPassword: (payload: ResetPasswordPayload) => Promise<void>
  logout: () => Promise<void>
  readonly signOutNotice?: string | null
  readonly canRetryServerSignOut?: boolean
  retryServerSignOut?: () => Promise<void>
}

export const AuthSessionContext = createContext<AuthSessionContextValue | undefined>(
  undefined,
)

export function useAuthSession() {
  const context = useContext(AuthSessionContext)
  if (context === undefined) {
    throw new Error('useAuthSession must be used within an AuthSessionProvider')
  }

  return context
}
