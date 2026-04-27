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
    <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-4">
      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Category</span>
        <CustomSelect
          value={filters.category ?? ''}
          options={categoryOptions}
          onChange={(value) => {
            onUpdate({ category: value === '' ? undefined : (value as FoundItemsFilter['category']) })
          }}
          buttonClassName="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
        />
      </label>

      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Sort</span>
        <CustomSelect
          value={filters.sortBy ?? 'newest'}
          options={sortOptions}
          onChange={(value) => {
            onUpdate({ sortBy: value as FoundItemsFilter['sortBy'] })
          }}
          buttonClassName="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
        />
      </label>

      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Distance</span>
        <CustomSelect
          value={String(filters.maxDistance ?? 5)}
          options={distanceOptions}
          onChange={(value) => {
            onUpdate({ maxDistance: Number(value) })
          }}
          buttonClassName="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
        />
      </label>

      <label className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Postcode</span>
        <input
          className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
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
