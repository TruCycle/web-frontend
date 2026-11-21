import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search, ChevronRight, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/shared/ui/button/Button'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
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
import { RescueTicker } from '@/features/gamification/ui/components/RescueTicker'

function statColor(index: number): string {
  if (index === 0) return 'bg-tc-brand-mintSoft'
  if (index === 1) return 'bg-tc-brand-mintSoft'
  if (index === 2) return 'bg-tc-brand-mintSoft'
  return 'bg-tc-brand-mintSoft'
}

export default function Dashboard() {
  usePageMeta({
    title: 'Dashboard — TruCycle',
    description: 'Your TruCycle dashboard. Track your impact, manage listings, and browse available items.',
    noIndex: true,
  })

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
    () => {
      const completed = donorListings.filter(listing => listing.status === 'Completed')
      return completed.some(listing => listing.co2SavedKg === null)
        ? null
        : completed.reduce((total, listing) => total + (listing.co2SavedKg ?? 0), 0)
    },
    [donorListings],
  )
  const dashboardStats = isDonorMode
    ? {
      itemsCollected: donorListings.length,
      itemsExchanged: donorSummary.completed,
      totalCo2SavedKg: donorCo2Saved,
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
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[30px] font-semibold leading-9 tracking-[-0.02em] text-tc-brand-ink">Welcome back!</h1>
          <p className="mt-1 text-base leading-6 text-tc-brand-body">Track your impact and manage your listings</p>
        </div>
        {isDonorMode ? (
          <NewItemButton onClick={() => setIsListItemDialogOpen(true)} />
        ) : null}
      </div>

      {showStats ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              value: shouldShowStatsLoading ? '-' : String(dashboardStats.itemsCollected),
              label: isDonorMode ? 'Items listed (this page)' : 'Completed collections',
              icon: collectedItemsIcon,
            },
            {
              value: shouldShowStatsLoading ? '-' : dashboardStats.itemsExchanged === null ? 'Unavailable' : String(dashboardStats.itemsExchanged),
              label: isDonorMode ? 'Completed (this page)' : 'Completed exchanges',
              icon: exchangeIcon,
            },
            {
              value: shouldShowStatsLoading
                ? '-'
                : dashboardStats.totalCo2SavedKg === null ? 'Unavailable' : `${dashboardStats.totalCo2SavedKg.toFixed(1)}kg`,
              label: isDonorMode ? 'Est. CO2e (completed, this page)' : 'Est. CO2e (completed)',
              icon: sizeIcon,
            },
            {
              value: shouldShowStatsLoading
                ? '-'
                : isLoadingProgress ? '-' : userProgress ? `${userProgress.totalPoints} pts` : 'Unavailable',
              label: 'Earned activity points',
              icon: rewardIcon,
            },
          ].map((item, index) => (
            <div
              key={item.label}
              className="flex min-w-0 items-center gap-4 rounded-tc-lg border border-tc-brand-line bg-white p-5"
            >
              <div
                className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${statColor(index)}`}
              >
                <img src={item.icon} alt="" aria-hidden className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-semibold leading-7 tabular-nums text-tc-brand-ink">{item.value}</p>
                <p className="text-[13px] leading-5 text-tc-brand-muted">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {showStats ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <section className="min-w-0 space-y-4 rounded-tc-lg border border-tc-brand-line bg-white p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold leading-7 tracking-[-0.015em] text-tc-brand-ink">My Impact</h2>
                <p className="text-[13px] leading-5 text-tc-brand-muted">Current pace</p>
              </div>
              {userProgress ? <LevelBadge progress={userProgress} /> : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-tc-md bg-tc-brand-mintSoft p-4">
              <div>
                <p className="text-[13px] leading-5 text-tc-brand-muted">Streak</p>
                {primaryStreak ? <StreakIndicator streak={primaryStreak} size="lg" /> : <p className="text-sm text-tc-brand-muted">-</p>}
              </div>
              <div className="text-right">
                <p className="text-[13px] leading-5 text-tc-brand-muted">Points</p>
                <p className="text-xl font-semibold leading-7 tabular-nums text-tc-brand-ink">
                  {isLoadingProgress ? '-' : userProgress?.totalPoints ?? 0}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-[13px] leading-5 tabular-nums text-tc-brand-body">
                <span>Level progress</span>
                <span>{isLoadingProgress ? '-' : `${userProgress?.pointsToNextLevel ?? 0} pts left`}</span>
              </div>
              <ProgressBar value={userProgress?.levelProgressPercent ?? 0} />
            </div>

            <div className="flex flex-wrap gap-2">
              {isLoadingBadges ? (
                <p className="text-sm text-tc-brand-body">Loading badges...</p>
              ) : (
                earnedBadges.slice(0, 3).map((entry) => (
                  <span
                    key={entry.badge.id}
                    className="inline-flex items-center rounded-full bg-tc-brand-mintSoft px-3 py-1.5 text-[13px] font-medium text-tc-brand-deep"
                  >
                    {entry.badge.name}
                  </span>
                ))
              )}
            </div>

            <Link
              to="/impact"
              className="inline-flex items-center gap-1 text-sm font-semibold text-tc-brand-ink underline-offset-4 transition hover:underline"
            >
              View All <ChevronRight size={16} />
            </Link>
          </section>

          <section className="min-w-0 space-y-4 rounded-tc-lg border border-tc-brand-line bg-white p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold leading-7 tracking-[-0.015em] text-tc-brand-ink">Live rescue ticker</h2>
                <p className="text-[13px] leading-5 text-tc-brand-muted">Real-time community saves</p>
              </div>
            </div>
            <RescueTicker
              onItemClick={(event) => {
                window.location.href = `/map?highlight=${encodeURIComponent(event.id)}`
              }}
            />
          </section>

        </div>
      ) : null}

      {isDonorMode && showStats ? (
        <>
          <DonorEnvironmentalImpactCard />
          <section className="relative rounded-tc-lg border border-tc-brand-line bg-white p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold leading-7 tracking-[-0.015em] text-tc-brand-ink">Your Listings</h2>
              <Link
                to="/listings"
                className="inline-flex items-center gap-1 text-sm font-semibold text-tc-brand-ink underline-offset-4 hover:underline"
              >
                View All <ChevronRight size={16} />
              </Link>
            </div>
            {donorError ? <p className="mb-2 text-sm text-tc-brand-danger">{donorError}</p> : null}
            {isLoadingDonorListings ? (
              <ListingsLoadingState count={5} />
            ) : null}
            {!isLoadingDonorListings && donorListings.length === 0 ? (
              <p className="rounded-tc-md border border-dashed border-tc-brand-control p-4 text-sm text-tc-brand-body">
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
        <section className="space-y-4 rounded-tc-lg border border-tc-brand-line bg-white p-4 text-tc-brand-body sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-semibold leading-7 tracking-[-0.015em] text-tc-brand-ink">Browse Available Items</h2>
            <Link
              to="/browse"
              className="inline-flex items-center gap-1 text-sm font-semibold text-tc-brand-ink underline-offset-4 transition hover:underline"
            >
              View All <ChevronRight size={16} />
            </Link>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-[260px] flex-1">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tc-brand-muted"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by category, location or keyword"
                className="h-11 w-full rounded-tc-md border border-tc-brand-control bg-white pl-11 pr-3.5 text-sm text-tc-brand-ink outline-none placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:ring-2 focus:ring-tc-brand-mint"
                value={filters.search}
                onChange={(event) => updateSearch(event.target.value)}
              />
            </div>
            <button
              type="button"
              className="inline-flex h-11 items-center gap-2 rounded-tc-md border border-tc-brand-control bg-white px-4 text-sm font-semibold text-tc-brand-deep transition hover:bg-tc-brand-soft"
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
            <div className="space-y-4 rounded-tc-md border border-tc-brand-line p-4 md:p-5">
              <h3 className="text-xl font-semibold leading-7 tracking-[-0.015em] text-tc-brand-ink">Filters</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label htmlFor="browse-filter-category" className="block text-sm font-semibold text-tc-brand-ink">
                    Category
                  </label>
                  <CustomSelect
                    id="browse-filter-category"
                    value={selectedCategoryFilterValue}
                    options={categoryFilterOptions}
                    onChange={updateCategory}
                    buttonClassName="h-11 w-full rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink focus:border-tc-brand-deep focus:ring-2 focus:ring-tc-brand-mint"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="browse-filter-condition" className="block text-sm font-semibold text-tc-brand-ink">
                    Condition
                  </label>
                  <CustomSelect
                    id="browse-filter-condition"
                    value={selectedConditionFilterValue}
                    options={conditionFilterOptions}
                    onChange={updateCondition}
                    buttonClassName="h-11 w-full rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink focus:border-tc-brand-deep focus:ring-2 focus:ring-tc-brand-mint"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="browse-filter-location" className="block text-sm font-semibold text-tc-brand-ink">
                    Location
                  </label>
                  <input
                    id="browse-filter-location"
                    type="text"
                    placeholder="Enter location or postal code"
                    className="h-11 w-full rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink outline-none placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:ring-2 focus:ring-tc-brand-mint"
                    value={filters.location}
                    onChange={(event) => updateLocation(event.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex gap-2 overflow-x-auto p-1">
            {categories.map((category) => (
              <button
                key={category}
                className={`min-h-11 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition ${category === filters.category
                    ? 'border-tc-brand-deep bg-tc-brand-deep text-white'
                    : 'border-tc-brand-control bg-white text-tc-brand-deep hover:bg-tc-brand-soft'
                  }`}
                onClick={() => updateCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          {collectorError ? <p className="text-sm text-tc-brand-danger">{collectorError}</p> : null}

          {!isLoadingItems && items.length === 0 ? (
            <p className="rounded-tc-md border border-dashed border-tc-brand-control p-4 text-sm text-tc-brand-body">
              No matching items found right now.
            </p>
          ) : null}

          {isLoadingItems ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`browse-item-shimmer-${index}`}
                  className="overflow-hidden rounded-tc-lg border border-tc-brand-line bg-white"
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
                      <span className="tc-shimmer-block block h-10 w-full rounded-tc-md" />
                      <span className="tc-shimmer-block block h-10 w-full rounded-tc-md" />
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
                  <div key={item.id} className="overflow-hidden rounded-tc-lg border border-tc-brand-line bg-white">
                    {item.image ? (
                      <img src={item.image.url} alt={item.title} className="h-60 w-full object-cover" />
                    ) : (
                      <div className="flex h-44 w-full items-center justify-center bg-tc-brand-soft text-sm text-tc-brand-muted">
                        No image available
                      </div>
                    )}
                    <div className="space-y-2 p-4">
                      <h3 className="text-base font-semibold leading-6 text-tc-brand-ink">{item.title}</h3>
                      <div className="flex gap-2">
                        <span className="rounded-full bg-tc-brand-soft px-2.5 py-1 text-xs font-semibold leading-4 text-tc-brand-body">
                          {item.category}
                        </span>
                        <span className="rounded-full bg-tc-brand-mintSoft px-2.5 py-1 text-xs font-semibold leading-4 text-tc-brand-deep">
                          {item.condition}
                        </span>
                      </div>
                      <p className="text-[13px] leading-5 text-tc-brand-muted">{item.locationLabel}</p>
                      <div className="space-y-2 pt-2">
                        <Button
                          variant='primary'
                          className="w-full rounded-tc-md"
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
                          className="w-full rounded-tc-md"
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
