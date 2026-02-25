import { type ChangeEvent, type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import logoSrc from '@/assets/logo.svg'
import './LoginPage.css'

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

const loginBenefits = [
  'Free forever',
  'No hidden fees',
  'GBP10 reward for your first exchange',
]

function PasswordEyeIcon() {
  return (
    <svg
      aria-hidden
      className="login-password-icon"
      fill="none"
      height="18"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
      viewBox="0 0 24 24"
      width="18"
    >
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
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

    navigate('/dashboard')
  }

  return (
    <main className="login-page">
      <div className="login-layout">
        <aside className="login-highlight-panel">
          <div className="login-brand">
            <img alt="" aria-hidden className="login-brand-logo" src={logoSrc} />
            <span className="login-brand-name">TruCycle</span>
          </div>

          <section className="login-highlight-copy">
            <h1 className="login-highlight-title">
              Join London&apos;s
              <br />
              <span>circular economy.</span>
            </h1>
            <ul className="login-benefits">
              {loginBenefits.map((benefit) => (
                <li key={benefit}>
                  <span aria-hidden className="login-check-icon" />
                  {benefit}
                </li>
              ))}
            </ul>
          </section>

          <article className="login-testimonial">
            <div className="login-testimonial-author">
              <span aria-hidden className="login-avatar">
                SL
              </span>
              <div>
                <p className="login-author-name">Sophie, London</p>
                <p className="login-author-role">Sustainable Living Enthusiast</p>
              </div>
            </div>
            <p className="login-testimonial-quote">
              TruCycle makes donating my unused items easy, secure, and rewarding.
            </p>
            <div className="login-testimonial-meta">
              <span>Jan 2026</span>
              <span className="login-stars">*****</span>
            </div>
          </article>
        </aside>

        <section className="login-form-panel">
          <div className="login-form-header">
            <h2>Login</h2>
            <p>Enter the details below to login to your account</p>
          </div>

          <form className="login-form" onSubmit={onSubmit}>
            <label className="login-field">
              <span>Email Address</span>
              <input
                autoComplete="email"
                name="email"
                onChange={(event) => onInputChange('email', event)}
                placeholder="Enter your email address"
                required
                type="email"
                value={formValues.email}
              />
            </label>

            <label className="login-field">
              <span>Password</span>
              <div className="login-password-wrap">
                <input
                  autoComplete="current-password"
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
                  className="login-password-toggle"
                  onClick={() => setIsPasswordVisible((current) => !current)}
                  type="button"
                >
                  <PasswordEyeIcon />
                </button>
              </div>
            </label>

            <div className="login-row">
              <label className="login-remember">
                <input
                  checked={formValues.keepLoggedIn}
                  name="keepLoggedIn"
                  onChange={onKeepLoggedInChange}
                  type="checkbox"
                />
                <span>Keep me logged in</span>
              </label>
              <Link className="login-forgot-password" to="/reset-password/request">
                Forgot password?
              </Link>
            </div>

            <button className="login-submit" type="submit">
              Log in
            </button>
          </form>

          <p className="login-signup-copy">
            Don&apos;t have an account?{' '}
            <Link className="login-signup-link" to="/signup">
              Sign up
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}
