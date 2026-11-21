import { useEffect, useState } from 'react'
import { Modal } from '@/shared/ui/modal/Modal'
import { Button } from '@/shared/ui/button/Button'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { useToast } from '@/shared/ui/toast/useToast'
import { ApiError } from '@/shared/types/network'

interface ChangePasswordModalProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly email: string
}

type PasswordStep = 'request' | 'confirm'

const codeLength = 6
const passwordMinLength = 8
const inputClassName =
  'min-h-11 w-full rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:outline-none focus:ring-2 focus:ring-tc-brand-mint'

export function ChangePasswordModal({
  isOpen,
  onClose,
  email,
}: ChangePasswordModalProps) {
  const { requestPasswordReset, resetPassword } = useAuthSession()
  const { success, error } = useToast()
  const [step, setStep] = useState<PasswordStep>('request')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setStep('request')
      setIsSubmitting(false)
      setOtp('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }, [isOpen])

  async function onRequestCode() {
    if (!email.trim()) {
      error('Missing email', 'No account email was found for this session.')
      return
    }

    try {
      setIsSubmitting(true)
      await requestPasswordReset(email.trim())
      setStep('confirm')
      success('Code sent', 'A verification code has been sent to your email.')
    } catch (caughtError) {
      const message =
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Could not send verification code right now.'
      error('Request failed', message)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function onResendCode() {
    await onRequestCode()
  }

  async function onUpdatePassword() {
    if (!email.trim()) {
      error('Missing email', 'No account email was found for this session.')
      return
    }

    const normalizedOtp = otp.replace(/\D/g, '').slice(0, codeLength)
    if (normalizedOtp.length !== codeLength) {
      error('Invalid code', `Enter the ${codeLength}-digit verification code.`)
      return
    }

    if (newPassword.length < passwordMinLength) {
      error('Weak password', `Password must be at least ${passwordMinLength} characters.`)
      return
    }

    if (newPassword !== confirmPassword) {
      error('Password mismatch', 'New password and confirmation must match.')
      return
    }

    try {
      setIsSubmitting(true)
      await resetPassword({
        email: email.trim(),
        otp: normalizedOtp,
        newPassword,
      })
      success('Password updated', 'Your password has been changed successfully.')
      onClose()
    } catch (caughtError) {
      const message =
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Could not update password right now.'
      error('Update failed', message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={!isSubmitting}>
      <div className="space-y-5 p-6">
        <header className="space-y-1 pr-9">
          <h3 className="text-lg font-semibold leading-6 text-tc-brand-ink">Change Password</h3>
          <p className="text-sm leading-5 text-tc-brand-body">
            {step === 'request'
              ? 'Request a verification code to securely update your password.'
              : 'Enter the code from your email and set your new password.'}
          </p>
        </header>

        <div className="space-y-4">
          <label className="block space-y-1.5">
            <span className="block text-sm font-medium text-tc-brand-ink">Account Email</span>
            <input
              className="min-h-11 w-full cursor-not-allowed rounded-tc-md border border-tc-brand-control bg-tc-brand-soft px-3.5 text-sm text-tc-brand-ink"
              type="email"
              value={email}
              readOnly
            />
          </label>

          {step === 'confirm' ? (
            <>
              <label className="block space-y-1.5">
                <span className="block text-sm font-medium text-tc-brand-ink">Verification Code</span>
                <input
                  className={inputClassName}
                  type="text"
                  inputMode="numeric"
                  maxLength={codeLength}
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(event) => {
                    const nextOtp = event.target.value.replace(/\D/g, '').slice(0, codeLength)
                    setOtp(nextOtp)
                  }}
                />
              </label>

              <label className="block space-y-1.5">
                <span className="block text-sm font-medium text-tc-brand-ink">New Password</span>
                <input
                  className={inputClassName}
                  type="password"
                  autoComplete="new-password"
                  minLength={passwordMinLength}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </label>

              <label className="block space-y-1.5">
                <span className="block text-sm font-medium text-tc-brand-ink">Confirm New Password</span>
                <input
                  className={inputClassName}
                  type="password"
                  autoComplete="new-password"
                  minLength={passwordMinLength}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </label>

              <button
                type="button"
                className="min-h-11 text-sm font-semibold text-tc-brand-deep underline underline-offset-4 hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => void onResendCode()}
                disabled={isSubmitting}
              >
                Resend code
              </button>
            </>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
            className="min-w-[110px]"
          >
            Cancel
          </Button>
          {step === 'request' ? (
            <Button
              variant="primary"
              onClick={() => void onRequestCode()}
              disabled={isSubmitting}
              className="min-w-[150px]"
            >
              {isSubmitting ? 'Sending...' : 'Send Code'}
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={() => void onUpdatePassword()}
              disabled={isSubmitting}
              className="min-w-[170px]"
            >
              {isSubmitting ? 'Updating...' : 'Update Password'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
