import { type ChangeEvent, type FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '@/shared/types/network'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { useToast } from '@/shared/ui/toast/useToast'
import { classNames } from '@/shared/utils/classNames'
import {
  AuthPageFrame,
  authFieldClassName,
  authFooterCopyClassName,
  authFooterLinkClassName,
  authInputClassName,
  authLabelClassName,
  authLoadingSpinnerClassName,
  authPrimaryButtonClassName,
} from '@/features/auth/ui/components/AuthPageFrame'

interface PartnerOnboardFormValues {
  readonly name: string
  readonly addressLine: string
  readonly postcode: string
  readonly phoneNumber: string
  readonly operationalNotes: string
}

const initialFormValues: PartnerOnboardFormValues = {
  name: '',
  addressLine: '',
  postcode: '',
  phoneNumber: '',
  operationalNotes: '',
}

export default function PartnerOnboardPage() {
  const [formValues, setFormValues] = useState(initialFormValues)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { upgradeToPartner } = useAuthSession()
  const { success, error } = useToast()
  const navigate = useNavigate()

  function onInputChange(
    key: keyof PartnerOnboardFormValues,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const nextValue = event.currentTarget.value
    setFormValues((currentValues) => ({
      ...currentValues,
      [key]: nextValue,
    }))
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isSubmitting) {
      return
    }

    const name = formValues.name.trim()
    const addressLine = formValues.addressLine.trim()
    const postcode = formValues.postcode.trim()

    if (!name || !addressLine || !postcode) {
      error('Missing details', 'Shop name, address and postcode are required.')
      return
    }

    setIsSubmitting(true)
    try {
      await upgradeToPartner({
        name,
        addressLine,
        postcode,
        phoneNumber: formValues.phoneNumber.trim() || undefined,
        operationalNotes: formValues.operationalNotes.trim() || undefined,
      })
      success('Partner profile ready', 'Your first shop has been created.')
      navigate('/partner')
    } catch (caughtError) {
      const message =
        caughtError instanceof ApiError
          ? caughtError.message
          : 'Unable to complete partner onboarding right now.'
      error('Could not become a partner', message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthPageFrame
      formTitle="Become a TruCycle Partner"
      formDescription="Set up your first shop to unlock the partner console and manage handoffs."
      showcase={{
        titlePrefix: 'Scale your impact',
        titleAccent: 'with trusted partner shops.',
        benefits: [
          'Create your first pickup point in under 2 minutes',
          'Manage donor handoffs from one dashboard',
          'Track shop activity and verified collections',
        ],
        quote:
          'Getting onboarded as a partner shop was straightforward. We started receiving quality items the same day.',
        avatarLabel: 'PK',
        authorName: 'Pearl, Lagos',
        authorRole: 'Shop Partner',
        dateLabel: 'Mar 2026',
      }}
      footer={
        <p className={authFooterCopyClassName}>
          Prefer to continue as a regular member?{' '}
          <Link className={authFooterLinkClassName} to="/dashboard">
            Back to dashboard
          </Link>
        </p>
      }
    >
      <form className="mt-8 grid gap-4" onSubmit={onSubmit}>
        <label className={authFieldClassName}>
          <span className={authLabelClassName}>Shop name</span>
          <input
            className={authInputClassName}
            name="name"
            onChange={(event) => onInputChange('name', event)}
            placeholder="Enter your shop name"
            required
            type="text"
            value={formValues.name}
          />
        </label>

        <label className={authFieldClassName}>
          <span className={authLabelClassName}>Address line</span>
          <input
            className={authInputClassName}
            name="addressLine"
            onChange={(event) => onInputChange('addressLine', event)}
            placeholder="Street address or landmark"
            required
            type="text"
            value={formValues.addressLine}
          />
        </label>

        <label className={authFieldClassName}>
          <span className={authLabelClassName}>Postcode</span>
          <input
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
          <span className={authLabelClassName}>Phone number (optional)</span>
          <input
            className={authInputClassName}
            name="phoneNumber"
            onChange={(event) => onInputChange('phoneNumber', event)}
            placeholder="+44 20 7946 0958"
            type="tel"
            value={formValues.phoneNumber}
          />
        </label>

        <label className={authFieldClassName}>
          <span className={authLabelClassName}>Operational notes (optional)</span>
          <textarea
            className={classNames(authInputClassName, 'h-auto min-h-[110px] resize-y py-3')}
            name="operationalNotes"
            onChange={(event) => onInputChange('operationalNotes', event)}
            placeholder="Share collection instructions for donors or staff"
            value={formValues.operationalNotes}
          />
        </label>

        <button
          className={classNames(authPrimaryButtonClassName, isSubmitting && 'opacity-80')}
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span className={authLoadingSpinnerClassName} aria-hidden />
              Creating shop...
            </>
          ) : (
            'Create partner shop'
          )}
        </button>
      </form>
    </AuthPageFrame>
  )
}
