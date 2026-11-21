import { type ChangeEvent, type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, RefreshCw } from 'lucide-react'
import type { VerificationDeliveryStatus } from '@/features/auth/types'
import { resendVerificationEmail } from '@/features/auth/api/authApi'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { useGoogleOneTap } from '@/shared/hooks/useGoogleOneTap'
import { ApiError } from '@/shared/types/network'
import { useToast } from '@/shared/ui/toast/useToast'
import { classNames } from '@/shared/utils/classNames'
import { GoogleSignInButton } from './components/GoogleSignInButton'
import { PasswordVisibilityIcon } from './components/PasswordVisibilityIcon'
import {
  AuthPageFrame,
  authFieldClassName,
  authFooterCopyClassName,
  authFooterLinkClassName,
  authInputClassName,
  authLabelClassName,
  authLoadingSpinnerClassName,
  authPasswordToggleClassName,
  authPrimaryButtonClassName,
} from './components/AuthPageFrame'

interface SignupFormValues {
  readonly fullName: string
  readonly email: string
  readonly password: string
  readonly referralCode: string
}

const initialFormValues: SignupFormValues = {
  fullName: '',
  email: '',
  password: '',
  referralCode: '',
}

interface SignupPageProps {
  readonly className?: string
  readonly onSubmitSuccess?: () => void
}

function verificationDeliveryMessage(status: VerificationDeliveryStatus): string {
  if (status === 'queued') return 'Your verification email is queued. Check your inbox and spam folder in a few minutes.'
  if (status === 'accepted') return 'The email provider accepted your verification request. Check your inbox and spam folder.'
  return 'Your account was created, but email delivery could not be confirmed. Request another email below in a few minutes.'
}

