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
    const request = new AbortController()

    async function loadCategoryItems() {
      setIsLoading(true)
      setLoadError(false)
      try {
        const response = await fetchBrowseItems({
          category: activeCategory === 'All Items' ? undefined : activeCategory,
          limit: 6,
          includeAuth: false,
          signal: request.signal,
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
      request.abort()
    }
  }, [activeCategory])

  return (
    <section className="relative overflow-hidden border-y border-tc-brand-line bg-white px-4 py-20 sm:px-6" id="explore-items">
      <div className="mx-auto max-w-[1184px]">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-[640px]">
            <span className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase leading-5 tracking-[0.06em] text-tc-brand-muted">
              <Sparkles className="h-3.5 w-3.5 text-tc-brand-muted" />
              Live Community Listings
            </span>
            <h2 className="mt-2.5 text-[clamp(2rem,4.2vw,2.75rem)] font-semibold leading-[1.14] tracking-[-0.03em] text-tc-brand-ink">
              See what neighbours are giving away
            </h2>
            <p className="mt-2.5 text-base leading-[26px] text-tc-brand-body">
              Explore recent free items listed across local neighbourhoods. Feel free to inspect details freely before signing up.
            </p>
          </div>

          <Link
            to={`/browse?category=${encodeURIComponent(activeCategory)}`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full px-[22px] text-[15px] font-semibold no-underline transition duration-200 hover:-translate-y-0.5 border border-tc-brand-control bg-transparent text-tc-brand-ink hover:bg-tc-brand-soft"
          >
            <span>Browse all in {activeCategory}</span>
            <ArrowRight className="h-4 w-4 text-tc-brand-ink" />
          </Link>
        </div>

        {/* Category Filter Pills */}
        <div className="mt-7 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {TOP_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-medium transition ${
                  isActive
                    ? 'border-tc-brand-deep bg-tc-brand-deep text-white'
                    : 'border-tc-brand-control bg-white text-tc-brand-ink hover:bg-tc-brand-soft'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>

        {/* Items Grid */}
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {!isLoading && items.length === 0 ? (
            <p className="col-span-full rounded-tc-lg border border-dashed border-tc-brand-control bg-white p-8 text-center text-sm text-tc-brand-body" role="status">
              {loadError ? 'Unable to load listings right now.' : 'No listings available in this category.'}
            </p>
          ) : null}
          {isLoading
            ? Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`skeleton-card-${index}`}
                  className="overflow-hidden rounded-tc-lg border border-tc-brand-line bg-white"
                >
                  <div className="tc-shimmer-block h-[200px] w-full bg-tc-brand-soft" />
                  <div className="space-y-2.5 p-4">
                    <div className="tc-shimmer-block h-5 w-3/4 rounded-tc-sm bg-tc-brand-soft" />
                    <div className="tc-shimmer-block h-4 w-1/2 rounded-tc-sm bg-tc-brand-soft" />
                    <div className="tc-shimmer-block h-11 w-full rounded-full bg-tc-brand-soft" />
                  </div>
                </div>
              ))
            : items.map((item) => (
                <article
                  key={item.id}
                  className="group flex flex-col overflow-hidden rounded-tc-lg border border-tc-brand-line bg-white transition-all duration-200 hover:-translate-y-1 hover:shadow-tc-card"
                >
                  <div className="relative h-[200px] w-full overflow-hidden bg-tc-brand-soft">
                    {item.image ? (
                      <img
                        src={item.image.url}
                        alt={item.image.altText ?? item.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-medium text-tc-brand-muted">
                        No image available
                      </div>
                    )}
                    <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold leading-4 text-tc-brand-ink">
                        {item.category}
                      </span>
                      <span className="rounded-full bg-tc-brand-deep px-2.5 py-1 text-xs font-semibold leading-4 text-white">
                        {item.condition}
                      </span>
                    </div>

                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="line-clamp-1 text-base font-semibold leading-6 text-tc-brand-ink">
                      {item.title}
                    </h3>

                    <div className="mt-2 flex items-center gap-1.5 text-[13px] leading-5 text-tc-brand-muted">
                      <MapPin className="h-3.5 w-3.5 text-tc-brand-muted" />
                      <span>{item.locationLabel}</span>
                      {item.distanceKm ? <span>· {item.distanceKm} km away</span> : null}
                    </div>

                    <p className="mt-1 text-[13px] leading-5 text-tc-brand-muted">
                      Given by <span className="font-semibold text-tc-brand-body">{item.ownerName}</span>
                    </p>

                    <div className="mt-auto pt-3.5">
                      <Button
                        type="button"
                        variant="secondary"
                        className="min-h-11 w-full justify-center gap-2 rounded-full border border-tc-brand-control bg-white text-sm font-semibold text-tc-brand-ink transition hover:bg-tc-brand-soft group-hover:border-tc-brand-deep"
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
        <div className="mt-7 flex flex-col items-center justify-between gap-4 rounded-tc-lg border border-tc-brand-mintLine bg-tc-brand-mintSoft px-6 py-5 text-tc-brand-ink sm:flex-row">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-base font-semibold leading-6 text-tc-brand-ink">Want to see all items in your local area?</h3>
            <p className="text-[15px] leading-[22px] text-tc-brand-body">
              Browse by postcode or category. No account needed to browse.
            </p>
          </div>
          <Link
            to="/browse"
            className="shrink-0 inline-flex h-12 items-center justify-center gap-2 rounded-full px-[22px] text-[15px] font-semibold no-underline transition duration-200 hover:-translate-y-0.5 bg-tc-brand-deep text-white hover:bg-tc-brand-hover"
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
        containerClassName="max-w-[540px] rounded-tc-xl shadow-tc-dialog"
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
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold leading-4 text-tc-brand-ink">
                    {selectedItem.category}
                  </span>
                  <span className="rounded-full bg-tc-brand-deep px-2.5 py-1 text-xs font-semibold leading-4 text-white">
                    {selectedItem.condition}
                  </span>
                </div>
              </div>
            ) : null}

            <div className="space-y-4 p-6">
              <div>
                <h2 className="text-xl font-semibold leading-7 tracking-[-0.015em] text-tc-brand-ink">{selectedItem.title}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm leading-5 text-tc-brand-body">
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

              <div className="rounded-tc-md border border-tc-brand-mintLine bg-tc-brand-mintSoft p-4 text-sm text-tc-brand-body">
                <p className="font-semibold text-tc-brand-ink">Ready to collect this item?</p>
                <p className="mt-1 text-[13px] leading-5 text-tc-brand-body">
                  Open the full listing to check availability and request this item.
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <Link
                  to={`/items/${encodeURIComponent(selectedItem.id)}`}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-tc-brand-deep px-5 text-sm font-semibold text-white no-underline transition hover:bg-tc-brand-hover"
                >
                  View full listing
                </Link>

              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </section>
  )
}
