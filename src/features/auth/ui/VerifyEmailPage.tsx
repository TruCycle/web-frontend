import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, CircleAlert } from 'lucide-react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { ApiError } from '@/shared/types/network'
import { classNames } from '@/shared/utils/classNames'
import {
  AuthPageFrame,
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
  const [status, setStatus] = useState<VerificationStatus>('verifying')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!token) {
      return
    }

    let isMounted = true

    async function runVerification() {
      setStatus('verifying')
      setErrorMessage('')

      try {
        await verifyEmail(token)
        if (!isMounted) {
          return
        }
        setStatus('success')
      } catch (caughtError) {
        if (!isMounted) {
          return
        }
        setStatus('error')
        setErrorMessage(
          caughtError instanceof ApiError
            ? caughtError.message
            : 'We could not verify this email link. It may be invalid or expired.',
        )
      }
    }

    void runVerification()

    return () => {
      isMounted = false
    }
  }, [token, verifyEmail])

  if (!token) {
    return <Navigate replace to="/signup" />
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
            ? 'Your account has been verified successfully. You can continue into TruCycle now.'
            : 'This verification link could not be completed. You can request a new verification email from signup.'
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
      <div className="mt-8 grid gap-5">
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
                Verification complete. Your account is active and your session is ready.
              </p>
            ) : (
              <p className="m-0 text-sm leading-7 text-tc-auth-formText">
                {errorMessage || 'We could not verify this email link.'}
              </p>
            )}
          </div>
        </div>

        {status === 'success' ? (
          <Link className={classNames(authPrimaryButtonClassName, 'no-underline')} to="/dashboard">
            Continue to dashboard
          </Link>
        ) : null}

        {status === 'error' ? (
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className={classNames(authPrimaryButtonClassName, 'no-underline sm:flex-1')}
              to="/signup"
            >
              Request a new verification email
            </Link>
            <Link
              className="inline-flex h-[3.05rem] items-center justify-center rounded-[0.55rem] border border-tc-auth-inputBorder bg-white px-4 text-base font-semibold text-tc-auth-formTitle no-underline transition hover:bg-slate-50 sm:flex-1"
              to="/login"
            >
              Go to login
            </Link>
          </div>
        ) : null}
      </div>
    </AuthPageFrame>
  )
}