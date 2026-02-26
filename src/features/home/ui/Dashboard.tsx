import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Search, SlidersHorizontal, ChevronRight, X, Plus } from 'lucide-react'
import { Button } from '@/shared/ui/button/Button'
import collectedItemsIcon from '@/assets/icons/collected-items-icon.svg'
import exchangeIcon from '@/assets/icons/exchange-icon.svg'
import sizeIcon from '@/assets/icons/size-icon.svg'
import rewardIcon from '@/assets/icons/reward-icon.svg'
import ipadImg from '@/assets/images/ipad.jpg'
import plannerImg from '@/assets/images/book-planner.jpg'
import bagShoeImg from '@/assets/images/bag-shoe.jpg'
import candleImg from '@/assets/images/scented-candle.jpg'
import { SuccessDialog } from '@/shared/ui/modal/SuccessDialog'
import { ListItemDialog } from '@/shared/ui/modal/ListItemDialog'
import { useUserRole } from '@/shared/context/useUserRole'

interface BrowseItem {
  id: string
  title: string
  category: string
  condition: string
  location: string
  image: string
}

interface DonorListing {
  id: string
  title: string
  status: 'Active' | 'Claimed'
  category: string
  condition: string
  meta: string
  image: string
}

const AVAILABLE_ITEMS: BrowseItem[] = [
  {
    id: '1',
    title: 'iPad Air - 64GB WiFi',
    category: 'Gadget',
    condition: 'Like New',
    location: 'SW1A 1AA - 0.5 miles',
    image: ipadImg,
  },
  {
    id: '2',
    title: 'Brand New Planner Book',
    category: 'Books',
    condition: 'Like New',
    location: 'SW1A 1AA - 0.5 miles',
    image: plannerImg,
  },
  {
    id: '3',
    title: 'Bag and Shoe Wardrobe',
    category: 'Clothing',
    condition: 'Like New',
    location: 'SW1A 1AA - 0.5 miles',
    image: bagShoeImg,
  },
  {
    id: '4',
    title: 'Scented Candle',
    category: 'Home Decor',
    condition: 'Like New',
    location: 'SW1A 1AA - 0.5 miles',
    image: candleImg,
  },
]

const DONOR_LISTINGS: DonorListing[] = [
  {
    id: '1',
    title: 'iPhone 12Pro',
    status: 'Active',
    category: 'Gadget',
    condition: 'Good',
    meta: 'Waiting for collectors',
    image: ipadImg,
  },
  {
    id: '2',
    title: 'Desk Lamp',
    status: 'Active',
    category: 'Electronics',
    condition: 'Good',
    meta: 'Waiting for collectors',
    image: candleImg,
  },
  {
    id: '3',
    title: 'Winter Coat - Size M',
    status: 'Claimed',
    category: 'Clothing',
    condition: 'Like New',
    meta: 'Claimed by John D.',
    image: bagShoeImg,
  },
]

const CATEGORIES = [
  'All Items',
  'Gadgets',
  'Electronics',
  'Clothing',
  'Books',
  'Furniture',
  'Sports Equipment',
  'Home Decor',
  'Others',
]

function statColor(index: number): string {
  if (index === 0) return 'bg-lime-100'
  if (index === 1) return 'bg-sky-100'
  if (index === 2) return 'bg-emerald-100'
  return 'bg-amber-100'
}

