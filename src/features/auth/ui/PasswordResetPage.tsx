import { type ChangeEvent, type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logoSrc from '@/assets/logo.svg'
import './PasswordResetPage.css'

interface ResetFormValues {
  readonly password: string
  readonly confirmPassword: string
}

const initialFormValues: ResetFormValues = {
  password: '',
  confirmPassword: '',
}

const resetBenefits = [
  'Free forever',
  'No hidden fees',
  'GBP10 reward for your first exchange',
]

function PasswordEyeIcon() {
  return (
    <svg
      aria-hidden
      className="reset-password-icon"
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

export default function PasswordResetPage() {
  const [formValues, setFormValues] = useState(initialFormValues)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmVisible, setIsConfirmVisible] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  function onInputChange(
    key: keyof ResetFormValues,
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
    setIsSubmitting(true)
    navigate('/welcome')
  }

  return (
    <main className="reset-page">
      <div className="reset-layout">
        <aside className="reset-highlight-panel">
          <div className="reset-brand">
            <img alt="" aria-hidden className="reset-brand-logo" src={logoSrc} />
            <span className="reset-brand-name">TruCycle</span>
          </div>

          <section className="reset-highlight-copy">
            <h1 className="reset-highlight-title">
              Join London&apos;s
              <br />
              <span>circular economy.</span>
            </h1>
            <ul className="reset-benefits">
              {resetBenefits.map((benefit) => (
                <li key={benefit}>
                  <span aria-hidden className="reset-check-icon" />
                  {benefit}
                </li>
              ))}
            </ul>
          </section>

          <article className="reset-testimonial">
            <div className="reset-testimonial-author">
              <img
                alt="Sophie, London"
                className="reset-avatar"
                src="/profile-picture.jpg"
              />
              <div>
                <p className="reset-author-name">Sophie, London</p>
                <p className="reset-author-role">Sustainable Living Enthusiast</p>
              </div>
            </div>
            <p className="reset-testimonial-quote">
              TruCycle makes donating my unused items easy, secure, and
              rewarding!
            </p>
            <div className="reset-testimonial-meta">
              <span className="reset-date">Jan 2026</span>
              <span className="reset-stars">*****</span>
            </div>
          </article>
        </aside>

        <section className="reset-form-panel">
          <div className="reset-form-header">
            <h2>Create Your New Password</h2>
            <p>Set your new password</p>
          </div>

          <form className="reset-form" onSubmit={onSubmit}>
            <label className="reset-field">
              <span>Password</span>
              <div className="reset-password-wrap">
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
                  className="reset-password-toggle"
                  onClick={() => setIsPasswordVisible((current) => !current)}
                  type="button"
                >
                  <PasswordEyeIcon />
                </button>
              </div>
            </label>

            <label className="reset-field">
              <span>Confirm Password</span>
              <div className="reset-password-wrap">
                <input
                  autoComplete="new-password"
                  minLength={8}
                  name="confirmPassword"
                  onChange={(event) => onInputChange('confirmPassword', event)}
                  placeholder="8 characters min"
                  required
                  type={isConfirmVisible ? 'text' : 'password'}
                  value={formValues.confirmPassword}
                />
                <button
                  aria-label={isConfirmVisible ? 'Hide password' : 'Show password'}
                  className="reset-password-toggle"
                  onClick={() => setIsConfirmVisible((current) => !current)}
                  type="button"
                >
                  <PasswordEyeIcon />
                </button>
              </div>
            </label>

            <button
              className={`reset-submit ${isSubmitting ? 'is-loading' : ''}`}
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="reset-loading-spinner" aria-hidden />
                  Updating...
                </>
              ) : (
                'Set Password'
              )}
            </button>
          </form>

          <p className="reset-support">
            Need help? <span>Contact Support</span>
          </p>
        </section>
      </div>
    </main>
  )
}
