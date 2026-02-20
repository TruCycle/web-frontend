import { type ChangeEvent, type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import logoSrc from '@/assets/logo.svg'
import './SignupPage.css'

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

const signupBenefits = [
  'Free forever',
  'No hidden fees',
  'GBP10 reward for your first exchange',
]

function PasswordEyeIcon() {
  return (
    <svg
      aria-hidden
      className="signup-password-icon"
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

export default function SignupPage() {
  const [formValues, setFormValues] = useState(initialFormValues)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

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
  }

  return (
    <main className="signup-page">
      <div className="signup-layout">
        <aside className="signup-highlight-panel">
          <div className="signup-brand">
            <img alt="" aria-hidden className="signup-brand-logo" src={logoSrc} />
            <span className="signup-brand-name">TruCycle</span>
          </div>

          <section className="signup-highlight-copy">
            <h1 className="signup-highlight-title">
              Join London&apos;s
              <br />
              <span>circular economy.</span>
            </h1>
            <ul className="signup-benefits">
              {signupBenefits.map((benefit) => (
                <li key={benefit}>
                  <span aria-hidden className="signup-check-icon" />
                  {benefit}
                </li>
              ))}
            </ul>
          </section>

          <article className="signup-testimonial">
            <div className="signup-testimonial-author">
              <span aria-hidden className="signup-avatar">
                SL
              </span>
              <div>
                <p className="signup-author-name">Sophie, London</p>
                <p className="signup-author-role">Sustainable Living Enthusiast</p>
              </div>
            </div>
            <p className="signup-testimonial-quote">
              TruCycle makes donating my unused items easy, secure, and
              rewarding.
            </p>
            <div className="signup-testimonial-meta">
              <span>Jan 2026</span>
              <span className="signup-stars">*****</span>
            </div>
          </article>
        </aside>

        <section className="signup-form-panel">
          <div className="signup-form-header">
            <h2>Welcome to TruCycle</h2>
            <p>Create your free account to start making an impact</p>
          </div>

          <form className="signup-form" onSubmit={onSubmit}>
            <label className="signup-field">
              <span>Full Name</span>
              <input
                autoComplete="name"
                name="fullName"
                onChange={(event) => onInputChange('fullName', event)}
                placeholder="Enter your full name"
                required
                type="text"
                value={formValues.fullName}
              />
            </label>

            <label className="signup-field">
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

            <label className="signup-field">
              <span>Password</span>
              <div className="signup-password-wrap">
                <input
                  autoComplete="new-password"
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
                  className="signup-password-toggle"
                  onClick={() => setIsPasswordVisible((current) => !current)}
                  type="button"
                >
                  <PasswordEyeIcon />
                </button>
              </div>
            </label>

            <label className="signup-field">
              <span>Postcode</span>
              <input
                autoComplete="postal-code"
                name="postcode"
                onChange={(event) => onInputChange('postcode', event)}
                placeholder="SW1A 1AA"
                required
                type="text"
                value={formValues.postcode}
              />
            </label>

            <label className="signup-field">
              <span>Referral Code (optional)</span>
              <input
                name="referralCode"
                onChange={(event) => onInputChange('referralCode', event)}
                placeholder="Enter code for bonus rewards"
                type="text"
                value={formValues.referralCode}
              />
            </label>

            <p className="signup-policy">
              By continuing, you agree to our Terms of Service and Privacy
              Policy
            </p>

            <button className="signup-submit" type="submit">
              Sign Up
            </button>
          </form>

          <p className="signup-login-copy">
            Already have an account?{' '}
            <Link className="signup-login-link" to="/login">
              Log in
            </Link>
          </p>
        </section>
      </div>
    </main>
  )
}
