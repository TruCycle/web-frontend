import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/shared/ui/button/Button'
import collectedItemsIcon from '@/assets/icons/collected-items-icon.svg'
import exchangeIcon from '@/assets/icons/exchange-icon.svg'
import sizeIcon from '@/assets/icons/size-icon.svg'
import rewardIcon from '@/assets/icons/reward-icon.svg'
import { SuccessDialog } from '@/shared/ui/modal/SuccessDialog'
import { ListItemDialog } from '@/shared/ui/modal/ListItemDialog'
import { useUserRole } from '@/shared/context/useUserRole'
import { useCollectorDashboard } from '@/features/home/hooks/useCollectorDashboard'
import { useDonorListings } from '@/features/listings/hooks/useDonorListings'
import { useToast } from '@/shared/ui/toast/useToast'
import { useAuthSession } from '@/shared/context/useAuthSession'

function statColor(index: number): string {
  if (index === 0) return 'bg-lime-100'
  if (index === 1) return 'bg-sky-100'
  if (index === 2) return 'bg-emerald-100'
  return 'bg-amber-100'
}

export default function Dashboard() {
  const location = useLocation()
  const { success, error } = useToast()
  const { user } = useAuthSession()
  const { role } = useUserRole()
  const isDonorMode = role === 'donor'
  const showStats = location.pathname === '/' || location.pathname === '/dashboard'
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)
  const [isListItemDialogOpen, setIsListItemDialogOpen] = useState(false)
  const {
    filters,
    items,
    categories,
    stats,
    isLoadingItems,
    isLoadingStats,
    isClaimingItemId,
    error: collectorError,
    updateSearch,
    updateCategory,
    claimItem,
  } = useCollectorDashboard(!isDonorMode, user?.postcode)
  const {
    listings: donorListings,
    summary: donorSummary,
    isLoading: isLoadingDonorListings,
    error: donorError,
    removingId,
    removeListing,
  } = useDonorListings(isDonorMode)

  const handleClaimItem = async (itemId: string) => {
    try {
      await claimItem(itemId)
      setIsSuccessOpen(true)
      success('Claim request submitted', 'Your request has been sent to the donor.')
    } catch {
      error('Claim failed', 'Please try again in a moment.')
    }
  }

  const donorCo2Saved = useMemo(
    () =>
      donorListings.reduce((total, listing) => total + (listing.co2SavedKg ?? 0), 0),
    [donorListings],
  )
  const dashboardStats = isDonorMode
    ? {
        itemsCollected: donorListings.length,
        itemsExchanged: donorSummary.completed,
        totalCo2SavedKg: donorCo2Saved,
        rewardsEarned: donorSummary.claimed,
        rewardsCurrency: 'CLM',
      }
    : stats
  const shouldShowStatsLoading = isDonorMode ? isLoadingDonorListings : isLoadingStats

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back!</h1>
          <p className="text-slate-500">Track your impact and manage your listings</p>
        </div>
        {isDonorMode ? (
          <Button
            className="inline-flex items-center gap-2"
            onClick={() => setIsListItemDialogOpen(true)}
          >
            <Plus size={18} />
            List New Item
          </Button>
        ) : null}
      </div>

      {showStats ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              value: shouldShowStatsLoading ? '-' : String(dashboardStats.itemsCollected),
              label: isDonorMode ? 'Items Listed' : 'Items Collected',
              icon: collectedItemsIcon,
            },
            {
              value: shouldShowStatsLoading ? '-' : String(dashboardStats.itemsExchanged),
              label: 'Exchanged',
              icon: exchangeIcon,
            },
            {
              value: shouldShowStatsLoading
                ? '-'
                : `${dashboardStats.totalCo2SavedKg.toFixed(1)}kg`,
              label: 'CO2 Saved',
              icon: sizeIcon,
            },
            {
              value: shouldShowStatsLoading
                ? '-'
                : `${dashboardStats.rewardsCurrency} ${dashboardStats.rewardsEarned.toFixed(0)}`,
              label: 'Rewards Earned',
              icon: rewardIcon,
            },
          ].map((item, index) => (
            <div
              key={item.label}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div
                className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${statColor(index)}`}
              >
                <img src={item.icon} alt="" aria-hidden className="h-5 w-5" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{item.value}</p>
              <p className="text-sm text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      ) : null}

      {isDonorMode && showStats ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Your Listings</h2>
            <Link
              to="/listings"
              className="inline-flex items-center gap-1 text-sm font-medium text-tc-auth-link hover:underline"
            >
              View All <ChevronRight size={16} />
            </Link>
          </div>
          {donorError ? <p className="mb-2 text-sm text-rose-600">{donorError}</p> : null}
          {isLoadingDonorListings ? (
            <p className="rounded-xl border border-slate-200 p-3 text-sm text-slate-500">
              Loading your listings...
            </p>
          ) : null}
          {!isLoadingDonorListings && donorListings.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-500">
              You have not listed any items yet.
            </p>
          ) : null}
          <div className="space-y-2">
            {donorListings.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
              >
                <div className="flex items-center gap-3">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-14 w-14 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-[11px] text-slate-500">
                      No image
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{item.title}</h3>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          item.status === 'Active'
                            ? 'bg-lime-100 text-lime-700'
                            : item.status === 'Claimed'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-sky-100 text-sky-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">
                      {item.category} - Condition: {item.condition} - {item.meta}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary">View</Button>
                  <Button
                    variant="secondary"
                    disabled={removingId === item.id}
                    onClick={() => {
                      void removeListing(item.id)
                    }}
                    className="text-rose-600 ring-rose-200 hover:bg-rose-50 hover:text-rose-700"
                  >
                    {removingId === item.id ? 'Removing...' : 'Remove'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {!isDonorMode ? (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Browse Available Items</h2>
          </div>

          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by category, location or keyword"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
              value={filters.search}
              onChange={(event) => updateSearch(event.target.value)}
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => (
              <button
                key={category}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  category === filters.category
                    ? 'bg-lime-100 text-slate-900'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                onClick={() => updateCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {collectorError ? <p className="text-sm text-rose-600">{collectorError}</p> : null}

          {isLoadingItems ? (
            <p className="rounded-xl border border-slate-200 p-4 text-sm text-slate-500">
              Loading available items...
            </p>
          ) : null}

          {!isLoadingItems && items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
              No matching items found right now.
            </p>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => {
              const claimInProgress = isClaimingItemId === item.id
              const claimAlreadyCreated = Boolean(item.claimStatus)

              return (
                <div key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {item.image ? (
                    <img src={item.image.url} alt={item.title} className="h-44 w-full object-cover" />
                  ) : (
                    <div className="flex h-44 w-full items-center justify-center bg-slate-100 text-sm text-slate-500">
                      No image available
                    </div>
                  )}
                  <div className="space-y-2 p-3">
                    <h3 className="font-semibold text-slate-900">{item.title}</h3>
                    <div className="flex gap-2">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        {item.category}
                      </span>
                      <span className="rounded-full bg-lime-100 px-2 py-0.5 text-xs font-semibold text-lime-700">
                        {item.condition}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{item.locationLabel}</p>
                    <p className="text-xs text-slate-500">From {item.ownerName}</p>
                    <div className="flex gap-2 pt-1">
                      <Button
                        className="flex-1"
                        disabled={claimInProgress || claimAlreadyCreated}
                        onClick={() => {
                          void handleClaimItem(item.id)
                        }}
                      >
                        {claimAlreadyCreated
                          ? 'Claim Requested'
                          : claimInProgress
                            ? 'Requesting...'
                            : 'Request a Claim'}
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}

      <SuccessDialog isOpen={isSuccessOpen} onClose={() => setIsSuccessOpen(false)} />
      <ListItemDialog isOpen={isListItemDialogOpen} onClose={() => setIsListItemDialogOpen(false)} />
    </div>
  )
}
