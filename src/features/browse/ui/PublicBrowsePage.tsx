import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Eye, Leaf, MapPin, Search, SlidersHorizontal, X } from 'lucide-react'
import { fetchBrowseItems } from '@/features/items/api/itemsApi'
import type { BrowseItem } from '@/features/items/types'
import { LandingFooter } from '@/features/home/ui/components/LandingFooter'
import { LandingNavbar } from '@/features/home/ui/components/LandingNavbar'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { useDebounce } from '@/shared/hooks/useDebounce'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { Button } from '@/shared/ui/button/Button'
import { CustomSelect } from '@/shared/ui/select'
import { Modal } from '@/shared/ui/modal/Modal'
import { SITE_ORIGIN } from '@/shared/lib/config/seoConstants'

function useCollectionPageJsonLd() {
  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Browse free items on TruCycle',
      url: `${SITE_ORIGIN}/browse`,
      about: 'Free neighbour-to-neighbour item exchange across London and the UK.',
    })
    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
    }
  }, [])
}

const CATEGORY_OPTIONS = [
  { value: 'All Items', label: 'All categories', emoji: '✨' },
  { value: 'Furniture', label: 'Furniture', emoji: '🛋️' },
  { value: 'Electronics', label: 'Electronics', emoji: '⚡' },
  { value: 'Kitchenware', label: 'Kitchenware', emoji: '🍳' },
  { value: 'Clothing', label: 'Clothing', emoji: '👕' },
  { value: 'Books', label: 'Books + Media', emoji: '📚' },
  { value: 'Kids + baby', label: 'Kids + Baby', emoji: '🧸' },
  { value: 'Garden + tools', label: 'Garden + Tools', emoji: '🪴' },
  { value: 'Home Decor', label: 'Home Decor', emoji: '🖼️' },
  { value: 'Sports Equipment', label: 'Sports', emoji: '⚽' },
  { value: 'Other', label: 'Other', emoji: '📦' },
]

