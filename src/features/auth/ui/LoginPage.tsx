import { type ChangeEvent, type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { classNames } from '@/shared/utils/classNames'
import { PasswordVisibilityIcon } from './components/PasswordVisibilityIcon'
import {
  AuthPageFrame,
  authFieldClassName,
  authFooterCopyClassName,
  authFooterLinkClassName,
  authInlineMetaClassName,
  authInputClassName,
  authLabelClassName,
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
  const navigate = useNavigate()

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

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget

    if (!form.checkValidity()) {
      form.reportValidity()
      return
    }

    navigate('/')
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
          <label className={classNames('inline-flex items-center gap-[0.45rem]', authInlineMetaClassName)}>
            <input
              checked={formValues.keepLoggedIn}
              className="m-0"
              name="keepLoggedIn"
              onChange={onKeepLoggedInChange}
              type="checkbox"
            />
            <span>Keep me logged in</span>
          </label>
          <Link
            className={classNames('bg-transparent p-0 hover:underline', authInlineMetaClassName)}
            to="/reset-password"
          >
            Forgot password?
          </Link>
        </div>

        <button className={authPrimaryButtonClassName} type="submit">
          Log in
        </button>
      </form>
    </AuthPageFrame>
  )
}
