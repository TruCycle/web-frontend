import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, SlidersHorizontal, X } from 'lucide-react'
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
  { value: 'All Items', label: 'All categories' },
  { value: 'Furniture', label: 'Furniture' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Clothing', label: 'Clothing' },
  { value: 'Books', label: 'Books' },
  { value: 'Home Decor', label: 'Home Decor' },
  { value: 'Sports Equipment', label: 'Sports Equipment' },
  { value: 'Other', label: 'Other' },
]

export default function PublicBrowsePage() {
  usePageMeta({
    title: 'Browse free items near you — TruCycle',
    description:
      'Browse items your neighbours are giving away for free on TruCycle. Furniture, electronics, clothing, books and more across London and the UK.',
    canonicalPath: '/browse',
  })

  useCollectionPageJsonLd()

  const { isAuthenticated } = useAuthSession()
  const [searchInput, setSearchInput] = useState('')
  const [category, setCategory] = useState('All Items')
  const [locationInput, setLocationInput] = useState('')
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [items, setItems] = useState<BrowseItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<BrowseItem | null>(null)

  const search = useDebounce(searchInput, 350)
  const postcode = useDebounce(locationInput, 350)

  useEffect(() => {
    let isActive = true

    async function load() {
      try {
        setIsLoading(true)
        setError(null)
        const result = await fetchBrowseItems({
          search,
          category,
          postcode: postcode.trim() || undefined,
          limit: 24,
          includeAuth: false,
        })
        if (isActive) {
          setItems(result)
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
    if (items.length === 0) return 'No items match your search right now.'
    return `${items.length} free item${items.length === 1 ? '' : 's'} available`
  }, [isLoading, items.length])

  return (
    <div className="min-h-screen bg-[#F7FBF4] text-tc-app-text">
      <LandingNavbar
        dashboardTo="/dashboard"
        isAuthenticated={isAuthenticated}
        postItemTo={isAuthenticated ? '/listings' : '/signup?intent=donor'}
      />

      <main className="mx-auto max-w-7xl px-6 pb-24 pt-32">
        <header className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-[-0.04em] text-[#0B3322] sm:text-5xl">
            Free items near you
          </h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Everything here is being given away for free by neighbours. Browse without an
            account — you only need to sign up when you want to request something.
          </p>
        </header>

        <div className="mt-10 flex flex-wrap gap-3">
          <div className="relative min-w-[260px] flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Search by keyword or category"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-tc-app-primary focus:ring-4 focus:ring-tc-app-primary/20"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <button
            type="button"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-white/70"
            onClick={() => setIsFiltersOpen((open) => !open)}
          >
            {isFiltersOpen ? <X size={16} /> : <SlidersHorizontal size={16} />}
            {isFiltersOpen ? 'Hide filters' : 'Filters'}
          </button>
        </div>

        {isFiltersOpen ? (
          <div className="mt-4 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2">
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Category</span>
              <CustomSelect
                value={category}
                options={CATEGORY_OPTIONS}
                onChange={setCategory}
                buttonClassName="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
              />
            </label>
            <label className="space-y-2 text-sm">
              <span className="font-medium text-slate-700">Location</span>
              <input
                type="text"
                placeholder="Postcode or area"
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-tc-app-primary focus:ring-4 focus:ring-tc-app-primary/20"
                value={locationInput}
                onChange={(event) => setLocationInput(event.target.value)}
              />
            </label>
          </div>
        ) : null}

        <p className="mt-6 text-sm text-slate-500">{resultLabel}</p>
        {error ? <p className="mt-2 text-sm text-rose-600">{error}</p> : null}

        <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`browse-shimmer-${index}`}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                  <div className="tc-shimmer-block h-56 w-full" />
                  <div className="space-y-2 p-4">
                    <span className="tc-shimmer-block block h-5 w-2/3 rounded-md" />
                    <span className="tc-shimmer-block block h-4 w-1/2 rounded-md" />
                  </div>
                </div>
              ))
            : items.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                  {item.image ? (
                    <img
                      src={item.image.url}
                      alt={item.image.altText ?? item.title}
                      className="h-56 w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-56 w-full items-center justify-center bg-slate-100 text-sm text-slate-400">
                      No image
                    </div>
                  )}
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h2 className="font-semibold text-tc-app-text">{item.title}</h2>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-tc-app-badgeOutline px-2 py-0.5 text-xs text-tc-app-badgeText">
                        {item.category}
                      </span>
                      <span className="rounded-full bg-tc-app-primary px-2 py-0.5 text-xs text-tc-app-text">
                        {item.condition}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{item.locationLabel}</p>
                    <div className="mt-auto pt-2">
                      <Button
                        variant="secondary"
                        className="w-full rounded-[6px]"
                        onClick={() => setSelectedItem(item)}
                      >
                        View item
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
        </div>

        {!isLoading && items.length === 0 && !error ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            Nothing here yet for that search. Try a broader category or a nearby postcode.
          </div>
        ) : null}
      </main>

      <Modal
        isOpen={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        containerClassName="max-w-[520px]"
      >
        {selectedItem ? (
          <div className="flex flex-col">
            {selectedItem.image ? (
              <img
                src={selectedItem.image.url}
                alt={selectedItem.image.altText ?? selectedItem.title}
                className="h-64 w-full rounded-t-2xl object-cover"
              />
            ) : null}
            <div className="space-y-3 p-6">
              <h2 className="text-xl font-bold text-slate-900">{selectedItem.title}</h2>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-600">
                  {selectedItem.category}
                </span>
                <span className="rounded-full bg-tc-app-primary px-2 py-0.5 text-xs text-tc-app-text">
                  {selectedItem.condition}
                </span>
              </div>
              <p className="text-sm text-slate-600">{selectedItem.locationLabel}</p>
              <p className="text-sm text-slate-600">Shared by {selectedItem.ownerName}</p>
              {selectedItem.estimatedCo2SavedKg ? (
                <p className="text-sm text-emerald-700">
                  ~{selectedItem.estimatedCo2SavedKg.toFixed(1)} kg CO₂e saved by reusing this
                </p>
              ) : null}

              <div className="rounded-xl border border-[#0D3B24]/20 bg-[#0D3B24]/5 p-4 text-sm text-slate-700">
                Create a free account to request this item and message the owner.
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  to="/signup?intent=collector"
                  className="inline-flex flex-1 items-center justify-center rounded-full bg-[#0B3322] px-5 py-3 text-sm font-semibold text-white no-underline"
                >
                  Sign up to request
                </Link>
                <Link
                  to="/login"
                  className="inline-flex flex-1 items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-[#0B3322] no-underline"
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