export default function Dashboard() {
  const location = useLocation()
  const { role } = useUserRole()
  const isDonorMode = role === 'donor'
  const showStats = location.pathname === '/' || location.pathname === '/dashboard'

  const [activeCategory, setActiveCategory] = useState('All Items')
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)
  const [isListItemDialogOpen, setIsListItemDialogOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, Pearl!</h1>
          <p className="text-slate-500">Track your impact and manage your listings</p>
        </div>
        {isDonorMode ? (
          <Button className="inline-flex items-center gap-2" onClick={() => setIsListItemDialogOpen(true)}>
            <Plus size={18} />
            List New Item
          </Button>
        ) : null}
      </div>

      {showStats ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { value: '8', label: isDonorMode ? 'Items Listed' : 'Items Collected', icon: collectedItemsIcon },
            { value: '5', label: 'Exchanged', icon: exchangeIcon },
            { value: '47.5kg', label: 'CO2 Saved', icon: sizeIcon },
            { value: 'GBP50', label: 'Rewards Earned', icon: rewardIcon },
          ].map((item, index) => (
            <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${statColor(index)}`}>
                <img src={item.icon} alt="" aria-hidden className="h-5 w-5" />
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-900">{item.value}</p>
              <p className="text-sm text-slate-500">{item.label}</p>
            </div>
          ))}
        </div>
      ) : null}

      {isDonorMode && showStats ? (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Your Environmental Impact</h2>
              <button className="text-slate-400 hover:text-slate-600">...</button>
            </div>
            <div className="h-56 rounded-xl bg-gradient-to-b from-emerald-50 to-white p-3">
              <svg className="h-full w-full" viewBox="0 0 800 220" preserveAspectRatio="none">
                <path
                  className="text-emerald-500/20"
                  d="M0,100 C100,140 150,70 200,100 C250,130 300,160 350,100 C400,40 500,170 600,100 C700,30 750,70 800,50 L800,220 L0,220 Z"
                  fill="currentColor"
                />
                <path
                  className="text-emerald-600"
                  d="M0,100 C100,140 150,70 200,100 C250,130 300,160 350,100 C400,40 500,170 600,100 C700,30 750,70 800,50"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="3"
                />
              </svg>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Your Listings</h2>
              <button className="inline-flex items-center gap-1 text-sm font-medium text-tc-auth-link hover:underline">
                View All <ChevronRight size={16} />
              </button>
            </div>
            <div className="space-y-2">
              {DONOR_LISTINGS.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                  <div className="flex items-center gap-3">
                    <img src={item.image} alt={item.title} className="h-14 w-14 rounded-lg object-cover" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{item.title}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.status === 'Active' ? 'bg-lime-100 text-lime-700' : 'bg-amber-100 text-amber-700'}`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">{item.category} - Condition: {item.condition} - {item.meta}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.status === 'Active' ? (
                      <>
                        <Button variant="secondary">View</Button>
                        <Button variant="secondary" className="text-rose-600 ring-rose-200 hover:bg-rose-50 hover:text-rose-700">Remove</Button>
                      </>
                    ) : (
                      <Button variant="secondary">View Details</Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {!isDonorMode ? (
        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Browse Available Items</h2>
            <button className="inline-flex items-center gap-1 text-sm font-medium text-tc-auth-link hover:underline">
              View All <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[260px] flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder="Search by category, location or keyword"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
              />
            </div>
            {!isFilterOpen ? (
              <Button variant="secondary" className="inline-flex items-center gap-2" onClick={() => setIsFilterOpen(true)}>
                <SlidersHorizontal size={18} />
                Filters
              </Button>
            ) : (
              <Button variant="secondary" className="inline-flex items-center gap-2" onClick={() => setIsFilterOpen(false)}>
                Clear Filters
                <X size={16} />
              </Button>
            )}
          </div>

          {isFilterOpen ? (
            <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-3">
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Category</span>
                <select className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none">
                  <option>All categories</option>
                  <option>Gadgets</option>
                  <option>Electronics</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Condition</span>
                <select className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none">
                  <option>All condition</option>
                  <option>Like New</option>
                  <option>Used</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Location</span>
                <input
                  type="text"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none"
                  placeholder="Enter location or postal code"
                />
              </label>
            </div>
          ) : null}

          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  category === activeCategory
                    ? 'bg-lime-100 text-slate-900'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {AVAILABLE_ITEMS.map((item) => (
              <div key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <img src={item.image} alt={item.title} className="h-44 w-full object-cover" />
                <div className="space-y-2 p-3">
                  <h3 className="font-semibold text-slate-900">{item.title}</h3>
                  <div className="flex gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{item.category}</span>
                    <span className="rounded-full bg-lime-100 px-2 py-0.5 text-xs font-semibold text-lime-700">{item.condition}</span>
                  </div>
                  <p className="text-sm text-slate-500">{item.location}</p>
                  <div className="flex gap-2 pt-1">
                    <Button className="flex-1" onClick={() => setIsSuccessOpen(true)}>Request a Claim</Button>
                    <Button variant="secondary" className="flex-1">View Item</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <SuccessDialog isOpen={isSuccessOpen} onClose={() => setIsSuccessOpen(false)} />
      <ListItemDialog isOpen={isListItemDialogOpen} onClose={() => setIsListItemDialogOpen(false)} />
    </div>
  )
}
