import { useMemo, useState } from 'react'
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

export default function PartnerConsolePage() {
  const [isScanDialogOpen, setIsScanDialogOpen] = useState(false)
  const { stats, recentItems, isLoading, error, reload } = usePartnerDashboard()

  const scanShopName = useMemo(() => {
    const firstShopWithName = recentItems.find((item) => item.shopName)?.shopName
    return firstShopWithName ?? 'My Partner Shop'
  }, [recentItems])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-tc-header-text">Partner Dashboard</h1>
          <p className="text-tc-header-labelText">Track shop activity and item handoff progress</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            className="h-[42px] w-[42px] rounded-xl p-0"
            onClick={() => void reload()}
            disabled={isLoading}
            aria-label="Refresh dashboard"
            title="Refresh dashboard"
          >
            <RefreshCw size={18} />
          </Button>
          <Button
            variant="highlight"
            className="h-[42px] rounded-xl px-6 text-sm font-semibold"
            onClick={() => setIsScanDialogOpen(true)}
          >
            Start Scan
          </Button>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={16} />
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl bg-white p-5">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#2FC7491A] text-[#2FC749]">
            <PackageCheck size={20} />
          </span>
          <div>
            <p className="text-3xl font-semibold text-tc-header-text">{stats.activeItems}</p>
            <p className="text-sm text-tc-header-labelText">Active Listings</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-white p-5">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#2FC7491A] text-[#2FC749]">
            <ScanLine size={20} />
          </span>
          <div>
            <p className="text-3xl font-semibold text-tc-header-text">{stats.pendingDropOffs}</p>
            <p className="text-sm text-tc-header-labelText">Pending Drop-offs</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-white p-5">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#2FC7491A] text-[#2FC749]">
            <Heart size={20} />
          </span>
          <div>
            <p className="text-3xl font-semibold text-tc-header-text">{stats.awaitingCollection}</p>
            <p className="text-sm text-tc-header-labelText">Awaiting Collection</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-white p-5">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#2FC7491A] text-[#2FC749]">
            <ShoppingBag size={20} />
          </span>
          <div>
            <p className="text-3xl font-semibold text-tc-header-text">{stats.averageItemsPerShop}</p>
            <p className="text-sm text-tc-header-labelText">Avg Items Per Shop</p>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h2 className="text-2xl font-semibold text-tc-app-secondary">Recent Activity</h2>
          <p className="text-sm text-tc-header-labelText">
            {stats.totalItems} total item{stats.totalItems === 1 ? '' : 's'} across {stats.totalShops}{' '}
            shop{stats.totalShops === 1 ? '' : 's'}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-sm text-tc-header-labelText">
                <th className="px-6 py-4 font-medium">Item Name</th>
                <th className="px-6 py-4 font-medium">Date Listed</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Date Collected</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                    Loading recent activity...
                  </td>
                </tr>
              ) : recentItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">
                    No partner activity yet.
                  </td>
                </tr>
              ) : (
                recentItems.map((item) => {
                  const statusText = toTitleCase(item.claimStatus ?? item.status)
                  return (
                    <tr key={item.id} className="border-b border-slate-100 text-sm text-tc-app-secondary">
                      <td className="px-6 py-5">{item.title}</td>
                      <td className="px-6 py-5">{formatDate(item.createdAt)}</td>
                      <td className="px-6 py-5">{item.category}</td>
                      <td className="px-6 py-5">{formatDate(item.claimCompletedAt)}</td>
                      <td className="px-6 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${activityStatusClassName(item.claimStatus ?? item.status)}`}
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
        shopName={scanShopName}
      />
    </div>
  )
}
