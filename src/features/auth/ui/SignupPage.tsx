import { type ChangeEvent, type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { classNames } from '@/shared/utils/classNames'
import { useUserRole } from '@/shared/context/useUserRole'
import { OnboardingChoiceDialog } from './components/OnboardingChoiceDialog'
import { PasswordVisibilityIcon } from './components/PasswordVisibilityIcon'
import {
  AuthPageFrame,
  authFieldClassName,
  authFooterCopyClassName,
  authFooterLinkClassName,
  authInputClassName,
  authLabelClassName,
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
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
  const [isChoosingRole, setIsChoosingRole] = useState(false)
  const [pendingChoice, setPendingChoice] = useState<'collect' | 'donate' | null>(
    null,
  )
  const { setRole } = useUserRole()
  const navigate = useNavigate()

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

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmitSuccess?.()
    setIsOnboardingOpen(true)
  }

  function handleOnboardingSelect(choice: 'collect' | 'donate') {
    if (isChoosingRole) {
      return
    }
    setIsChoosingRole(true)
    setPendingChoice(choice)
    setRole(choice === 'collect' ? 'collector' : 'donor')
    setIsOnboardingOpen(false)
    navigate('/login')
  }

  function handleOnboardingClose() {
    if (isChoosingRole) {
      return
    }
    setIsOnboardingOpen(false)
    navigate('/login')
  }

  return (
    <>
      <AuthPageFrame
        className={className}
        formTitle="Welcome to TruCycle"
        formDescription="Create your free account to start making an impact"
        showcase={{
          avatarSrc: '/profile-picture.jpg',
          quote:
            'TruCycle makes donating my unused items easy, secure, and rewarding.',
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
              placeholder="Enter code for bonus rewards"
              type="text"
              value={formValues.referralCode}
            />
          </label>

          <p className="text-sm text-tc-auth-row">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>

          <button className={authPrimaryButtonClassName} type="submit">
            Sign Up
          </button>
        </form>
      </AuthPageFrame>

      <OnboardingChoiceDialog
        isOpen={isOnboardingOpen}
        onClose={handleOnboardingClose}
        onSelect={handleOnboardingSelect}
        isLoading={isChoosingRole}
        loadingChoice={pendingChoice}
      />
    </>
  )
}
