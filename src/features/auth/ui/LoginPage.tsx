import { type ChangeEvent, type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { ApiError } from '@/shared/types/network'
import { useToast } from '@/shared/ui/toast/useToast'
import { classNames } from '@/shared/utils/classNames'
import { AuthCheckbox } from './components/AuthCheckbox'
import { PasswordVisibilityIcon } from './components/PasswordVisibilityIcon'
import {
  AuthPageFrame,
  authFieldClassName,
  authFooterCopyClassName,
  authFooterLinkClassName,
  authInlineMetaClassName,
  authInputClassName,
  authLabelClassName,
  authLoadingSpinnerClassName,
  authPasswordToggleClassName,
  authPrimaryButtonClassName,
} from './components/AuthPageFrame'

interface LoginFormValues {
  readonly email: string
  readonly password: string
  readonly keepLoggedIn: boolean
}

const initialFormValues: LoginFormValues = {
  email: '',
  password: '',
  keepLoggedIn: false,
}

export default function LoginPage() {
  const [formValues, setFormValues] = useState(initialFormValues)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuthSession()
  const { success, error } = useToast()

  function onInputChange(
    key: keyof Pick<LoginFormValues, 'email' | 'password'>,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const nextValue = event.currentTarget.value
    setFormValues((currentValues) => ({
      ...currentValues,
      [key]: nextValue,
    }))
  }

  function onKeepLoggedInChange(event: ChangeEvent<HTMLInputElement>) {
    const isChecked = event.currentTarget.checked
    setFormValues((currentValues) => ({
      ...currentValues,
      keepLoggedIn: isChecked,
    }))
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget

    if (!form.checkValidity()) {
      form.reportValidity()
      return
    }

    setIsSubmitting(true)
    try {
      await login(
        {
          email: formValues.email.trim(),
          password: formValues.password,
        },
        { rememberSession: formValues.keepLoggedIn },
      )
      success('Login successful', 'Welcome back to TruCycle.')
      navigate('/')
    } catch (caughtError) {
      const message =
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Unable to login right now. Please try again.'
      error('Login failed', message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthPageFrame
      formTitle="Login"
      formDescription="Enter the details below to login to your account"
      showcase={{
        avatarLabel: 'SL',
        quote:
          'TruCycle makes donating my unused items easy, secure, and rewarding.',
      }}
      footer={
        <p className={authFooterCopyClassName}>
          Don&apos;t have an account?{' '}
          <Link className={authFooterLinkClassName} to="/signup">
            Sign up
          </Link>
        </p>
      }
    >
      <form className="mt-8 grid gap-4" onSubmit={onSubmit}>
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
              autoComplete="current-password"
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

        <div className="flex items-center justify-between gap-4 max-sm:flex-wrap">
          <AuthCheckbox
            checked={formValues.keepLoggedIn}
            className={authInlineMetaClassName}
            label="Keep me logged in"
            name="keepLoggedIn"
            onChange={onKeepLoggedInChange}
          />
          <Link
            className={classNames('bg-transparent p-0 hover:underline', authInlineMetaClassName)}
            to="/reset-password"
          >
            Forgot password?
          </Link>
        </div>

        <button
          className={classNames(authPrimaryButtonClassName, isSubmitting && 'opacity-80')}
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className={authLoadingSpinnerClassName} aria-hidden />
              Logging in...
            </>
          ) : (
            'Log in'
          )}
        </button>
      </form>
    </AuthPageFrame>
  )
}
