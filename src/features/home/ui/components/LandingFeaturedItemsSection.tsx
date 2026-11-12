import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Eye,
  MapPin,
  Sparkles,
} from 'lucide-react'
import { fetchBrowseItems } from '@/features/items/api/itemsApi'
import type { BrowseItem } from '@/features/items/types'
import { Button } from '@/shared/ui/button/Button'
import { Modal } from '@/shared/ui/modal/Modal'

const TOP_CATEGORIES = [
  { id: 'All Items', label: 'All items', emoji: '✨' },
  { id: 'Furniture', label: 'Furniture', emoji: '🛋️' },
  { id: 'Electronics', label: 'Electronics', emoji: '⚡' },
  { id: 'Kitchenware', label: 'Kitchenware', emoji: '🍳' },
  { id: 'Books', label: 'Books + Media', emoji: '📚' },
  { id: 'Kids + baby', label: 'Kids + Baby', emoji: '🧸' },
  { id: 'Garden + tools', label: 'Garden + Tools', emoji: '🪴' },
] as const

export function LandingFeaturedItemsSection() {
  const [activeCategory, setActiveCategory] = useState<string>('All Items')
  const [items, setItems] = useState<BrowseItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [selectedItem, setSelectedItem] = useState<BrowseItem | null>(null)

  useEffect(() => {
    let isSubscribed = true

    async function loadCategoryItems() {
      setIsLoading(true)
      setLoadError(false)
      try {
        const response = await fetchBrowseItems({
          category: activeCategory === 'All Items' ? undefined : activeCategory,
          limit: 6,
          includeAuth: false,
        })

        if (!isSubscribed) return

        setItems(response)
      } catch {
        if (!isSubscribed) return
        setItems([])
        setLoadError(true)
      } finally {
        if (isSubscribed) {
          setIsLoading(false)
        }
      }
    }

    void loadCategoryItems()

    return () => {
      isSubscribed = false
    }
  }, [activeCategory])

  return (
    <section className="relative overflow-hidden bg-white px-6 py-20 sm:py-24" id="explore-items">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#0B3322]/5 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#0B3322]">
              <Sparkles className="h-3.5 w-3.5 text-[#2f9d7e]" />
              Live Community Listings
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-[-0.04em] text-[#0B3322] sm:text-4xl lg:text-[2.75rem]">
              See what neighbours are giving away
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg">
              Explore recent free items listed across local neighbourhoods. Feel free to inspect details freely before signing up.
            </p>
          </div>

          <Link
            to={`/browse?category=${encodeURIComponent(activeCategory)}`}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-[#0B3322] no-underline shadow-sm transition hover:border-[#0B3322] hover:bg-slate-50"
          >
            <span>Browse all in {activeCategory}</span>
            <ArrowRight className="h-4 w-4 text-[#0B3322]" />
          </Link>
        </div>

        {/* Category Filter Pills */}
        <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {TOP_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-[#0B3322] text-white shadow-md shadow-[#0B3322]/15'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>

        {/* Items Grid */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {!isLoading && items.length === 0 ? (
            <p className="col-span-full text-sm text-slate-600" role="status">
              {loadError ? 'Unable to load listings right now.' : 'No listings available in this category.'}
            </p>
          ) : null}
          {isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`skeleton-card-${index}`}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                >
                  <div className="tc-shimmer-block h-52 w-full bg-slate-200" />
                  <div className="space-y-3 p-5">
                    <div className="tc-shimmer-block h-5 w-3/4 rounded-md bg-slate-200" />
                    <div className="tc-shimmer-block h-4 w-1/2 rounded-md bg-slate-200" />
                    <div className="tc-shimmer-block h-9 w-full rounded-xl bg-slate-200" />
                  </div>
                </div>
              ))
            : items.map((item) => (
                <article
                  key={item.id}
                  className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-200 hover:-translate-y-1 hover:border-[#0B3322]/30 hover:shadow-[0_16px_40px_rgba(11,51,34,0.10)]"
                >
                  <div className="relative h-52 w-full overflow-hidden bg-slate-100">
                    {item.image ? (
                      <img
                        src={item.image.url}
                        alt={item.image.altText ?? item.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-medium text-slate-400">
                        No image available
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
                    <h3 className="line-clamp-1 text-base font-bold text-slate-900 group-hover:text-[#0B3322]">
                      {item.title}
                    </h3>

                    <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>{item.locationLabel}</span>
                      {item.distanceKm ? <span>· {item.distanceKm} km away</span> : null}
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      Given by <span className="font-semibold text-slate-700">{item.ownerName}</span>
                    </p>

                    <div className="mt-4 pt-2">
                      <Button
                        type="button"
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

        {/* Big Bottom Explore CTA */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-2xl bg-[#0B3322] p-8 text-white sm:flex-row sm:p-10">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-xl font-bold sm:text-2xl">Want to see all items in your local area?</h3>
            <p className="text-sm text-white/80 sm:text-base">
              Browse by postcode or category. No account needed to browse.
            </p>
          </div>
          <Link
            to="/browse"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-tc-shell-accent px-7 py-3 text-base font-bold text-[#0B3322] no-underline shadow-lg transition duration-200 hover:-translate-y-0.5 hover:bg-tc-shell-accentHover"
          >
            <span>Explore all free items</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Rich Non-Gated Item Preview Modal */}
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

              <div className="rounded-xl border border-[#0B3322]/15 bg-[#F7FBF4] p-4 text-sm text-slate-700">
                <p className="font-semibold text-[#0B3322]">Ready to collect this item?</p>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Sign up or log in to message {selectedItem.ownerName} and arrange your free collection.
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
    </section>
  )
}
