import { type ChangeEvent, type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logoSrc from '@/assets/logo.svg'
import { Button } from '@/shared/ui/button/Button'
import './PasswordResetPage.css'

const resetBenefits = [
  'Free forever',
  'No hidden fees',
  'GBP10 reward for your first exchange',
]

const otpLength = 6

export default function PasswordResetOtpPage() {
  const [otpValues, setOtpValues] = useState<string[]>(
    Array.from({ length: otpLength }, () => ''),
  )
  const navigate = useNavigate()

  function onOtpChange(index: number, event: ChangeEvent<HTMLInputElement>) {
    const nextValue = event.currentTarget.value.replace(/\D/g, '').slice(-1)
    setOtpValues((currentValues) =>
      currentValues.map((value, idx) => (idx === index ? nextValue : value)),
    )
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    navigate('/reset-password')
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
            <p>Enter the code sent to your mail to continue.</p>
          </div>

          <form className="reset-form" onSubmit={onSubmit}>
            <label className="reset-field">
              <span>OTP Code</span>
              <div className="reset-otp">
                {otpValues.map((value, index) => (
                  <input
                    key={`otp-${index + 1}`}
                    aria-label={`OTP digit ${index + 1}`}
                    className="reset-otp-input"
                    inputMode="numeric"
                    onChange={(event) => onOtpChange(index, event)}
                    pattern="[0-9]*"
                    type="text"
                    value={value}
                  />
                ))}
              </div>
            </label>

            <p className="reset-helper">
              Didn&apos;t receive code? Click <span>here</span> to resend
            </p>

            <Button className="reset-submit" type="submit">
              Continue
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