export default function SignupPage({
  className,
  onSubmitSuccess,
}: SignupPageProps) {
  useGoogleOneTap({ redirectTo: '/dashboard', context: 'signup' })
  const [formValues, setFormValues] = useState(initialFormValues)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isResendingVerification, setIsResendingVerification] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null)
  const [deliveryStatus, setDeliveryStatus] = useState<VerificationDeliveryStatus>('unknown')
  const { register } = useAuthSession()
  const { success, error } = useToast()

  function onInputChange(
    key: keyof SignupFormValues,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const nextValue = event.currentTarget.value
    setFormValues((currentValues) => ({
      ...currentValues,
      [key]: nextValue,
    }))
  }

  function splitFullName(fullName: string): { firstName: string; lastName: string } | null {
    const trimmedName = fullName.trim()
    const parts = trimmedName.split(/\s+/).filter(Boolean)

    if (parts.length < 2) {
      return null
    }

    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' '),
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isRegistering) {
      return
    }

    const splitName = splitFullName(formValues.fullName)
    if (!splitName) {
      error('Invalid full name', 'Enter first and last name to continue.')
      return
    }

    setIsRegistering(true)
    try {
      const registration = await register({
        firstName: splitName.firstName,
        lastName: splitName.lastName,
        email: formValues.email.trim(),
        password: formValues.password,
      })
      setDeliveryStatus(registration.verificationDelivery.status)
      onSubmitSuccess?.()
      setVerificationEmail(formValues.email.trim())
      success('Account created', verificationDeliveryMessage(registration.verificationDelivery.status))
    } catch (caughtError) {
      const message =
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Unable to create account right now. Please try again.'
      error('Sign up failed', message)
    } finally {
      setIsRegistering(false)
    }
  }

  async function handleResendVerification() {
    if (!verificationEmail || isResendingVerification) {
      return
    }

    setIsResendingVerification(true)
    try {
      await resendVerificationEmail(verificationEmail)
      success('Verification requested', 'If your account needs verification, an email has been requested. Check your inbox and spam folder; delivery can take a few minutes.')
    } catch (caughtError) {
      const message =
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Unable to resend the verification email right now. Please try again.'
      error('Resend failed', message)
    } finally {
      setIsResendingVerification(false)
    }
  }

  return (
    <AuthPageFrame
      className={className}
      formTitle="Welcome to TruCycle"
      formDescription="Create your free account to start making an impact"
      showcase={{
        avatarSrc: '/profile-picture.jpg',
        quote:
          'TruCycle makes donating my unused items easy, secure, and straightforward.',
      }}
      footer={
        <p className={authFooterCopyClassName}>
          Already have an account?{' '}
          <Link className={authFooterLinkClassName} to="/login">
            Log in
          </Link>
        </p>
      }
    >
      {verificationEmail ? (
        <div className="mt-6 grid gap-4">
          <div className="rounded-tc-md border border-tc-brand-mintLine bg-tc-brand-mintSoft p-4">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-tc-brand-deep">
                <Mail size={20} />
              </span>
              <div>
                <p className="m-0 text-[13px] font-medium leading-5 text-tc-brand-body">Verification requested for</p>
                <p className="mt-0.5 break-all text-base font-semibold leading-6 text-tc-brand-ink">{verificationEmail}</p>
              </div>
            </div>
          </div>

          <p role="status" className="m-0 text-sm leading-5 text-tc-brand-body">{verificationDeliveryMessage(deliveryStatus)}</p>
          <div className="grid gap-2 rounded-tc-lg border border-tc-brand-line bg-white p-5 text-sm leading-6 text-tc-brand-body">
            <p className="m-0">1. Open your inbox and look for the TruCycle verification email.</p>
            <p className="m-0">2. Click the verification link in that email.</p>
            <p className="m-0">3. Once verified, return here and log in to continue.</p>
            <p className="m-0">If you don’t see it, check your spam or promotions folder.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              className={classNames(
                authPrimaryButtonClassName,
                'no-underline sm:flex-1',
              )}
              href={`mailto:${verificationEmail}`}
            >
              Open email app
            </a>
            <button
              className={classNames(
                'inline-flex h-12 items-center justify-center gap-2 rounded-full border border-tc-brand-control bg-white px-5 text-sm font-semibold text-tc-brand-ink transition hover:bg-tc-brand-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tc-brand-deep disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1',
                isResendingVerification && 'opacity-80',
              )}
              type="button"
              onClick={handleResendVerification}
              disabled={isResendingVerification}
              aria-busy={isResendingVerification}
            >
              {isResendingVerification ? (
                <>
                  <span className={authLoadingSpinnerClassName} aria-hidden />
                  Resending...
                </>
              ) : (
                <>
                  <RefreshCw size={18} />
                  Resend verification email
                </>
              )}
            </button>
          </div>

          <Link className="text-center text-sm font-semibold text-tc-brand-deep underline underline-offset-4 hover:text-black" to="/login">
            I&apos;ve verified my email, continue to login
          </Link>
        </div>
      ) : (
        <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
          <label className={authFieldClassName}>
            <span className={authLabelClassName}>Full Name</span>
            <input
              autoComplete="name"
              className={authInputClassName}
              name="fullName"
              onChange={(event) => onInputChange('fullName', event)}
              placeholder="Enter your full name"
              required
              type="text"
              value={formValues.fullName}
            />
          </label>

          <label className={authFieldClassName}>
            <span className={authLabelClassName}>Email Address</span>
            <input
              autoComplete="email"
              className={authInputClassName}
              name="email"
              onChange={(event) => onInputChange('email', event)}
              placeholder="Enter your email address"
              required
              type="email"
              value={formValues.email}
            />
          </label>

          <label className={authFieldClassName}>
            <span className={authLabelClassName}>Password</span>
            <div className="relative">
              <input
                autoComplete="new-password"
                className={classNames(authInputClassName, 'pr-12')}
                minLength={8}
                name="password"
                onChange={(event) => onInputChange('password', event)}
                placeholder="8 characters min"
                required
                type={isPasswordVisible ? 'text' : 'password'}
                value={formValues.password}
              />
              <button
                aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                className={authPasswordToggleClassName}
                onClick={() => setIsPasswordVisible((current) => !current)}
                type="button"
              >
                <PasswordVisibilityIcon isVisible={isPasswordVisible} />
              </button>
            </div>
          </label>

          <label className={authFieldClassName}>
            <span className={authLabelClassName}>Referral Code (optional)</span>
            <input
              className={authInputClassName}
              name="referralCode"
              onChange={(event) => onInputChange('referralCode', event)}
              placeholder="Enter referral code if you have one"
              type="text"
              value={formValues.referralCode}
            />
          </label>

          <p className="text-[13px] leading-5 text-tc-brand-body">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>

          <button
            className={classNames(authPrimaryButtonClassName, isRegistering && 'opacity-80')}
            type="submit"
            disabled={isRegistering}
            aria-busy={isRegistering}
          >
            {isRegistering ? (
              <>
                <span className={authLoadingSpinnerClassName} aria-hidden />
                Creating account...
              </>
            ) : (
              'Sign Up'
            )}
          </button>

          <GoogleSignInButton redirectTo="/dashboard" text="signup_with" />
        </form>
      )}
    </AuthPageFrame>
  )
}
