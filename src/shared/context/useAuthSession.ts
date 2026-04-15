import { createContext, useContext } from 'react'
import type {
  AuthUser,
  LoginPayload,
  RegisterPayload,
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
  login: (payload: LoginPayload, options: LoginOptions) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  verifyEmail: (token: string) => Promise<void>
  upgradeToPartner: (payload: UpgradeToPartnerPayload) => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  resetPassword: (payload: ResetPasswordPayload) => Promise<void>
  logout: () => Promise<void>
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
