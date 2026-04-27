import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search, ChevronRight, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/shared/ui/button/Button'
import collectedItemsIcon from '@/assets/icons/collected-items-icon.svg'
import exchangeIcon from '@/assets/icons/exchange-icon.svg'
import sizeIcon from '@/assets/icons/size-icon.svg'
import rewardIcon from '@/assets/icons/reward-icon.svg'
import { DonorEnvironmentalImpactCard } from '@/features/home/ui/components/DonorEnvironmentalImpactCard'
import { SuccessDialog } from '@/shared/ui/modal/SuccessDialog'
import { ListItemDialog } from '@/shared/ui/modal/ListItemDialog'
import { ItemDetailsDialog } from '@/shared/ui/modal/ItemDetailsDialog'
import { ItemQrCodeDialog } from '@/shared/ui/modal/ItemQrCodeDialog'
import { CustomSelect } from '@/shared/ui/select'
import { useUserRole } from '@/shared/context/useUserRole'
import { useCollectorDashboard } from '@/features/home/hooks/useCollectorDashboard'
import { useDonorListings } from '@/features/listings/hooks/useDonorListings'
import { ListingsLoadingState } from '@/features/listings/ui/components/ListingsLoadingState'
import { ListingRow } from '@/features/listings/ui/components/ListingRow'
import { ListingOffcanvas } from '@/features/listings/ui/components/ListingOffcanvas'
import { useToast } from '@/shared/ui/toast/useToast'
import { useAuthSession } from '@/shared/context/useAuthSession'
import type { BrowseItem } from '@/features/items/types'
import type { DonorListingItem } from '@/features/listings/types'
import { NewItemButton } from '@/shared/ui/button/NewItemButton'
import { useUserProgress } from '@/features/gamification/hooks/useUserProgress'
import { useStreaks } from '@/features/gamification/hooks/useStreaks'
import { useBadges } from '@/features/gamification/hooks/useBadges'
import { LevelBadge } from '@/features/gamification/ui/components/LevelBadge'
import { ProgressBar } from '@/features/gamification/ui/components/ProgressBar'
import { StreakIndicator } from '@/features/gamification/ui/components/StreakIndicator'
import { useFoundItems } from '@/features/found-items/hooks/useFoundItems'
import { FoundItemStatusBadge } from '@/features/found-items/ui/components/FoundItemStatusBadge'
import { formatRelativeTime } from '@/shared/utils/formatRelativeTime'

function statColor(index: number): string {
  if (index === 0) return 'bg-tc-app-primary/10'
  if (index === 1) return 'bg-tc-app-primary/25'
  if (index === 2) return 'bg-tc-app-primary/10'
  return 'bg-tc-app-primary/25'
}

