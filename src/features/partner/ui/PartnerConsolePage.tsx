import { useState } from 'react'
import { AlertCircle, Heart, PackageCheck, RefreshCw, ScanLine, ShoppingBag } from 'lucide-react'
import { PartnerScanDialog } from '@/features/partner/ui/components/PartnerScanDialog'
import { usePartnerDashboard } from '@/features/partner/hooks/usePartnerDashboard'
import { Button } from '@/shared/ui/button/Button'

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

export default function PartnerConsolePage() {
  const [isScanDialogOpen, setIsScanDialogOpen] = useState(false)
  const { shops, stats, recentItems, isLoading, error, reload } = usePartnerDashboard()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold leading-9 tracking-[-0.02em] text-tc-brand-ink">Partner Dashboard</h1>
          <p className="mt-1 text-base leading-6 text-tc-brand-body">Track shop activity and item handoff progress</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="h-11 w-11 p-0"
            onClick={() => void reload()}
            disabled={isLoading}
            aria-label="Refresh dashboard"
            title="Refresh dashboard"
          >
            <RefreshCw size={18} />
          </Button>
          <Button
            variant="primary"
            className="h-11 px-5 text-sm font-semibold"
            onClick={() => setIsScanDialogOpen(true)}
          >
            Start Scan
          </Button>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-tc-md border border-tc-brand-dangerLine bg-tc-brand-dangerSoft px-4 py-3 text-sm text-tc-brand-danger">
          <AlertCircle size={16} />
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-3.5 rounded-tc-lg border border-tc-brand-line bg-white p-5">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tc-brand-mintSoft text-tc-brand-deep">
            <PackageCheck size={20} />
          </span>
          <div>
            <p className="text-2xl font-semibold leading-7 tracking-[-0.02em] tabular-nums text-tc-brand-ink">{stats.activeItems}</p>
            <p className="text-sm leading-5 text-tc-brand-body">Active Listings</p>
          </div>
        </div>
        <div className="flex items-center gap-3.5 rounded-tc-lg border border-tc-brand-line bg-white p-5">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tc-brand-mintSoft text-tc-brand-deep">
            <ScanLine size={20} />
          </span>
          <div>
            <p className="text-2xl font-semibold leading-7 tracking-[-0.02em] tabular-nums text-tc-brand-ink">{stats.pendingDropOffs}</p>
            <p className="text-sm leading-5 text-tc-brand-body">Pending Drop-offs</p>
          </div>
        </div>
        <div className="flex items-center gap-3.5 rounded-tc-lg border border-tc-brand-line bg-white p-5">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tc-brand-mintSoft text-tc-brand-deep">
            <Heart size={20} />
          </span>
          <div>
            <p className="text-2xl font-semibold leading-7 tracking-[-0.02em] tabular-nums text-tc-brand-ink">{stats.awaitingCollection}</p>
            <p className="text-sm leading-5 text-tc-brand-body">Awaiting Collection</p>
          </div>
        </div>
        <div className="flex items-center gap-3.5 rounded-tc-lg border border-tc-brand-line bg-white p-5">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-tc-brand-mintSoft text-tc-brand-deep">
            <ShoppingBag size={20} />
          </span>
          <div>
            <p className="text-2xl font-semibold leading-7 tracking-[-0.02em] tabular-nums text-tc-brand-ink">{stats.averageItemsPerShop}</p>
            <p className="text-sm leading-5 text-tc-brand-body">Avg Items Per Shop</p>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-tc-lg border border-tc-brand-line bg-white">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pb-2 pt-5">
          <h2 className="text-lg font-semibold leading-6 text-tc-brand-ink">Recent Activity</h2>
          <p className="text-[13px] leading-5 text-tc-brand-muted">
            {stats.totalItems} total item{stats.totalItems === 1 ? '' : 's'} across {stats.totalShops}{' '}
            shop{stats.totalShops === 1 ? '' : 's'}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-tc-brand-line text-xs uppercase tracking-wide text-tc-brand-muted">
                <th className="min-w-[220px] whitespace-nowrap px-4 py-3 font-semibold">Item Name</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Date Listed</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Category</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Date Collected</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-tc-brand-body">
                    Loading recent activity...
                  </td>
                </tr>
              ) : recentItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-sm text-tc-brand-body">
                    No partner activity yet.
                  </td>
                </tr>
              ) : (
                recentItems.map((item) => {
                  const statusText = toTitleCase(item.claimStatus ?? item.status)
                  return (
                    <tr key={item.id} className="border-b border-tc-brand-line text-sm text-tc-brand-ink last:border-b-0">
                      <td className="px-4 py-3.5">{item.title}</td>
                      <td className="px-4 py-3.5">{formatDate(item.createdAt)}</td>
                      <td className="px-4 py-3.5">{item.category}</td>
                      <td className="px-4 py-3.5">{formatDate(item.claimCompletedAt)}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${activityStatusClassName(item.claimStatus ?? item.status)}`}
                        >
                          {statusText}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <PartnerScanDialog
        isOpen={isScanDialogOpen}
        onClose={() => setIsScanDialogOpen(false)}
        shops={shops}
      />
    </div>
  )
}
