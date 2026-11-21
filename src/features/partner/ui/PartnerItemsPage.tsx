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
    return 'bg-tc-brand-mintSoft text-tc-brand-ink'
  }

  if (normalized.includes('awaiting_collection') || normalized.includes('approved')) {
    return 'bg-tc-brand-mintSoft text-tc-brand-ink'
  }

  if (normalized.includes('complete') || normalized.includes('collected')) {
    return 'bg-tc-brand-deep text-white'
  }

  if (normalized.includes('active')) {
    return 'bg-tc-brand-mint text-tc-brand-onMint'
  }

  return 'bg-tc-brand-soft text-tc-brand-body'
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold leading-9 tracking-[-0.02em] text-tc-brand-ink">Partner Items</h1>
          <p className="mt-1 text-base leading-6 text-tc-brand-body">Monitor all items flowing through your partner shops.</p>
        </div>
      </div>

      <div className="rounded-tc-lg border border-tc-brand-line bg-white p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="grid gap-1.5 text-sm font-medium text-tc-brand-ink">
            Status
            <CustomSelect
              value={filters.status}
              options={statusOptions}
              onChange={setStatusFilter}
              buttonClassName="h-11 rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink outline-none focus:border-tc-brand-deep focus:ring-2 focus:ring-tc-brand-mint"
            />
          </label>

          <label className="grid gap-1.5 text-sm font-medium text-tc-brand-ink">
            Pickup option
            <CustomSelect
              value={filters.pickupOption}
              options={pickupOptions}
              onChange={setPickupOptionFilter}
              buttonClassName="h-11 rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink outline-none focus:border-tc-brand-deep focus:ring-2 focus:ring-tc-brand-mint"
            />
          </label>

          <div className="grid gap-1.5 text-sm font-medium text-tc-brand-ink">
            Total
            <div className="flex h-11 items-center rounded-tc-md bg-tc-brand-soft px-3.5 text-sm font-semibold text-tc-brand-ink">
              {pagination.total} item{pagination.total === 1 ? '' : 's'}
            </div>
          </div>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-tc-md border border-tc-brand-dangerLine bg-tc-brand-dangerSoft px-4 py-3 text-sm text-tc-brand-danger">
          <AlertCircle size={16} />
          {error}
        </div>
      ) : null}

      <section className="overflow-hidden rounded-tc-lg border border-tc-brand-line bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b border-tc-brand-line text-xs uppercase tracking-wide text-tc-brand-muted">
                <th className="min-w-[240px] whitespace-nowrap px-4 py-3 font-semibold">Item</th>
                <th className="min-w-[180px] whitespace-nowrap px-4 py-3 font-semibold">Shop</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Category</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Pickup</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Status</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Collector</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-tc-brand-body">
                    Loading items...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-tc-brand-body">
                    No items match this filter.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-b border-tc-brand-line text-sm text-tc-brand-ink last:border-b-0">
                    <td className="px-4 py-3.5">
                      <div>
                        <p className="font-medium text-tc-brand-ink">{item.title}</p>
                        <p className="text-xs leading-4 text-tc-brand-muted">{item.id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">{item.shopName ?? '-'}</td>
                    <td className="px-4 py-3.5">{item.category}</td>
                    <td className="px-4 py-3.5">{toTitleCase(item.pickupOption)}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${activityStatusClassName(item.claimStatus ?? item.status)}`}
                      >
                        {toTitleCase(item.claimStatus ?? item.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {item.collectorName ? (
                        <div className="space-y-1">
                          <p className="font-medium text-tc-brand-ink">{item.collectorName}</p>
                          <p className="text-xs leading-4 text-tc-brand-muted">
                            Approved at: {formatDateTime(item.claimApprovedAt)}
                          </p>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3.5">{formatDate(item.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && pagination.totalPages > 1 ? (
          <div className="border-t border-tc-brand-line px-4 py-3">
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
