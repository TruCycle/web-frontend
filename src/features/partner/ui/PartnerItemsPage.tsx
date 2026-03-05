import { AlertCircle } from 'lucide-react'
import { usePartnerItems } from '@/features/partner/hooks/usePartnerItems'
import { PaginationControls } from '@/shared/ui/pagination/PaginationControls'
import { CustomSelect } from '@/shared/ui/select'

const statusOptions = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending_dropoff', label: 'Pending drop-off' },
  { value: 'awaiting_collection', label: 'Awaiting collection' },
  { value: 'complete', label: 'Completed' },
  { value: 'recycled', label: 'Recycled' },
]

const pickupOptions = [
  { value: 'all', label: 'All pickup options' },
  { value: 'donate', label: 'Donate' },
  { value: 'recycle', label: 'Recycle' },
]

function formatDate(value: string | null): string {
  if (!value) {
    return '-'
  }

  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) {
    return '-'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp))
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return '-'
  }

  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) {
    return '-'
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

function toTitleCase(value: string): string {
  return value
    .replace(/_/g, ' ')
    .split(' ')
    .filter((part) => part.length > 0)
    .map((part) => part[0].toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

function activityStatusClassName(status: string): string {
  const normalized = status.toLowerCase()

  if (normalized.includes('pending_dropoff')) {
    return 'bg-amber-50 text-amber-600'
  }

  if (normalized.includes('awaiting_collection') || normalized.includes('approved')) {
    return 'bg-violet-50 text-violet-600'
  }

  if (normalized.includes('complete') || normalized.includes('collected')) {
    return 'bg-emerald-50 text-emerald-600'
  }

  if (normalized.includes('active')) {
    return 'bg-sky-50 text-sky-600'
  }

  return 'bg-slate-100 text-slate-600'
}

export default function PartnerItemsPage() {
  const {
    items,
    isLoading,
    error,
    filters,
    setStatusFilter,
    setPickupOptionFilter,
    pagination,
    currentPage,
    totalPages,
    canGoPrevious,
    canGoNext,
    goToPage,
    previousPage,
    nextPage,
  } = usePartnerItems(10)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Partner Items</h1>
          <p className="text-slate-500">Monitor all items flowing through your partner shops.</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Status
            <CustomSelect
              value={filters.status}
              options={statusOptions}
              onChange={setStatusFilter}
              buttonClassName="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
            />
          </label>

          <label className="grid gap-1 text-sm font-medium text-slate-700">
            Pickup option
            <CustomSelect
              value={filters.pickupOption}
              options={pickupOptions}
              onChange={setPickupOptionFilter}
              buttonClassName="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
            />
          </label>

          <div className="grid gap-1 text-sm font-medium text-slate-700">
            Total
            <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
              {pagination.total} item{pagination.total === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={16} />
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-sm text-slate-500">
                <th className="px-6 py-4 font-medium">Item</th>
                <th className="px-6 py-4 font-medium">Shop</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Pickup</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Collector</th>
                <th className="px-6 py-4 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                    Loading items...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-slate-500">
                    No items match this filter.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 text-sm text-slate-700">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.id}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">{item.shopName ?? '-'}</td>
                    <td className="px-6 py-4">{item.category}</td>
                    <td className="px-6 py-4">{toTitleCase(item.pickupOption)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${activityStatusClassName(item.claimStatus ?? item.status)}`}
                      >
                        {toTitleCase(item.claimStatus ?? item.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {item.collectorName ? (
                        <div className="space-y-1">
                          <p className="font-medium text-slate-900">{item.collectorName}</p>
                          <p className="text-xs text-slate-500">
                            Approved at: {formatDateTime(item.claimApprovedAt)}
                          </p>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4">{formatDate(item.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && pagination.totalPages > 1 ? (
          <div className="border-t border-slate-200 px-6 py-3">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              onPrevious={previousPage}
              onNext={nextPage}
              canGoPrevious={canGoPrevious}
              canGoNext={canGoNext}
            />
          </div>
        ) : null}
      </section>
    </div>
  )
}
