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

  // Sync state changes with URL query parameters
  useEffect(() => {
    const params = new URLSearchParams()
    if (search.trim()) params.set('search', search.trim())
    if (category && category !== 'All Items') params.set('category', category)
    const itemId = selectedItem?.id ?? initialItemId.current
    if (itemId) params.set('item', itemId)

    setSearchParams(params, { replace: true })
  }, [category, search, selectedItem, setSearchParams])

  const setSelectedItem = (item: BrowseItem | null) => {
    setSelectedItemState(item)
  }

  useEffect(() => {
    let isActive = true

    async function load() {
      try {
        setIsLoading(true)
        setError(null)
        const result = await fetchBrowseItems({
          search,
          category: category === 'All Items' ? undefined : category,
          postcode: postcode.trim() || undefined,
          limit: 24,
          includeAuth: false,
        })
        if (isActive) {
          setItems(result)

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
    }
  }, [search, category, postcode])

  const resultLabel = useMemo(() => {
    if (isLoading) return 'Loading items…'
    if (error) return error
    if (items.length === 0) {
      return search.trim() || postcode.trim() || category !== 'All Items'
        ? 'No items match these filters. Try a broader category or a nearby postcode.'
        : 'No items are available to browse right now.'
    }
    return `${items.length} free item${items.length === 1 ? '' : 's'} available`
  }, [category, error, isLoading, items.length, postcode, search])

  return (
    <div className="flex min-h-screen flex-col bg-[#F7FBF4] text-tc-app-text">
      <LandingNavbar
        dashboardTo="/dashboard"
        isAuthenticated={isAuthenticated}
        postItemTo={isAuthenticated ? '/listings' : '/signup?intent=donor'}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 pb-24 pt-32">
        <header className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-[-0.04em] text-[#0B3322] sm:text-5xl">
            {postcode.trim() ? 'Free items near your search area' : 'Free items to reuse'}
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Everything here is being given away for free by neighbours. Browse without an
            account — you only need to sign up when you want to request something.
          </p>
        </header>

        <div className="mt-8 flex flex-wrap gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by keyword, item, or area (e.g. sofa, desk, bicycle)"
              className="h-12 w-full rounded-2xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#0B3322] focus:ring-4 focus:ring-[#0B3322]/10 sm:text-base"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <button
            type="button"
            className="inline-flex h-12 items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
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
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition sm:text-sm sm:px-4 sm:py-2 ${
                  isSelected
                    ? 'bg-[#0B3322] text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{opt.emoji}</span>
                <span>{opt.label}</span>
              </button>
            )
          })}
        </div>

        {isFiltersOpen ? (
          <div className="mt-4 grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-800">Category</span>
              <CustomSelect
                value={category}
                options={CATEGORY_OPTIONS}
                onChange={setCategory}
                buttonClassName="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-semibold text-slate-800">Postcode or Area</span>
              <input
                type="text"
                placeholder="e.g. IG11 7FR, Hackney, Stratford"
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-[#0B3322] focus:ring-4 focus:ring-[#0B3322]/10"
                value={locationInput}
                onChange={(event) => setLocationInput(event.target.value)}
              />
            </label>
          </div>
        ) : null}

        <p className={error ? 'mt-6 min-h-10 text-sm text-rose-600' : 'mt-6 min-h-10 text-sm text-slate-500'} role={error ? 'alert' : 'status'}>
          {resultLabel}
        </p>

        <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {!isLoading && items.map((item) => (
                <article
                  key={item.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#0B3322]/30 hover:shadow-md"
                >
                  <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                    {item.image ? (
                      <img
                        src={item.image.url}
                        alt={item.image.altText ?? item.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-56 w-full items-center justify-center text-sm font-medium text-slate-400">
                        No image
                      </div>
                    )}
                    <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-white/95 px-2.5 py-0.5 text-xs font-bold text-[#0B3322] shadow-sm backdrop-blur-sm">
                        {item.category}
                      </span>
                      <span className="rounded-full bg-[#0B3322] px-2.5 py-0.5 text-xs font-medium text-white shadow-sm">
                        {item.condition}
                      </span>
                    </div>

                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="line-clamp-1 text-base font-bold text-slate-900 group-hover:text-[#0B3322]">
                      {item.title}
                    </h2>

                    <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{item.locationLabel}</span>
                      {item.distanceKm ? <span>· {item.distanceKm} km away</span> : null}
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      Given by <span className="font-semibold text-slate-700">{item.ownerName}</span>
                    </p>

                    <div className="mt-auto pt-4">
                      <Button
                        variant="secondary"
                        className="w-full justify-center gap-2 rounded-xl border border-slate-300 bg-[#F8FCF7] text-sm font-bold text-[#0B3322] transition group-hover:border-[#0B3322] group-hover:bg-[#0B3322] group-hover:text-white"
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

      </main>

      <Modal
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        containerClassName="max-w-[540px]"
      >
        {selectedItem ? (
          <div className="flex flex-col">
            {selectedItem.image ? (
              <div className="relative h-64 w-full bg-slate-100 sm:h-72">
                <img
                  src={selectedItem.image.url}
                  alt={selectedItem.image.altText ?? selectedItem.title}
                  className="h-full w-full rounded-t-2xl object-cover"
                />
                <div className="absolute left-4 top-4 flex gap-2">
                  <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[#0B3322] shadow">
                    {selectedItem.category}
                  </span>
                  <span className="rounded-full bg-[#0B3322] px-3 py-1 text-xs font-medium text-white shadow">
                    {selectedItem.condition}
                  </span>
                </div>
              </div>
            ) : null}
            <div className="space-y-4 p-6 sm:p-7">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedItem.title}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4 text-[#2f9d7e]" />
                    <span>{selectedItem.locationLabel}</span>
                  </div>
                  <span>·</span>
                  <span>Given by <strong>{selectedItem.ownerName}</strong></span>
                  {selectedItem.pickupOption ? (
                    <>
                      <span>·</span>
                      <span className="text-slate-500">{selectedItem.pickupOption}</span>
                    </>
                  ) : null}
                </div>
              </div>

              {selectedItem.estimatedCo2SavedKg ? (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-800">
                  <Leaf className="h-4 w-4 text-emerald-600" />
                  <span>
                    ~{selectedItem.estimatedCo2SavedKg.toFixed(1)} kg CO₂e potential reuse estimate
                  </span>
                </div>
              ) : null}

              <div className="rounded-xl border border-[#0B3322]/15 bg-[#F7FBF4] p-4 text-sm text-slate-700">
                <p className="font-semibold text-[#0B3322]">Ready to request or message the owner?</p>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Sign up or log in to message {selectedItem.ownerName} and arrange your free collection. It only takes a moment.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Link
                  to="/signup?intent=collector"
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-[#0B3322] px-5 py-3 text-sm font-bold text-white no-underline shadow transition hover:bg-[#0D3B24]"
                >
                  Sign up to claim for free
                </Link>
                <Link
                  to="/login"
                  className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-[#0B3322] no-underline transition hover:bg-slate-50"
                >
                  Log in
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
