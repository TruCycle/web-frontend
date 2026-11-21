import { CustomSelect } from '@/shared/ui/select'
import { foundItemCategories } from '../../types'
import type { FoundItemsFilter } from '../../types'

interface FoundItemsFilterBarProps {
  readonly filters: FoundItemsFilter
  readonly onUpdate: (updates: Partial<FoundItemsFilter>) => void
}

export function FoundItemsFilterBar({ filters, onUpdate }: FoundItemsFilterBarProps) {
  const categoryOptions = [
    { value: '', label: 'All' },
    ...foundItemCategories.map((category) => ({
      value: category,
      label: category,
    })),
  ]
  const sortOptions = [
    { value: 'newest', label: 'Newest' },
    { value: 'nearest', label: 'Nearest' },
    { value: 'popular', label: 'Popular' },
  ]
  const distanceOptions = [
    { value: '2', label: '2 km' },
    { value: '5', label: '5 km' },
    { value: '10', label: '10 km' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <label className="space-y-1.5">
        <span className="block text-sm font-semibold text-tc-brand-ink">Category</span>
        <CustomSelect
          value={filters.category ?? ''}
          options={categoryOptions}
          onChange={(value) => {
            onUpdate({ category: value === '' ? undefined : (value as FoundItemsFilter['category']) })
          }}
          buttonClassName="h-11 w-full rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink"
        />
      </label>

      <label className="space-y-1.5">
        <span className="block text-sm font-semibold text-tc-brand-ink">Sort</span>
        <CustomSelect
          value={filters.sortBy ?? 'newest'}
          options={sortOptions}
          onChange={(value) => {
            onUpdate({ sortBy: value as FoundItemsFilter['sortBy'] })
          }}
          buttonClassName="h-11 w-full rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink"
        />
      </label>

      <label className="space-y-1.5">
        <span className="block text-sm font-semibold text-tc-brand-ink">Distance</span>
        <CustomSelect
          value={String(filters.maxDistance ?? 5)}
          options={distanceOptions}
          onChange={(value) => {
            onUpdate({ maxDistance: Number(value) })
          }}
          buttonClassName="h-11 w-full rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink"
        />
      </label>

      <label className="space-y-1.5">
        <span className="block text-sm font-semibold text-tc-brand-ink">Postcode</span>
        <input
          className="min-h-11 w-full rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:outline-none focus:ring-2 focus:ring-tc-brand-mint"
          placeholder="Near you"
          type="text"
          value={filters.postcode ?? ''}
          onChange={(event) => {
            onUpdate({ postcode: event.target.value || undefined })
          }}
        />
      </label>
    </div>
  )
}
