import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  getCurrentUser,
  loginUser,
  refreshAuthTokens,
  registerUser,
  requestPasswordReset as requestPasswordResetApi,
  resetPassword as resetPasswordApi,
} from '@/features/auth/api/authApi'
import type {
  AuthUser,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
} from '@/features/auth/types'
import {
  clearSession,
  getStoredAccessTokenExpiresAt,
  getStoredPersistMode,
  getStoredRefreshToken,
  getStoredRefreshTokenExpiresAt,
  getStoredUser,
  hasStoredSession,
  storeSession,
  storeUser,
} from '@/shared/lib/auth/session'
import { AuthSessionContext } from './useAuthSession'

interface AuthSessionProviderProps {
  readonly children: ReactNode
}

const refreshBeforeExpiryMs = 5 * 60 * 1000

function resolvePersistMode(rememberSession: boolean): 'local' | 'session' {
  return rememberSession ? 'local' : 'session'
}

export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const refreshTimerRef = useRef<number | null>(null)

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current === null) {
      return
    }

    window.clearTimeout(refreshTimerRef.current)
    refreshTimerRef.current = null
  }, [])

  const tryRefreshStoredSession = useCallback(async (): Promise<boolean> => {
    const refreshToken = getStoredRefreshToken()
    const refreshTokenExpiry = getStoredRefreshTokenExpiresAt()
    const persistedUser = getStoredUser()
    const persistMode = getStoredPersistMode() ?? 'session'

    if (!refreshToken || !persistedUser) {
      return false
    }

    if (
      refreshTokenExpiry !== null &&
      Date.now() >= refreshTokenExpiry - refreshBeforeExpiryMs
    ) {
      return false
    }

    try {
      const refreshedSession = await refreshAuthTokens(refreshToken)
      storeSession({
        tokens: refreshedSession.tokens,
        user: refreshedSession.user,
        persistMode,
        keepRefreshToken: true,
      })
      setUser(refreshedSession.user)

      return true
    } catch {
      return false
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function bootstrapSession() {
      if (!hasStoredSession()) {
        clearSession()
        if (isMounted) {
          setUser(null)
          setIsBootstrapping(false)
        }
        return
      }

      try {
        const currentUser = await getCurrentUser()
        if (!isMounted) {
          return
        }

        const persistMode: 'local' | 'session' = window.localStorage.getItem('auth_token')
          ? 'local'
          : 'session'
        storeUser(currentUser, persistMode)
        setUser(currentUser)
      } catch {
        const didRefresh = await tryRefreshStoredSession()
        if (!didRefresh) {
          clearSession()
          if (isMounted) {
            setUser(null)
          }
        }
      } finally {
        if (isMounted) {
          setIsBootstrapping(false)
        }
      }
    }

    bootstrapSession()

    return () => {
      isMounted = false
      clearRefreshTimer()
    }
  }, [clearRefreshTimer, tryRefreshStoredSession])

  useEffect(() => {
    clearRefreshTimer()

    if (!user) {
      return
    }

    const accessTokenExpiry = getStoredAccessTokenExpiresAt()
    if (accessTokenExpiry === null) {
      return
    }

    const hasRefreshToken = Boolean(getStoredRefreshToken())
    const ttlMs = accessTokenExpiry - Date.now()
    const refreshLeadMs = hasRefreshToken
      ? Math.min(refreshBeforeExpiryMs, Math.max(0, ttlMs - 30_000))
      : 0
    const timerDelayMs = ttlMs - refreshLeadMs

    const handleTokenWindow = async () => {
      if (!hasRefreshToken) {
        clearSession()
        setUser(null)
        return
      }

      const didRefresh = await tryRefreshStoredSession()
      if (!didRefresh) {
        clearSession()
        setUser(null)
      }
    }

    if (timerDelayMs <= 0) {
      void handleTokenWindow()
      return
    }

    refreshTimerRef.current = window.setTimeout(() => {
      void handleTokenWindow()
    }, timerDelayMs)

    return () => {
      clearRefreshTimer()
    }
  }, [clearRefreshTimer, tryRefreshStoredSession, user])

  const login = useCallback(
    async (payload: LoginPayload, options: { rememberSession: boolean }) => {
      const { user: nextUser, tokens } = await loginUser(payload)
      storeSession({
        tokens,
        user: nextUser,
        persistMode: resolvePersistMode(options.rememberSession),
        keepRefreshToken: options.rememberSession,
      })
      setUser(nextUser)
    },
    [],
  )

  const register = useCallback(async (payload: RegisterPayload) => {
    await registerUser(payload)
  }, [])

  const requestPasswordReset = useCallback(async (email: string) => {
    await requestPasswordResetApi(email)
  }, [])

  const resetPassword = useCallback(async (payload: ResetPasswordPayload) => {
    await resetPasswordApi(payload)
  }, [])

  const logout = useCallback(async () => {
    clearRefreshTimer()
    clearSession()
    setUser(null)
  }, [clearRefreshTimer])

  const contextValue = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      isBootstrapping,
      login,
      register,
      requestPasswordReset,
      resetPassword,
      logout,
    }),
    [user, isBootstrapping, login, register, requestPasswordReset, resetPassword, logout],
  )

  return (
    <AuthSessionContext.Provider value={contextValue}>
      {children}
    </AuthSessionContext.Provider>
  )
}
