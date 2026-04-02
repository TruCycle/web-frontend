import {
  type ClipboardEvent,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { ApiError } from '@/shared/types/network'
import { classNames } from '@/shared/utils/classNames'
import { useToast } from '@/shared/ui/toast/useToast'
import { PasswordVisibilityIcon } from './components/PasswordVisibilityIcon'
import {
  AuthPageFrame,
  authFieldClassName,
  authInlineMetaClassName,
  authInputClassName,
  authLabelClassName,
  authLoadingSpinnerClassName,
  authPasswordToggleClassName,
  authPrimaryButtonClassName,
} from './components/AuthPageFrame'

interface ResetPasswordValues {
  readonly password: string
  readonly confirmPassword: string
}

const otpLength = 6

type ResetStep = 'request' | 'otp' | 'password'

const initialOtpValues = Array.from({ length: otpLength }, () => '')

const initialResetPasswordValues: ResetPasswordValues = {
  password: '',
  confirmPassword: '',
}

export default function PasswordResetPage() {
  const [email, setEmail] = useState('')
  const [otpValues, setOtpValues] = useState<string[]>(initialOtpValues)
  const [passwordValues, setPasswordValues] = useState(initialResetPasswordValues)
  const [resetStep, setResetStep] = useState<ResetStep>('request')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmVisible, setIsConfirmVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([])
  const navigateTimeoutRef = useRef<number | null>(null)
  const { requestPasswordReset, resetPassword } = useAuthSession()
  const { success, info, error } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    return () => {
      if (navigateTimeoutRef.current !== null) {
        window.clearTimeout(navigateTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    setIsSubmitting(false)
    if (resetStep !== 'otp') {
      return
    }

    const focusTimeoutId = window.setTimeout(() => {
      focusOtpInput(0)
    }, 0)

    return () => {
      window.clearTimeout(focusTimeoutId)
    }
  }, [resetStep])

  function focusOtpInput(index: number) {
    const inputElement = otpInputRefs.current[index]
    if (!inputElement) {
      return
    }
    inputElement.focus()
    inputElement.select()
  }

  function onEmailInputChange(event: ChangeEvent<HTMLInputElement>) {
    setEmail(event.currentTarget.value)
  }

  function onOtpChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    const incomingDigits = event.currentTarget.value.replace(/\D/g, '')

    if (!incomingDigits) {
      const nextValues = [...otpValues]
      nextValues[index] = ''
      setOtpValues(nextValues)
      return
    }

    const nextValues = [...otpValues]
    let lastUpdatedIndex = index
    for (
      let offset = 0;
      offset < incomingDigits.length && index + offset < otpLength;
      offset += 1
    ) {
      nextValues[index + offset] = incomingDigits[offset]
      lastUpdatedIndex = index + offset
    }
    setOtpValues(nextValues)

    if (lastUpdatedIndex < otpLength - 1) {
      focusOtpInput(lastUpdatedIndex + 1)
    } else {
      focusOtpInput(lastUpdatedIndex)
    }

    const wasComplete = otpValues.every((digit) => digit.length === 1)
    const isNowComplete = nextValues.every((digit) => digit.length === 1)
    if (!wasComplete && isNowComplete) {
      info('Code completed', 'OTP filled. Press Continue to verify.')
    }
  }

  function onOtpKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace') {
      if (otpValues[index]) {
        const nextValues = [...otpValues]
        nextValues[index] = ''
        setOtpValues(nextValues)
        return
      }

      if (index > 0) {
        event.preventDefault()
        const nextValues = [...otpValues]
        nextValues[index - 1] = ''
        setOtpValues(nextValues)
        focusOtpInput(index - 1)
      }
      return
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault()
      focusOtpInput(index - 1)
      return
    }

    if (event.key === 'ArrowRight' && index < otpLength - 1) {
      event.preventDefault()
      focusOtpInput(index + 1)
    }
  }

  function onOtpPaste(index: number, event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault()
    const pastedDigits = event.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, otpLength - index)

    if (!pastedDigits) {
      return
    }

    const nextValues = [...otpValues]
    for (let offset = 0; offset < pastedDigits.length; offset += 1) {
      nextValues[index + offset] = pastedDigits[offset]
    }
    setOtpValues(nextValues)

    const lastUpdatedIndex = Math.min(index + pastedDigits.length - 1, otpLength - 1)
    focusOtpInput(lastUpdatedIndex)

    const wasComplete = otpValues.every((digit) => digit.length === 1)
    const isNowComplete = nextValues.every((digit) => digit.length === 1)
    if (!wasComplete && isNowComplete) {
      info('Code completed', 'OTP filled. Press Continue to verify.')
    }
  }

  async function onResendCode() {
    if (!email.trim()) {
      error('Missing email', 'Enter your email before requesting another code.')
      return
    }

    try {
      await requestPasswordReset(email.trim())
      setOtpValues(initialOtpValues)
      focusOtpInput(0)
      success('Code resent', 'A fresh OTP has been sent to your email.')
    } catch (caughtError) {
      const message =
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Could not resend code right now. Please try again.'
      error('Resend failed', message)
    }
  }

  function onPasswordInputChange(
    key: keyof ResetPasswordValues,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const nextValue = event.currentTarget.value
    setPasswordValues((currentValues) => ({
      ...currentValues,
      [key]: nextValue,
    }))
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (resetStep === 'request') {
      setIsSubmitting(true)
      try {
        await requestPasswordReset(email.trim())
        setResetStep('otp')
        success('Code sent', 'Check your inbox for the 6-digit verification code.')
      } catch (caughtError) {
        const message =
          caughtError instanceof ApiError
            ? caughtError.message
            : 'Could not send reset code right now. Please try again.'
        error('Request failed', message)
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    if (resetStep === 'otp') {
      const isOtpComplete = otpValues.every((digit) => digit.length === 1)
      if (!isOtpComplete) {
        error('Code incomplete', 'Enter all 6 digits before continuing.')
        return
      }
      setResetStep('password')
      success('Code verified', 'Now create your new password.')
      return
    }

    if (passwordValues.password !== passwordValues.confirmPassword) {
      error('Password mismatch', 'Password and confirmation must match.')
      return
    }

    setIsSubmitting(true)
    try {
      const resetOtp = otpValues.join('')
      await resetPassword({
        email: email.trim(),
        otp: resetOtp,
        newPassword: passwordValues.password,
      })
      success('Password updated', 'Redirecting you now...')
      if (navigateTimeoutRef.current !== null) {
        window.clearTimeout(navigateTimeoutRef.current)
      }
      navigateTimeoutRef.current = window.setTimeout(() => {
        navigate('/login')
      }, 450)
    } catch (caughtError) {
      const message =
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Could not reset password right now. Please try again.'
      error('Reset failed', message)
      setIsSubmitting(false)
    }
  }

  const formTitle =
    resetStep === 'password' ? 'Create Your New Password' : 'Reset Your Password'
  const formDescription =
    resetStep === 'request'
      ? 'Enter your registered email to proceed'
      : resetStep === 'otp'
        ? 'Enter the code sent to your mail to continue.'
        : 'Set your new password'

  function renderStepContent() {
    if (resetStep === 'request') {
      return (
        <label className={authFieldClassName}>
          <span className={authLabelClassName}>Email Address</span>
          <input
            autoComplete="email"
            className={authInputClassName}
            name="email"
            onChange={onEmailInputChange}
            placeholder="Enter your email address"
            required
            type="email"
            value={email}
          />
        </label>
      )
    }

    if (resetStep === 'otp') {
      return (
        <>
          <label className={authFieldClassName}>
            <span className={authLabelClassName}>OTP Code</span>
            <div className="grid w-fit grid-cols-6 gap-4">
              {otpValues.map((value, index) => (
                <input
                  key={`otp-${index + 1}`}
                  ref={(element) => {
                    otpInputRefs.current[index] = element
                  }}
                  aria-label={`OTP digit ${index + 1}`}
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-[8px] border border-tc-auth-inputBorder text-center text-lg font-semibold text-tc-app-text outline-none transition focus:border-tc-auth-inputFocus focus:ring-4 focus:ring-tc-auth-inputFocusRing"
                  inputMode="numeric"
                  maxLength={1}
                  onChange={(event) => onOtpChange(index, event)}
                  onFocus={(event) => event.currentTarget.select()}
                  onKeyDown={(event) => onOtpKeyDown(index, event)}
                  onPaste={(event) => onOtpPaste(index, event)}
                  pattern="[0-9]*"
                  required
                  type="text"
                  value={value}
                />
              ))}
            </div>
          </label>

          <p className="text-sm text-tc-auth-row">
            Didn&apos;t receive code? Click{' '}
            <button
              className={classNames(
                'font-semibold text-tc-auth-link underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tc-auth-inputFocus',
              )}
              onClick={onResendCode}
              type="button"
            >
              here
            </button>{' '}
            to resend
          </p>
        </>
      )
    }

    return (
      <>
        <label className={authFieldClassName}>
          <span className={authLabelClassName}>Password</span>
          <div className="relative">
            <input
              autoComplete="new-password"
              className={classNames(authInputClassName, 'pr-11')}
              minLength={8}
              name="password"
              onChange={(event) => onPasswordInputChange('password', event)}
              placeholder="8 characters min"
              required
              type={isPasswordVisible ? 'text' : 'password'}
              value={passwordValues.password}
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
          <span className={authLabelClassName}>Confirm Password</span>
          <div className="relative">
            <input
              autoComplete="new-password"
              className={classNames(authInputClassName, 'pr-11')}
              minLength={8}
              name="confirmPassword"
              onChange={(event) => onPasswordInputChange('confirmPassword', event)}
              placeholder="8 characters min"
              required
              type={isConfirmVisible ? 'text' : 'password'}
              value={passwordValues.confirmPassword}
            />
            <button
              aria-label={isConfirmVisible ? 'Hide password' : 'Show password'}
              className={authPasswordToggleClassName}
              onClick={() => setIsConfirmVisible((current) => !current)}
              type="button"
            >
              <PasswordVisibilityIcon isVisible={isConfirmVisible} />
            </button>
          </div>
        </label>
      </>
    )
  }

  return (
    <AuthPageFrame
      formTitle={formTitle}
      formDescription={formDescription}
      showcase={{
        avatarSrc: '/profile-picture.jpg',
        quote:
          'TruCycle makes donating my unused items easy, secure, and straightforward.',
      }}
    >
      <form className="mt-8 grid gap-4" onSubmit={onSubmit}>
        {renderStepContent()}

        <button
          className={classNames(authPrimaryButtonClassName, isSubmitting && 'opacity-80')}
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className={authLoadingSpinnerClassName} aria-hidden />
              {resetStep === 'request' ? 'Sending code...' : 'Updating...'}
            </>
          ) : (
            resetStep === 'password' ? 'Set Password' : 'Continue'
          )}
        </button>
      </form>

      <p
        className={classNames(
          'mt-4 text-center text-tc-auth-muted',
          authInlineMetaClassName,
        )}
      >
        Need help?{' '}
        <span className={classNames('font-semibold text-tc-auth-link')}>
          Contact Support
        </span>
      </p>
    </AuthPageFrame>
  )
}
