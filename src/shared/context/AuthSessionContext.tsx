import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { getCurrentUser, loginUser, loginWithGoogle as loginWithGoogleApi, refreshAuthTokens, registerUser,
  requestPasswordReset as requestPasswordResetApi, resetPassword as resetPasswordApi,
  upgradeToPartner as upgradeToPartnerApi, verifyEmailToken, revokeSession, type SignOutCredential } from '@/features/auth/api/authApi'
import type { AuthTokens, AuthUser, LoginPayload, RegisterPayload, ResetPasswordPayload, UpgradeToPartnerPayload } from '@/features/auth/types'
import { ApiError } from '@/shared/types/network'
import { registerSessionRecovery } from '@/shared/lib/api/client'
import { createSessionRecovery, withSessionRetry, type RecoveryResult } from '@/shared/lib/auth/recovery'
import { sessionRefreshAt, sessionWakeDelay } from '@/shared/lib/auth/schedule'
import { captureStoredSession, clearSession, getSessionGeneration, getStoredAccessTokenExpiresAt,
  getStoredSession, invalidateSessionOperations, isCurrentSession, isSameSessionIdentity, isSessionStorageKey,
  SessionChangedError, storeSession, storeUser, type PersistMode, type SessionCapture } from '@/shared/lib/auth/session'
import { AuthSessionContext } from './useAuthSession'

type Status = 'checking' | 'authenticated' | 'anonymous' | 'unavailable'
interface State { user: AuthUser | null; status: Status }
type AuthResponse = { user: AuthUser; tokens: AuthTokens }

