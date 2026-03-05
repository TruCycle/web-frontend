import { type FormEvent, useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Button } from '@/shared/ui/button/Button'
import type { CreatePartnerShopPayload, PartnerShop } from '@/features/partner/types'
import { classNames } from '@/shared/utils/classNames'

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

    const normalizedName = name.trim()
    const normalizedAddressLine = addressLine.trim()
    const normalizedPostcode = postcode.trim()

    if (!normalizedName || !normalizedAddressLine || !normalizedPostcode) {
      setValidationError('Shop name, address line, and postcode are required.')
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
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Shop name
          <input
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
            placeholder="Enter shop name"
            required
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Postcode
          <input
            value={postcode}
            onChange={(event) => setPostcode(event.currentTarget.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
            placeholder="SW1A 1AA"
            required
          />
        </label>
      </div>

      <label className="grid gap-1 text-sm font-medium text-slate-700">
        Address line
        <input
          value={addressLine}
          onChange={(event) => setAddressLine(event.currentTarget.value)}
          className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
          placeholder="Street address or landmark"
          required
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Phone number
          <input
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.currentTarget.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
            placeholder="+44 20 7946 0958"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Operational notes
          <input
            value={operationalNotes}
            onChange={(event) => setOperationalNotes(event.currentTarget.value)}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
            placeholder="Pickup instructions"
          />
        </label>
      </div>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-800">Opening hours</h3>
        <p className="mt-1 text-xs text-slate-500">Choose days and time window for this shop.</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {dayOptions.map((day) => {
            const isSelected = selectedDays.includes(day)
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={classNames(
                  'inline-flex h-9 min-w-11 items-center justify-center rounded-lg border px-3 text-sm font-medium transition',
                  isSelected
                    ? 'border-lime-500 bg-lime-100 text-lime-800'
                    : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100',
                )}
              >
                {day}
              </button>
            )
          })}
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Open time
            <input
              type="time"
              value={openTime}
              onChange={(event) => setOpenTime(event.currentTarget.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
            />
          </label>
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Close time
            <input
              type="time"
              value={closeTime}
              onChange={(event) => setCloseTime(event.currentTarget.value)}
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-800">Acceptable categories</h3>
        <p className="mt-1 text-xs text-slate-500">Select default categories and add custom ones.</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {categoryOptions.map((category) => {
            const isSelected = selectedCategories.includes(category)
            return (
              <button
                key={category}
                type="button"
                onClick={() => toggleCategory(category)}
                className={classNames(
                  'inline-flex h-9 items-center rounded-lg border px-3 text-sm font-medium transition',
                  isSelected
                    ? 'border-lime-500 bg-lime-100 text-lime-800'
                    : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100',
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
            className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
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
            className="h-10 rounded-xl px-4"
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
                className="inline-flex items-center gap-1 rounded-full border border-lime-200 bg-lime-50 px-3 py-1 text-xs font-medium text-lime-800"
              >
                {category}
                <button
                  type="button"
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full text-lime-700 hover:bg-lime-200"
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
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {validationError}
        </p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="secondary" className="h-11 rounded-xl px-5" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" variant="primary" className="h-11 rounded-xl px-5" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
