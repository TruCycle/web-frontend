import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, CircleAlert } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { resendVerificationEmail } from '@/features/auth/api/authApi'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { RequestTimeoutError } from '@/shared/lib/api/client'
import { ApiError } from '@/shared/types/network'
import { classNames } from '@/shared/utils/classNames'
import {
  AuthPageFrame,
  authInputClassName,
  authFooterCopyClassName,
  authFooterLinkClassName,
  authLoadingSpinnerClassName,
  authPrimaryButtonClassName,
} from './components/AuthPageFrame'

type VerificationStatus = 'verifying' | 'success' | 'error'

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams])
  const { verifyEmail } = useAuthSession()
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<{ token: string; attempt: number; status: VerificationStatus; message: string } | null>(null)
  const request = useRef<{ token: string; attempt: number; promise: Promise<void> } | null>(null)
  const [email, setEmail] = useState('')
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'requested' | 'error'>('idle')
  const status = !token ? 'error' : result?.token === token && result.attempt === attempt ? result.status : 'verifying'
  const errorMessage = !token ? 'This link is missing its verification token. Request a new email below.' : result?.token === token && result.attempt === attempt ? result.message : ''

  useEffect(() => {
    if (!token) return
    let current = true
    // StrictMode repeats effects; reuse this verification attempt.
    if (!request.current || request.current.token !== token || request.current.attempt !== attempt) {
      request.current = { token, attempt, promise: verifyEmail(token) }
    }
    void request.current.promise.then(() => {
      if (current) setResult({ token, attempt, status: 'success', message: '' })
    }).catch((caughtError: unknown) => {
      if (!current) return
      const transient = caughtError instanceof RequestTimeoutError || caughtError instanceof TypeError || (caughtError instanceof ApiError && (caughtError.statusCode >= 500 || caughtError.statusCode === 0 || caughtError.statusCode === 429))
      setResult({ token, attempt, status: 'error', message: transient
        ? 'Verification is temporarily unavailable. Try this link again, or request a fresh email below.'
        : 'This link could not be verified. It may be invalid or expired. Request a fresh email below.' })
    })
    return () => { current = false }
  }, [token, attempt, verifyEmail])

  async function resend() {
    if (!email.trim() || resendState === 'sending') return
    setResendState('sending')
    try {
      await resendVerificationEmail(email.trim())
      setResendState('requested')
    } catch { setResendState('error') }
  }

  return (
    <AuthPageFrame
      formTitle={
        status === 'verifying'
          ? 'Verifying your email'
          : status === 'success'
            ? 'Email verified'
            : 'Verification failed'
      }
      formDescription={
        status === 'verifying'
          ? 'We are confirming your email and activating your TruCycle account.'
          : status === 'success'
            ? 'Your email has been verified. Sign in to continue into TruCycle.'
            : 'This verification link could not be completed. Enter your email below to request a fresh verification link.'
      }
      showcase={{
        avatarLabel: 'TC',
        quote:
          status === 'success'
            ? 'Your account is now ready. Welcome to TruCycle.'
            : 'We keep email verification simple so your account stays secure from the start.',
        titlePrefix: 'Secure your',
        titleAccent: 'TruCycle account.',
        benefits: ['Trusted account access', 'Verified email ownership', 'Ready to get started'],
        authorName: 'TruCycle Team',
        authorRole: 'Verification support',
      }}
      footer={
        <p className={authFooterCopyClassName}>
          Need a different step?{' '}
          <Link className={authFooterLinkClassName} to={status === 'error' ? '/signup' : '/login'}>
            {status === 'error' ? 'Back to sign up' : 'Go to login'}
          </Link>
        </p>
      }
    >
      <div className="mt-8 grid gap-5" aria-live="polite">
        <div className="rounded-[0.9rem] border border-tc-auth-inputBorder bg-white p-6 text-center">
          <div className="mx-auto flex max-w-md flex-col items-center gap-4">
            <span
              className={classNames(
                'inline-flex h-14 w-14 items-center justify-center rounded-full',
                status === 'success'
                  ? 'bg-tc-shell-accent/20 text-tc-shell-bg'
                  : status === 'error'
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-slate-100 text-slate-600',
              )}
            >
              {status === 'success' ? (
                <CheckCircle2 size={28} />
              ) : status === 'error' ? (
                <CircleAlert size={28} />
              ) : (
                <span className={authLoadingSpinnerClassName} aria-hidden />
              )}
            </span>

            {status === 'verifying' ? (
              <p className="m-0 text-sm leading-7 text-tc-auth-formText">
                Please wait while we verify your email address.
              </p>
            ) : status === 'success' ? (
              <p className="m-0 text-sm leading-7 text-tc-auth-formText">
                Verification complete. Sign in to start your session.
              </p>
            ) : (
              <p className="m-0 text-sm leading-7 text-tc-auth-formText">
                {errorMessage || 'We could not verify this email link.'}
              </p>
            )}
          </div>
        </div>

        {status === 'success' ? (
          <Link className={classNames(authPrimaryButtonClassName, 'no-underline')} to="/login">
            Sign in to continue
          </Link>
        ) : null}

        {status === 'error' ? (
          <div className="grid gap-4">
            {token ? <button className={authPrimaryButtonClassName} type="button" onClick={() => setAttempt((value) => value + 1)}>Try this link again</button> : null}
            <form className="grid gap-3" onSubmit={(event) => { event.preventDefault(); void resend() }}>
              <label className="grid gap-2 text-sm font-medium">Email address
                <input className={authInputClassName} type="email" autoComplete="email" required disabled={resendState === 'sending'} value={email} onChange={(event) => { setEmail(event.target.value); setResendState('idle') }} />
              </label>
              <button className={authPrimaryButtonClassName} type="submit" disabled={resendState === 'sending'} aria-busy={resendState === 'sending'}>
                {resendState === 'sending' ? 'Requesting…' : 'Request a new verification email'}
              </button>
              {resendState === 'requested' ? <p role="status">If your account needs verification, an email has been requested. Check your inbox and spam folder. A request does not guarantee delivery.</p> : null}
              {resendState === 'error' ? <p role="alert">We could not request verification right now. Please try again in a few minutes.</p> : null}
            </form>
            <Link className={authFooterLinkClassName} to="/login">Go to login</Link>
          </div>
        ) : null}
      </div>
    </AuthPageFrame>
  )
}
