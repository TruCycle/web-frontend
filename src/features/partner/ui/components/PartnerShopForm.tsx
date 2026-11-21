import { type FormEvent, useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/shared/ui/button/Button'
import type { CreatePartnerShopPayload, PartnerShop } from '@/features/partner/types'
import { classNames } from '@/shared/utils/classNames'
import { normalizeFullUkPostcode } from '@/shared/utils/fullUkPostcode'

interface PartnerShopFormProps {
  readonly initialShop?: PartnerShop
  readonly submitLabel: string
  readonly isSubmitting: boolean
  readonly onSubmit: (payload: CreatePartnerShopPayload) => Promise<void>
  readonly onCancel?: () => void
}

interface ShopFormValues {
  readonly name: string
  readonly addressLine: string
  readonly postcode: string
  readonly phoneNumber: string
  readonly operationalNotes: string
  readonly openTime: string
  readonly closeTime: string
  readonly days: readonly string[]
  readonly acceptableCategories: readonly string[]
}

const dayOptions = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const categoryOptions = [
  'furniture',
  'electronics',
  'clothing',
  'appliances',
  'books',
  'toys',
  'kitchenware',
]

function normalizeCategory(value: string): string {
  return value.trim().toLowerCase()
}

function getInitialValues(shop?: PartnerShop): ShopFormValues {
  return {
    name: shop?.name ?? '',
    addressLine: shop?.addressLine ?? '',
    postcode: shop?.postcode ?? '',
    phoneNumber: shop?.phoneNumber ?? '',
    operationalNotes: shop?.operationalNotes ?? '',
    openTime: shop?.openingHours?.openTime ?? '09:00',
    closeTime: shop?.openingHours?.closeTime ?? '17:00',
    days: shop?.openingHours?.days ?? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    acceptableCategories: shop?.acceptableCategories ?? [],
  }
}

export function PartnerShopForm({
  initialShop,
  submitLabel,
  isSubmitting,
  onSubmit,
  onCancel,
}: PartnerShopFormProps) {
  const initialValues = useMemo(() => getInitialValues(initialShop), [initialShop])
  const [name, setName] = useState(initialValues.name)
  const [addressLine, setAddressLine] = useState(initialValues.addressLine)
  const [postcode, setPostcode] = useState(initialValues.postcode)
  const [phoneNumber, setPhoneNumber] = useState(initialValues.phoneNumber)
  const [operationalNotes, setOperationalNotes] = useState(initialValues.operationalNotes)
  const [openTime, setOpenTime] = useState(initialValues.openTime)
  const [closeTime, setCloseTime] = useState(initialValues.closeTime)
  const [selectedDays, setSelectedDays] = useState<readonly string[]>(initialValues.days)
  const [selectedCategories, setSelectedCategories] = useState<readonly string[]>(
    initialValues.acceptableCategories,
  )
  const [customCategory, setCustomCategory] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  function toggleDay(day: string) {
    setSelectedDays((currentDays) =>
      currentDays.includes(day)
        ? currentDays.filter((entry) => entry !== day)
        : [...currentDays, day],
    )
  }

  function toggleCategory(category: string) {
    const normalized = normalizeCategory(category)
    setSelectedCategories((currentCategories) =>
      currentCategories.includes(normalized)
        ? currentCategories.filter((entry) => entry !== normalized)
        : [...currentCategories, normalized],
    )
  }

  function addCustomCategory() {
    const normalized = normalizeCategory(customCategory)
    if (!normalized) {
      return
    }

    setSelectedCategories((currentCategories) =>
      currentCategories.includes(normalized)
        ? currentCategories
        : [...currentCategories, normalized],
    )
    setCustomCategory('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSubmitting) return

    const normalizedName = name.trim()
    const normalizedAddressLine = addressLine.trim()
    const normalizedPostcode = normalizeFullUkPostcode(postcode)

    if (!normalizedName || !normalizedAddressLine || !postcode.trim()) {
      setValidationError('Shop name, address line, and postcode are required.')
      return
    }
    if (normalizedName.length < 2 || !normalizedPostcode) {
      setValidationError('Enter a shop name of at least 2 characters and a full UK postcode, for example SW1A 1AA.')
      return
    }

    if (!openTime || !closeTime || selectedDays.length === 0) {
      setValidationError('Select at least one opening day and provide opening/closing time.')
      return
    }

    setValidationError(null)
    try {
      await onSubmit({
        name: normalizedName,
        addressLine: normalizedAddressLine,
        postcode: normalizedPostcode,
        phoneNumber: phoneNumber.trim() || undefined,
        operationalNotes: operationalNotes.trim() || undefined,
        openingHours: {
          days: selectedDays,
          openTime,
          closeTime,
        },
        acceptableCategories: selectedCategories,
      })
    } catch {
      return
    }

    if (!initialShop) {
      setName('')
      setAddressLine('')
      setPostcode('')
      setPhoneNumber('')
      setOperationalNotes('')
      setOpenTime('09:00')
      setCloseTime('17:00')
      setSelectedDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
      setSelectedCategories([])
      setCustomCategory('')
    }
  }

  return (
    <form className="grid gap-4" onSubmit={(event) => void handleSubmit(event)}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium text-tc-brand-ink">
          Shop name
          <input
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            className="h-11 rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink outline-none placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:ring-2 focus:ring-tc-brand-mint"
            placeholder="Enter shop name"
            minLength={2}
            maxLength={120}
            required
          />
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-tc-brand-ink">
          Postcode
          <input
            value={postcode}
            onChange={(event) => setPostcode(event.currentTarget.value)}
            className="h-11 rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink outline-none placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:ring-2 focus:ring-tc-brand-mint"
            placeholder="SW1A 1AA"
            autoComplete="postal-code"
            maxLength={32}
            required
          />
        </label>
      </div>

      <label className="grid gap-1.5 text-sm font-medium text-tc-brand-ink">
        Address line
        <input
          value={addressLine}
          onChange={(event) => setAddressLine(event.currentTarget.value)}
          className="h-11 rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink outline-none placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:ring-2 focus:ring-tc-brand-mint"
          placeholder="Street address or landmark"
          autoComplete="street-address"
          maxLength={255}
          required
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-medium text-tc-brand-ink">
          Phone number
          <input
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.currentTarget.value)}
            className="h-11 rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink outline-none placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:ring-2 focus:ring-tc-brand-mint"
            placeholder="+44 20 7946 0958"
          />
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-tc-brand-ink">
          Operational notes
          <input
            value={operationalNotes}
            onChange={(event) => setOperationalNotes(event.currentTarget.value)}
            className="h-11 rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink outline-none placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:ring-2 focus:ring-tc-brand-mint"
            placeholder="Pickup instructions"
          />
        </label>
      </div>

      <section className="border-t border-tc-brand-line pt-4">
        <h3 className="text-sm font-semibold text-tc-brand-ink">Opening hours</h3>
        <p className="mt-0.5 text-[13px] leading-5 text-tc-brand-body">Choose days and time window for this shop.</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {dayOptions.map((day) => {
            const isSelected = selectedDays.includes(day)
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={classNames(
                  'inline-flex h-9 min-w-11 items-center justify-center rounded-full border px-3 text-[13px] font-semibold transition',
                  isSelected
                    ? 'border-tc-brand-deep bg-tc-brand-deep text-white'
                    : 'border-tc-brand-control bg-white text-tc-brand-ink hover:bg-tc-brand-soft',
                )}
              >
                {day}
              </button>
            )
          })}
        </div>

        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium text-tc-brand-ink">
            Open time
            <input
              type="time"
              value={openTime}
              onChange={(event) => setOpenTime(event.currentTarget.value)}
              className="h-11 rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink outline-none placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:ring-2 focus:ring-tc-brand-mint"
            />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-tc-brand-ink">
            Close time
            <input
              type="time"
              value={closeTime}
              onChange={(event) => setCloseTime(event.currentTarget.value)}
              className="h-11 rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink outline-none placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:ring-2 focus:ring-tc-brand-mint"
            />
          </label>
        </div>
      </section>

      <section className="border-t border-tc-brand-line pt-4">
        <h3 className="text-sm font-semibold text-tc-brand-ink">Acceptable categories</h3>
        <p className="mt-0.5 text-[13px] leading-5 text-tc-brand-body">Select default categories and add custom ones.</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {categoryOptions.map((category) => {
            const isSelected = selectedCategories.includes(category)
            return (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                className={classNames(
                  'inline-flex h-9 items-center rounded-full border px-3.5 text-[13px] font-semibold transition',
                  isSelected
                    ? 'border-tc-brand-deep bg-tc-brand-deep text-white'
                    : 'border-tc-brand-control bg-white text-tc-brand-ink hover:bg-tc-brand-soft',
                )}
              >
                {category}
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={customCategory}
            onChange={(event) => setCustomCategory(event.currentTarget.value)}
            className="h-11 min-w-0 flex-1 rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink outline-none placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:ring-2 focus:ring-tc-brand-mint"
            placeholder="Add custom category"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addCustomCategory()
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            className="h-11 px-4 text-sm font-semibold"
            onClick={addCustomCategory}
          >
            <Plus size={14} />
            Add
          </Button>
        </div>

        {selectedCategories.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedCategories.map((category) => (
              <span
                key={category}
                className="inline-flex items-center gap-1 rounded-full bg-tc-brand-mintSoft py-1 pl-2.5 pr-1.5 text-xs font-semibold text-tc-brand-deep"
              >
                {category}
                <button
                  type="button"
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full text-tc-brand-deep hover:bg-tc-brand-mintLine"
                  onClick={() => toggleCategory(category)}
                  aria-label={`Remove ${category}`}
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        ) : null}
      </section>

      {validationError ? (
        <p className="rounded-tc-md border border-tc-brand-dangerLine bg-tc-brand-dangerSoft px-4 py-3 text-sm text-tc-brand-danger">
          {validationError}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2.5 border-t border-tc-brand-line pt-4">
        {onCancel ? (
          <Button type="button" variant="secondary" className="h-11 px-5 text-sm font-semibold" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" variant="primary" className="h-11 px-5 text-sm font-semibold" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