export function AuthSessionProvider({ children }: { readonly children: ReactNode }) {
  const [state, setState] = useState<State>({ user: null, status: 'checking' })
  const mounted = useRef(false)
  const validation = useRef<AbortController | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const retryLogout = useRef(false)
  const [signOutNotice, setSignOutNotice] = useState<string | null>(null)
  const [canRetryServerSignOut, setCanRetryServerSignOut] = useState(false)
  const pendingSignOut = useRef<{ credential: SignOutCredential; promise?: Promise<void>; done: boolean } | null>(null)
  const recovery = useMemo(() => createSessionRecovery(refreshAuthTokens), [])
  const clearTimer = useCallback(() => { if (timer.current !== null) clearTimeout(timer.current); timer.current = null }, [])
  const retire = useCallback(() => {
    invalidateSessionOperations()
    validation.current?.abort()
    recovery.cancel()
    clearTimer()
    return getSessionGeneration()
  }, [clearTimer, recovery])

  const recover = useCallback(async (): Promise<RecoveryResult> => {
    const result = await recovery.recover()
    if (!mounted.current || result.kind === 'superseded') return result
    const resultGeneration = result.kind === 'refreshed' ? result.capture.generation : result.generation
    if (resultGeneration !== getSessionGeneration()) return result
    try {
      if (result.kind === 'refreshed' && isCurrentSession(result.capture)) {
        setState({ user: result.capture.session.user, status: 'authenticated' })
      } else if (result.kind === 'terminal' && result.generation === getSessionGeneration()) {
        setState({ user: null, status: 'anonymous' })
      } else if (result.kind === 'unavailable' && (!result.capture || isCurrentSession(result.capture))) {
        if (result.needsSignOut) retryLogout.current = true
        setState((current) => ({ ...current, status: 'unavailable' }))
      }
    } catch { setState((current) => ({ ...current, status: 'unavailable' })) }
    return result
  }, [recovery])

  const validate = useCallback(async () => {
    validation.current?.abort()
    const controller = new AbortController()
    validation.current = controller
    const owns = () => mounted.current && validation.current === controller && !controller.signal.aborted
    let capture: SessionCapture | null = null
    if (owns()) setState((current) => ({ ...current, status: 'checking' }))
    try {
      capture = captureStoredSession()
      if (!capture) { if (owns()) setState({ user: null, status: 'anonymous' }); return }
      const currentUser = await withSessionRetry(() => getCurrentUser(controller.signal), controller.signal)
      if (!owns() || !isCurrentSession(capture)) return
      if (currentUser.id !== capture.session.user.id) throw new Error('Invalid session response')
      storeUser(currentUser, capture.session.persistMode)
      setState({ user: currentUser, status: 'authenticated' })
    } catch (error) {
      if (!owns()) return
      try {
        if (capture && !isCurrentSession(capture)) return
        if (capture && error instanceof ApiError && error.statusCode === 401) { await recover(); return }
      } catch { /* Inaccessible storage is unavailable, not a server logout. */ }
      if (owns()) setState((current) => ({ ...current, status: 'unavailable' }))
    }
  }, [recover])

  useEffect(() => {
    mounted.current = true
    const unregister = registerSessionRecovery(recover)
    const onStorage = (event: StorageEvent) => {
      if (!isSessionStorageKey(event.key)) return
      retire()
      if (retryLogout.current) { setState({ user: null, status: 'unavailable' }); return }
      void validate()
    }
    window.addEventListener('storage', onStorage)
    void validate()
    return () => {
      mounted.current = false
      validation.current?.abort()
      recovery.cancel()
      clearTimer()
      unregister()
      window.removeEventListener('storage', onStorage)
    }
  }, [clearTimer, recover, recovery, retire, validate])

  useEffect(() => {
    clearTimer()
    if (state.status !== 'authenticated') return
    // Defer storage access so failures transition through the recovery state.
    let current = true
    void Promise.resolve().then(() => {
      if (!current) return
      try {
        const expiry = getStoredAccessTokenExpiresAt()
        if (expiry === null) return
        const hasRefresh = Boolean(getStoredSession()?.tokens.refreshToken)
        const at = sessionRefreshAt(expiry, Date.now(), hasRefresh)
        const wake = () => {
          if (!current) return
          if (Date.now() < at) timer.current = setTimeout(wake, sessionWakeDelay(at, Date.now()))
          else void recover()
        }
        timer.current = setTimeout(wake, sessionWakeDelay(at, Date.now()))
      } catch { if (current) setState((value) => ({ ...value, status: 'unavailable' })) }
    })
    return () => { current = false; clearTimer() }
  }, [clearTimer, recover, state])

  const commitSignIn = useCallback(async (operation: () => Promise<AuthResponse>, persistMode: PersistMode) => {
    const generation = retire()
    retryLogout.current = false
    pendingSignOut.current = null
    setSignOutNotice(null)
    setCanRetryServerSignOut(false)
    setState((current) => ({ ...current, status: 'checking' }))
    try {
      const next = await operation()
      if (!mounted.current || generation !== getSessionGeneration()) throw new SessionChangedError()
      storeSession({ ...next, persistMode, keepRefreshToken: Boolean(next.tokens.refreshToken) })
      setState({ user: next.user, status: 'authenticated' })
    } catch (error) {
      if (mounted.current && generation === getSessionGeneration()) {
        try { setState((current) => ({ ...current, status: getStoredSession() ? 'unavailable' : 'anonymous' })) }
        catch { setState({ user: null, status: 'unavailable' }) }
      }
      throw error
    }
  }, [retire])
  const login = useCallback((payload: LoginPayload, options: { rememberSession: boolean }) =>
    commitSignIn(() => loginUser(payload), options.rememberSession ? 'local' : 'session'), [commitSignIn])
  const loginWithGoogle = useCallback((token: string) => commitSignIn(() => loginWithGoogleApi(token), 'local'), [commitSignIn])
  const verifyEmail = useCallback(verifyEmailToken, [])
  const register = useCallback((payload: RegisterPayload) => registerUser(payload), [])
  const requestPasswordReset = useCallback(requestPasswordResetApi, [])
  const resetPassword = useCallback((payload: ResetPasswordPayload) => resetPasswordApi(payload), [])
  const upgradeToPartner = useCallback(async (payload: UpgradeToPartnerPayload) => {
    const capture = captureStoredSession()
    if (!capture) throw new SessionChangedError()
    const next = await upgradeToPartnerApi(payload)
    if (!mounted.current || !isSameSessionIdentity(capture) || next.user.id !== capture.session.user.id) throw new SessionChangedError()
    const current = getStoredSession()
    if (!current) throw new SessionChangedError()
    if (next.tokens) storeSession({ user: next.user, tokens: next.tokens, persistMode: current.persistMode, keepRefreshToken: Boolean(next.tokens.refreshToken) })
    else storeUser(next.user, current.persistMode)
    setState({ user: next.user, status: 'authenticated' })
  }, [])
  const retryServerSignOut = useCallback(async () => {
    const pending = pendingSignOut.current
    if (!pending || pending.done) return
    if (mounted.current) setCanRetryServerSignOut(false)
    if (!pending.promise) pending.promise = revokeSession(pending.credential)
    try {
      await pending.promise
      pending.done = true
      if (mounted.current && pendingSignOut.current === pending) {
        setSignOutNotice('Server sign-out confirmed.')
        setCanRetryServerSignOut(false)
        if (!retryLogout.current) pendingSignOut.current = null
      }
    } catch {
      if (mounted.current && pendingSignOut.current === pending) {
        setSignOutNotice('Signed out of this browser. Server sign-out could not be confirmed. You can retry below.')
        setCanRetryServerSignOut(true)
      }
    } finally { pending.promise = undefined }
  }, [])
  const logout = useCallback(async () => {
    let credential: SignOutCredential | null = null
    let credentialReadFailed = false
    try {
      const session = getStoredSession()
      if (session) credential = session.tokens.refreshToken ? { refreshToken: session.tokens.refreshToken } : { accessToken: session.tokens.accessToken }
    } catch { credentialReadFailed = true }
    if (credential) pendingSignOut.current = { credential, done: false }
    retire()
    retryLogout.current = true
    try {
      clearSession()
      retryLogout.current = false
      setState({ user: null, status: 'anonymous' })
    } catch { setState({ user: null, status: 'unavailable' }) }
    if (credentialReadFailed && !pendingSignOut.current) {
      setSignOutNotice('Signed out of this browser. Server sign-out could not be confirmed because browser storage could not be read.')
      setCanRetryServerSignOut(false)
    }
    if (pendingSignOut.current && !pendingSignOut.current.done) {
      setCanRetryServerSignOut(false)
      setSignOutNotice('Signed out of this browser. Confirming server sign-out…')
      await retryServerSignOut()
    }
    if (pendingSignOut.current?.done && !retryLogout.current) pendingSignOut.current = null
  }, [retire, retryServerSignOut])
  const retrySession = useCallback(async () => {
    if (retryLogout.current) await logout()
    else await validate()
  }, [logout, validate])
  const contextValue = useMemo(() => ({
    user: state.status === 'authenticated' ? state.user : null, isAuthenticated: state.status === 'authenticated',
    isBootstrapping: state.status === 'checking', isSessionUnavailable: state.status === 'unavailable', retrySession,
    login, loginWithGoogle, register, verifyEmail, upgradeToPartner, requestPasswordReset, resetPassword, logout, signOutNotice, retryServerSignOut, canRetryServerSignOut,
  }), [state, retrySession, login, loginWithGoogle, register, verifyEmail, upgradeToPartner, requestPasswordReset, resetPassword, logout, signOutNotice, retryServerSignOut, canRetryServerSignOut])
  return <AuthSessionContext.Provider value={contextValue}>{children}</AuthSessionContext.Provider>
}
