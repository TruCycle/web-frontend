import { type ChangeEvent, type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logoSrc from '@/assets/logo.svg'
import { Button } from '@/shared/ui/button/Button'
import './PasswordResetPage.css'

interface ResetRequestValues {
  readonly email: string
}

const initialFormValues: ResetRequestValues = {
  email: '',
}

const resetBenefits = [
  'Free forever',
  'No hidden fees',
  'GBP10 reward for your first exchange',
]

export default function PasswordResetRequestPage() {
  const [formValues, setFormValues] = useState(initialFormValues)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    const nextValue = event.currentTarget.value
    setFormValues({ email: nextValue })
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    navigate('/reset-password/otp')
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
            <h2>Reset Your Password</h2>
            <p>Enter your registered email to proceed</p>
          </div>

          <form className="reset-form" onSubmit={onSubmit}>
            <label className="reset-field">
              <span>Email Address</span>
              <input
                autoComplete="email"
                name="email"
                onChange={onInputChange}
                placeholder="Enter your email address"
                required
                type="email"
                value={formValues.email}
              />
            </label>

            <Button
              className={`reset-submit ${isSubmitting ? 'is-loading' : ''}`}
              type="submit"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="reset-loading-spinner" aria-hidden />
                  Sending code...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </form>

          <p className="reset-support">
            Need help? <span>Contact Support</span>
          </p>
        </section>
      </div>
    </main>
  )
}
