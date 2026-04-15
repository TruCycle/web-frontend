import { type ChangeEvent, type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, RefreshCw } from 'lucide-react'
import { resendVerificationEmail } from '@/features/auth/api/authApi'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { ApiError } from '@/shared/types/network'
import { useToast } from '@/shared/ui/toast/useToast'
import { classNames } from '@/shared/utils/classNames'
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
  readonly postcode: string
  readonly referralCode: string
}

const initialFormValues: SignupFormValues = {
  fullName: '',
  email: '',
  password: '',
  postcode: '',
  referralCode: '',
}

interface SignupPageProps {
  readonly className?: string
  readonly onSubmitSuccess?: () => void
}

export default function SignupPage({
  className,
  onSubmitSuccess,
}: SignupPageProps) {
  const [formValues, setFormValues] = useState(initialFormValues)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)
  const [isResendingVerification, setIsResendingVerification] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null)
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
      await register({
        firstName: splitName.firstName,
        lastName: splitName.lastName,
        email: formValues.email.trim(),
        password: formValues.password,
      })
      onSubmitSuccess?.()
      setVerificationEmail(formValues.email.trim())
      success('Account created', 'Check your email to verify your account and complete registration.')
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
      success('Verification email sent', 'Check your inbox for a fresh verification link.')
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
        <div className="mt-8 grid gap-5">
          <div className="rounded-[0.9rem] border border-tc-auth-inputBorder bg-[#F8FAFC] p-5">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tc-shell-accent/20 text-tc-shell-bg">
                <Mail size={20} />
              </span>
              <div>
                <p className="m-0 text-sm font-medium text-tc-auth-formText">Verification email sent to</p>
                <p className="mt-1 break-all text-base font-semibold text-tc-auth-formTitle">{verificationEmail}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 rounded-[0.9rem] border border-tc-auth-inputBorder bg-white p-5 text-sm leading-7 text-tc-auth-formText">
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
                'inline-flex h-[3.05rem] items-center justify-center gap-2 rounded-[0.55rem] border border-tc-auth-inputBorder bg-white px-4 text-base font-semibold text-tc-auth-formTitle transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-tc-auth-submitFocus disabled:cursor-not-allowed disabled:opacity-70 sm:flex-1',
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

          <Link className="text-center text-sm font-medium text-tc-auth-link no-underline hover:underline" to="/login">
            I&apos;ve verified my email, continue to login
          </Link>
        </div>
      ) : (
        <form className="mt-8 grid gap-4" onSubmit={onSubmit}>
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
                className={classNames(authInputClassName, 'pr-11')}
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
            <span className={authLabelClassName}>Postcode</span>
            <input
              autoComplete="postal-code"
              className={authInputClassName}
              name="postcode"
              onChange={(event) => onInputChange('postcode', event)}
              placeholder="SW1A 1AA"
              required
              type="text"
              value={formValues.postcode}
            />
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

          <p className="text-sm text-tc-auth-row">
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
        </form>
      )}
    </AuthPageFrame>
  )
}