export default function PublicBrowsePage() {
  const [searchParams, setSearchParams] = useSearchParams()

  usePageMeta({
    title: 'Browse free items on TruCycle',
    description:
      'Browse items your neighbours are giving away for free on TruCycle. Furniture, electronics, clothing, books and more across London and the UK.',
    canonicalPath: '/browse',
  })

  useCollectionPageJsonLd()

  const { isAuthenticated } = useAuthSession()
  const [searchInput, setSearchInput] = useState(() => searchParams.get('search') ?? '')
  const [category, setCategory] = useState(() => searchParams.get('category') ?? 'All Items')
  const [locationInput, setLocationInput] = useState(() => searchParams.get('postcode') ?? '')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [items, setItems] = useState<BrowseItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItemState] = useState<BrowseItem | null>(null)
  const initialItemId = useRef(searchParams.get('item'))

  const search = useDebounce(searchInput, 350)
  const postcode = useDebounce(locationInput, 350)
  const filterKey = JSON.stringify([search, category, postcode])
  const [pageState, setPageState] = useState(() => {
    const requested = Number(searchParams.get('page') ?? 1)
    return { filterKey, page: Number.isInteger(requested) && requested >= 1 && requested <= 100 ? requested : 1 }
  })
  const page = pageState.filterKey === filterKey ? pageState.page : 1
  if (pageState.filterKey !== filterKey) setPageState({ filterKey, page: 1 })
  const [hasNextPage, setHasNextPage] = useState(false)
  const [attempt, setAttempt] = useState(0)

  // Sync state changes with URL query parameters
  useEffect(() => {
    const params = new URLSearchParams()
    if (search.trim()) params.set('search', search.trim())
    if (category && category !== 'All Items') params.set('category', category)
    if (postcode.trim()) params.set('postcode', postcode.trim())
    if (page > 1) params.set('page', String(page))
    const itemId = selectedItem?.id ?? initialItemId.current
    if (itemId) params.set('item', itemId)

    setSearchParams(params, { replace: true })
  }, [category, page, postcode, search, selectedItem, setSearchParams])

  const setSelectedItem = (item: BrowseItem | null) => {
    setSelectedItemState(item)
  }

  useEffect(() => {
    let isActive = true
    const request = new AbortController()

    async function load() {
      try {
        setIsLoading(true)
        setError(null)
        setHasNextPage(false)
        const result = await fetchBrowseItems({
          search,
          category: category === 'All Items' ? undefined : category,
          postcode: postcode.trim() || undefined,
          limit: 24,
          page,
          includeAuth: false,
          signal: request.signal,
        })
        if (isActive) {
          setItems(result)
          setHasNextPage(result.length === 24 && page < 100)

          // Check if URL has ?item=<id> to open initial preview modal
          const itemId = initialItemId.current
          if (itemId) {
            initialItemId.current = null
            setSelectedItemState(result.find((item) => item.id === itemId) ?? null)
          }
        }
      } catch {
        if (isActive) {
          setItems([])
          setError('Unable to load items right now. Please try again shortly.')
        }
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void load()
    return () => {
      isActive = false
      request.abort()
    }
  }, [search, category, postcode, page, attempt])

  const resultLabel = useMemo(() => {
    if (isLoading) return 'Loading items…'
    if (error) return error
    if (items.length === 0) {
      if (page > 1) return 'There are no further items on this page. Return to the previous page.'
      return search.trim() || postcode.trim() || category !== 'All Items'
        ? 'No items match these filters. Try a broader category or a nearby postcode.'
        : 'No items are available to browse right now.'
    }
    return `${items.length} free item${items.length === 1 ? '' : 's'} on page ${page}`
  }, [category, error, isLoading, items.length, page, postcode, search])

  return (
    <div className="flex min-h-screen flex-col bg-tc-brand-haze text-tc-brand-ink">
      <LandingNavbar
        dashboardTo="/dashboard"
        isAuthenticated={isAuthenticated}
        postItemTo={isAuthenticated ? '/listings' : '/signup?intent=donor'}
      />

      <main className="mx-auto w-full max-w-[1184px] flex-1 px-4 pb-24 pt-32 sm:px-6">
        <header className="max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-[-0.03em] text-tc-brand-ink sm:text-5xl sm:leading-[54px]">
            {postcode.trim() ? 'Free items near your search area' : 'Free items to reuse'}
          </h1>
          <p className="mt-4 text-base leading-[26px] text-tc-brand-body">
            Everything here is being given away for free by neighbours. Browse without an
            account — you only need to sign up when you want to request something.
          </p>
        </header>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-tc-brand-muted" size={20} />
            <input
              type="text"
              aria-label="Search item names or categories"
              placeholder="Search item names or categories"
              maxLength={120}
              className="h-[52px] w-full rounded-full border border-tc-brand-control bg-white pl-12 pr-5 text-sm text-tc-brand-ink outline-none placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:ring-2 focus:ring-tc-brand-mint sm:text-base"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <button
            type="button"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-tc-brand-control bg-white px-5 text-sm font-semibold text-tc-brand-ink transition hover:bg-tc-brand-soft"
            onClick={() => setIsFiltersOpen((open) => !open)}
          >
            {isFiltersOpen ? <X size={18} /> : <SlidersHorizontal size={18} />}
            {isFiltersOpen ? 'Hide location filter' : 'Filter by location'}
          </button>
        </div>

        {/* Quick Instant Category Filter Pills */}
        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORY_OPTIONS.map((opt) => {
            const isSelected = category === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setCategory(opt.value)}
                className={`inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition sm:text-sm sm:px-4 sm:py-2 ${
                  isSelected
                    ? 'border-tc-brand-deep bg-tc-brand-deep font-semibold text-white'
                    : 'border-tc-brand-control bg-white text-tc-brand-deep hover:bg-tc-brand-soft'
                }`}
              >
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            )
          })}
        </div>

        {isFiltersOpen ? (
          <div className="mt-4 grid gap-4 rounded-tc-lg border border-tc-brand-line bg-white p-5 md:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-tc-brand-ink">Category</span>
              <CustomSelect
                value={category}
                options={CATEGORY_OPTIONS}
                onChange={setCategory}
                buttonClassName="h-11 w-full rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink"
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium text-tc-brand-ink">Postcode or Area</span>
              <input
                type="text"
                placeholder="e.g. IG11 7FR, Hackney, Stratford"
                className="h-11 w-full rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink outline-none placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:ring-2 focus:ring-tc-brand-mint"
                value={locationInput}
                onChange={(event) => setLocationInput(event.target.value)}
              />
            </label>
          </div>
        ) : null}

        <p className={error ? 'mt-6 min-h-10 text-sm text-tc-brand-danger' : 'mt-6 min-h-10 text-sm text-tc-brand-body'} role={error ? 'alert' : 'status'}>
          {resultLabel}
        </p>
        {error ? (
          <button type="button" className="min-h-11 text-sm font-semibold text-tc-brand-deep underline underline-offset-4 hover:text-black disabled:cursor-not-allowed disabled:opacity-50" disabled={isLoading} onClick={() => setAttempt(value => value + 1)}>
            Retry loading items
          </button>
        ) : null}

        <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {!isLoading && items.map((item) => (
                <article
                  key={item.id}
                  className="group flex flex-col overflow-hidden rounded-tc-lg border border-tc-brand-line bg-white transition-all duration-200 hover:-translate-y-1 hover:border-tc-brand-control hover:shadow-tc-card"
                >
                  <div className="relative h-56 w-full overflow-hidden bg-tc-brand-soft">
                    {item.image ? (
                      <img
                        src={item.image.url}
                        alt={item.image.altText ?? item.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-56 w-full items-center justify-center text-sm font-medium text-tc-brand-muted">
                        No image
                      </div>
                    )}
                    <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-tc-brand-deep">
                        {item.category}
                      </span>
                      <span className="rounded-full bg-tc-brand-deep px-2.5 py-1 text-xs font-semibold text-white">
                        {item.condition}
                      </span>
                    </div>

                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <h2 className="line-clamp-1 text-base font-semibold text-tc-brand-ink">
                      {item.title}
                    </h2>

                    <div className="mt-2 flex items-center gap-1.5 text-[13px] leading-5 text-tc-brand-muted">
                      <MapPin className="h-3.5 w-3.5 text-tc-brand-muted" />
                      <span>{item.locationLabel}</span>
                      {item.distanceKm ? <span>· {item.distanceKm} km away</span> : null}
                    </div>

                    <p className="mt-1 text-[13px] leading-5 text-tc-brand-muted">
                      Given by <span className="font-semibold text-tc-brand-ink">{item.ownerName}</span>
                    </p>

                    <div className="mt-auto pt-4">
                      <Button
                        variant="secondary"
                        className="w-full justify-center gap-2 text-sm font-semibold"
                        onClick={() => setSelectedItem(item)}
                      >
                        <Eye className="h-4 w-4" />
                        <span>Inspect item</span>
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
        </div>

        {page > 1 || hasNextPage ? (
          <nav aria-label="Catalogue pages" className="mt-8 flex items-center justify-center gap-4">
            <Button variant="secondary" disabled={isLoading || page === 1} onClick={() => setPageState({ filterKey, page: page - 1 })}>
              Previous page
            </Button>
            <span className="text-sm text-tc-brand-body">Page {page}</span>
            <Button variant="secondary" disabled={isLoading || !hasNextPage} onClick={() => setPageState({ filterKey, page: page + 1 })}>
              Next page
            </Button>
          </nav>
        ) : null}
      </main>

      <Modal
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        containerClassName="max-w-[540px]"
      >
        {selectedItem ? (
          <div className="flex flex-col">
            {selectedItem.image ? (
              <div className="relative h-64 w-full bg-tc-brand-soft sm:h-72">
                <img
                  src={selectedItem.image.url}
                  alt={selectedItem.image.altText ?? selectedItem.title}
                  className="h-full w-full rounded-t-tc-xl object-cover"
                />
                <div className="absolute left-4 top-4 flex gap-2">
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-tc-brand-deep">
                    {selectedItem.category}
                  </span>
                  <span className="rounded-full bg-tc-brand-deep px-3 py-1 text-xs font-semibold text-white">
                    {selectedItem.condition}
                  </span>
                </div>
              </div>
            ) : null}
            <div className="space-y-4 p-6 sm:p-7">
              <div>
                <h2 className="text-2xl font-semibold tracking-[-0.02em] text-tc-brand-ink">{selectedItem.title}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-tc-brand-body">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-tc-brand-muted" />
                    <span>{selectedItem.locationLabel}</span>
                  </div>
                  <span>·</span>
                  <span>Given by <strong>{selectedItem.ownerName}</strong></span>
                  {selectedItem.pickupOption ? (
                    <>
                      <span>·</span>
                      <span className="text-tc-brand-muted">{selectedItem.pickupOption}</span>
                    </>
                  ) : null}
                </div>
              </div>

              {selectedItem.estimatedCo2SavedKg ? (
                <div className="flex items-center gap-2 rounded-tc-md border border-tc-brand-mintLine bg-tc-brand-mintSoft px-3.5 py-2.5 text-xs font-medium text-tc-brand-deep">
                  <Leaf className="h-4 w-4 text-tc-brand-deep" />
                  <span>
                    ~{selectedItem.estimatedCo2SavedKg.toFixed(1)} kg CO₂e potential reuse estimate
                  </span>
                </div>
              ) : null}

              <div className="rounded-tc-md bg-tc-brand-soft p-4 text-sm text-tc-brand-body">
                <p className="font-semibold text-tc-brand-ink">Ready to request or message the owner?</p>
                <p className="mt-1 text-[13px] leading-5 text-tc-brand-body">
                  Open the full listing to check availability and request this item.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Link
                  to={`/items/${encodeURIComponent(selectedItem.id)}`}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-tc-brand-deep px-5 py-3 text-sm font-semibold text-white no-underline transition hover:bg-tc-brand-hover"
                >
                  View full listing
                </Link>

              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <LandingFooter />
    </div>
  )
}