export default function Dashboard() {
  const location = useLocation()
  const { success, error } = useToast()
  const { user } = useAuthSession()
  const { role } = useUserRole()
  const isDonorMode = role === 'donor'
  const showStats = location.pathname === '/dashboard'
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)
  const [isListItemDialogOpen, setIsListItemDialogOpen] = useState(false)
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [selectedBrowseItem, setSelectedBrowseItem] = useState<BrowseItem | null>(null)
  const [selectedDonorListing, setSelectedDonorListing] = useState<DonorListingItem | null>(null)
  const [selectedDonorQrListing, setSelectedDonorQrListing] = useState<DonorListingItem | null>(null)
  const {
    filters,
    items,
    categories,
    conditions,
    stats,
    isLoadingItems,
    isLoadingStats,
    isClaimingItemId,
    error: collectorError,
    updateSearch,
    updateCategory,
    updateCondition,
    updateLocation,
    clearFilters,
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
  const {
    progress: userProgress,
    isLoading: isLoadingProgress,
  } = useUserProgress()
  const {
    primaryStreak,
  } = useStreaks()
  const {
    earnedBadges,
    isLoading: isLoadingBadges,
  } = useBadges('earned')
  const {
    items: foundItems,
    isLoading: isLoadingFoundItems,
  } = useFoundItems({
    status: 'available',
    sortBy: 'nearest',
    maxDistance: 5,
  })

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
      rewardsCurrency: '£',
    }
    : stats
  const shouldShowStatsLoading = isDonorMode ? isLoadingDonorListings : isLoadingStats
  const categoryFilterOptions = useMemo(
    () => [
      { value: 'All Items', label: 'All categories' },
      ...categories
        .filter((category) => category.trim().length > 0 && category !== 'All Items')
        .map((category) => ({ value: category, label: category })),
    ],
    [categories],
  )
  const conditionFilterOptions = useMemo(
    () => [
      { value: 'All condition', label: 'All condition' },
      ...conditions
        .filter((condition) => condition.trim().length > 0 && condition !== 'All condition')
        .map((condition) => ({ value: condition, label: condition })),
    ],
    [conditions],
  )
  const selectedCategoryFilterValue = categoryFilterOptions.some(
    (option) => option.value === filters.category,
  )
    ? filters.category
    : 'All Items'
  const selectedConditionFilterValue = conditionFilterOptions.some(
    (option) => option.value === filters.condition,
  )
    ? filters.condition
    : 'All condition'

  const shouldShowDonorListingQrAction = (item: DonorListingItem): boolean => {
    if (!item.qrCode) {
      return false
    }

    const normalizedPickupOption = item.pickupOption.toLowerCase()
    const hasApprovedClaim =
      item.claims.some((claim) => claim.status.toLowerCase() === 'approved') ||
      item.claimStatus?.toLowerCase() === 'approved'
    const isNonActive = item.status !== 'Active'

    if (normalizedPickupOption === 'exchange' && hasApprovedClaim) {
      return true
    }

    if ((normalizedPickupOption === 'donate' || normalizedPickupOption === 'donor') && isNonActive) {
      return true
    }

    return false
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-tc-header-text">Welcome back!</h1>
          <p className="text-tc-header-labelText">Track your impact and manage your listings</p>
        </div>
        {isDonorMode ? (
          <NewItemButton onClick={() => setIsListItemDialogOpen(true)} />
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
              className="flex gap-5 rounded-xl bg-white p-5"
            >
              <div
                className={`inline-flex p-4 items-center justify-center rounded-full ${statColor(index)}`}
              >
                <img src={item.icon} alt="" aria-hidden className="h-5.2 w-5.2" />
              </div>
              <div>
                <p className="text-2xl font-bold text-tc-app-secondary">{item.value}</p>
                <p className="text-sm text-tc-app-secondary">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {showStats ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <section className="space-y-4 rounded-xl bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-tc-app-secondary">Achievements</h2>
                <p className="text-sm text-slate-500">Current pace</p>
              </div>
              {userProgress ? <LevelBadge progress={userProgress} /> : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#F8FAFC] p-4">
              <div>
                <p className="text-sm text-slate-500">Streak</p>
                {primaryStreak ? <StreakIndicator streak={primaryStreak} size="lg" /> : <p className="text-sm text-slate-400">-</p>}
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">Points</p>
                <p className="text-2xl font-bold text-slate-900">
                  {isLoadingProgress ? '-' : userProgress?.totalPoints ?? 0}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
                <span>Level progress</span>
                <span>{isLoadingProgress ? '-' : `${userProgress?.pointsToNextLevel ?? 0} pts left`}</span>
              </div>
              <ProgressBar value={userProgress?.levelProgressPercent ?? 0} />
            </div>

            <div className="flex flex-wrap gap-2">
              {isLoadingBadges ? (
                <p className="text-sm text-slate-500">Loading badges...</p>
              ) : (
                earnedBadges.slice(0, 3).map((entry) => (
                  <span
                    key={entry.badge.id}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700"
                  >
                    {entry.badge.name}
                  </span>
                ))
              )}
            </div>

            <Link
              to="/achievements"
              className="inline-flex items-center gap-1 text-sm font-medium text-tc-app-secondary transition hover:underline"
            >
              View All <ChevronRight size={16} />
            </Link>
          </section>

          <section className="space-y-4 rounded-xl bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-tc-app-secondary">Found Nearby</h2>
                <p className="text-sm text-slate-500">Community board</p>
              </div>
              <Link
                to="/found-items"
                className="inline-flex items-center gap-1 text-sm font-medium text-tc-app-secondary transition hover:underline"
              >
                Open <ChevronRight size={16} />
              </Link>
            </div>

            <div className="space-y-3">
              {isLoadingFoundItems ? <p className="text-sm text-slate-500">Loading board...</p> : null}
              {!isLoadingFoundItems
                ? foundItems.slice(0, 2).map((item) => (
                    <div key={item.id} className="flex gap-3 rounded-xl border border-slate-200 p-3">
                      {item.images[0] ? (
                        <img
                          src={item.images[0].thumbnailUrl || item.images[0].url}
                          alt={item.title}
                          className="h-20 w-20 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-slate-100 text-xs text-slate-500">
                          No image
                        </div>
                      )}
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-slate-900">{item.title}</p>
                            <p className="text-sm text-slate-500">{item.location.neighborhood || item.location.postcode}</p>
                          </div>
                          <FoundItemStatusBadge status={item.status} />
                        </div>
                        <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
                          <span>{formatRelativeTime(item.postedAt)}</span>
                          <span>{item.location.approximateDistance?.toFixed(1) ?? '-'} km</span>
                        </div>
                      </div>
                    </div>
                  ))
                : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/found-items/post"
                className="inline-flex items-center rounded-xl bg-tc-action-primary px-4 py-3 text-sm font-medium text-tc-action-primaryText transition hover:bg-tc-action-primaryHover"
              >
                Post Item
              </Link>
              <Link
                to="/found-items/my-posts"
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                My Posts
              </Link>
            </div>
          </section>
        </div>
      ) : null}

      {isDonorMode && showStats ? (
        <>
          <DonorEnvironmentalImpactCard />
          <section className="relative rounded-xl bg-white p-4">
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
              <ListingsLoadingState count={5} />
            ) : null}
            {!isLoadingDonorListings && donorListings.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-500">
                You have not listed any items yet.
              </p>
            ) : null}
            <div className="space-y-2">
              {!isLoadingDonorListings
                ? donorListings.slice(0, 5).map((item) => (
                  <ListingRow
                    key={item.id}
                    item={item}
                    removingId={removingId}
                    onOpenActive={setSelectedDonorListing}
                    onOpenDetails={setSelectedDonorListing}
                    onOpenQr={setSelectedDonorQrListing}
                    showQrAction={shouldShowDonorListingQrAction(item)}
                    onRemove={(listingId) => {
                      void removeListing(listingId)
                    }}
                  />
                ))
                : null}
            </div>
            <ListingOffcanvas
              key={selectedDonorListing?.id ?? 'closed'}
              isOpen={Boolean(selectedDonorListing)}
              item={selectedDonorListing}
              onClose={() => setSelectedDonorListing(null)}
            />
            <ItemQrCodeDialog
              isOpen={Boolean(selectedDonorQrListing)}
              onClose={() => setSelectedDonorQrListing(null)}
              itemTitle={selectedDonorQrListing?.title ?? 'Item'}
              qrCodeUrl={selectedDonorQrListing?.qrCode ?? null}
            />
          </section>
        </>
      ) : null}

      {!isDonorMode ? (
        <section className="space-y-4 rounded-xl bg-white px-8 py-4 text-tc-app-secondary">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-tc-app-secondary">Browse Available Items</h2>
            <Link
              to="/browse"
              className="inline-flex items-center gap-1 text-sm font-medium text-tc-app-secondary transition hover:underline"
            >
              View All <ChevronRight size={16} />
            </Link>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-[260px] flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-tc-app-secondary/70"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by category, location or keyword"
                className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-tc-app-secondary outline-none placeholder:text-tc-app-secondary/70 focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
                value={filters.search}
                onChange={(event) => updateSearch(event.target.value)}
              />
            </div>
            <button
              type="button"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 px-4 text-sm font-medium text-tc-app-secondary transition hover:bg-slate-50"
              onClick={() => {
                if (isFiltersOpen) {
                  clearFilters()
                  setIsFiltersOpen(false)
                  return
                }

                setIsFiltersOpen(true)
              }}
            >
              {isFiltersOpen ? (
                <>
                  Clear Filters
                  <X size={14} />
                </>
              ) : (
                <>
                  <SlidersHorizontal size={16} />
                  Filters
                </>
              )}
            </button>
          </div>

          {isFiltersOpen ? (
            <div className="space-y-4 rounded-xl border border-slate-200 p-4 md:p-5">
              <h3 className="text-3xl font-semibold text-tc-app-secondary">Filters</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label htmlFor="browse-filter-category" className="block text-xl text-tc-app-secondary">
                    Category
                  </label>
                  <CustomSelect
                    id="browse-filter-category"
                    value={selectedCategoryFilterValue}
                    options={categoryFilterOptions}
                    onChange={updateCategory}
                    buttonClassName="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-tc-app-secondary"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="browse-filter-condition" className="block text-xl text-tc-app-secondary">
                    Condition
                  </label>
                  <CustomSelect
                    id="browse-filter-condition"
                    value={selectedConditionFilterValue}
                    options={conditionFilterOptions}
                    onChange={updateCondition}
                    buttonClassName="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-tc-app-secondary"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="browse-filter-location" className="block text-xl text-tc-app-secondary">
                    Location
                  </label>
                  <input
                    id="browse-filter-location"
                    type="text"
                    placeholder="Enter location or postal code"
                    className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-tc-app-secondary outline-none placeholder:text-tc-app-secondary/70 focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
                    value={filters.location}
                    onChange={(event) => updateLocation(event.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex gap-2 overflow-x-auto rounded-md bg-[#E2E8F040] p-1">
            {categories.map((category) => (
              <button
                key={category}
                className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition ${category === filters.category
                    ? 'bg-white text-tc-app-text'
                    : 'bg-transparent text-tc-app-secondary hover:bg-slate-200'
                  }`}
                onClick={() => updateCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {collectorError ? <p className="text-sm text-tc-app-secondary">{collectorError}</p> : null}

          {!isLoadingItems && items.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-tc-app-secondary">
              No matching items found right now.
            </p>
          ) : null}

          {isLoadingItems ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`browse-item-shimmer-${index}`}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                  <div className="tc-shimmer-block h-60 w-full" />
                  <div className="space-y-2 p-3">
                    <span className="tc-shimmer-block block h-5 w-2/3 rounded-md" />
                    <div className="flex gap-2">
                      <span className="tc-shimmer-block block h-5 w-20 rounded-full" />
                      <span className="tc-shimmer-block block h-5 w-20 rounded-full" />
                    </div>
                    <span className="tc-shimmer-block block h-4 w-3/4 rounded-md" />
                    <div className="space-y-2 pt-2">
                      <span className="tc-shimmer-block block h-10 w-full rounded-[6px]" />
                      <span className="tc-shimmer-block block h-10 w-full rounded-[6px]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => {
                const claimInProgress = isClaimingItemId === item.id
                const claimAlreadyCreated = Boolean(item.claimStatus)

                return (
                  <div key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {item.image ? (
                      <img src={item.image.url} alt={item.title} className="h-60 w-full object-cover" />
                    ) : (
                      <div className="flex h-44 w-full items-center justify-center bg-slate-100 text-sm text-tc-app-secondary">
                        No image available
                      </div>
                    )}
                    <div className="space-y-2 p-3">
                      <h3 className="font-semibold text-tc-app-text">{item.title}</h3>
                      <div className="flex gap-2">
                        <span className="rounded-full border border-tc-app-badgeOutline px-2 py-0.5 text-xs text-tc-app-badgeText">
                          {item.category}
                        </span>
                        <span className="rounded-full bg-tc-app-primary px-2 py-0.5 text-xs text-tc-app-text">
                          {item.condition}
                        </span>
                      </div>
                      <p className="text-sm text-tc-app-slate500">{item.locationLabel}</p>
                      <div className="space-y-2 pt-2">
                        <Button
                          variant='primary'
                          className="w-full rounded-[6px]"
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
                        <Button
                          variant="secondary"
                          className="w-full rounded-[6px]"
                          onClick={() => setSelectedBrowseItem(item)}
                        >
                          View Item
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      ) : null}

      <SuccessDialog isOpen={isSuccessOpen} onClose={() => setIsSuccessOpen(false)} />
      <ListItemDialog isOpen={isListItemDialogOpen} onClose={() => setIsListItemDialogOpen(false)} />
      <ItemDetailsDialog
        isOpen={Boolean(selectedBrowseItem)}
        onClose={() => setSelectedBrowseItem(null)}
        item={
          selectedBrowseItem
            ? {
              title: selectedBrowseItem.title,
              image: selectedBrowseItem.image?.url,
              status: selectedBrowseItem.claimStatus ? 'Claimed' : 'Active',
              category: selectedBrowseItem.category,
              condition: selectedBrowseItem.condition,
              location: selectedBrowseItem.locationLabel,
            }
            : null
        }
      />
    </div>
  )
}
