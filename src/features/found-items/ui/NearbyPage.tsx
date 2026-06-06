import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Compass, LoaderCircle, RefreshCw } from 'lucide-react'
import { useFoundItems } from '../hooks/useFoundItems'
import type { FoundItemCategory, FoundItemStatus } from '../types'
import { foundItemCategories } from '../types'
import { NearbyCard } from './components/NearbyCard'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { useIntentSwitch } from '@/shared/hooks/useIntentSwitch'
import { classNames } from '@/shared/utils/classNames'

type CategoryChip = 'all' | FoundItemCategory
type StatusChip = 'all' | Extract<FoundItemStatus, 'available' | 'claimed'>

const categoryChipMeta: Record<FoundItemCategory, string> = {
  furniture: 'Furniture',
  electronics: 'Electronics',
  clothing: 'Clothing',
  books: 'Books',
  appliances: 'Appliances',
  outdoor: 'Outdoor',
  toys: 'Toys',
  other: 'Other',
}

interface ChipProps {
  readonly label: string
  readonly isActive: boolean
  readonly onClick: () => void
}

function Chip({ label, isActive, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        'whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition',
        isActive
          ? 'bg-[#34DA45] text-[#0F1F08] shadow-sm'
          : 'bg-white text-slate-600 hover:bg-[#F4FAEA]',
      )}
    >
      {label}
    </button>
  )
}

export default function NearbyPage() {
  const { user } = useAuthSession()
  const navigate = useNavigate()
  const { runWithRole } = useIntentSwitch()
  const [categoryChip, setCategoryChip] = useState<CategoryChip>('all')
  const [statusChip, setStatusChip] = useState<StatusChip>('all')

  const { items, isLoading, error, refresh } = useFoundItems({
    postcode: user?.postcode?.trim() || undefined,
    sortBy: 'nearest',
    maxDistance: 5,
    status: statusChip === 'all' ? undefined : statusChip,
    category: categoryChip === 'all' ? undefined : categoryChip,
  })

  const visibleItems = useMemo(() => items.filter((item) => item.status !== 'expired' && item.status !== 'reported'), [items])

  const headerSubtitle = user?.postcode?.trim()
    ? `Within 5 km of ${user.postcode.trim().toUpperCase()}`
    : 'Within 5 km of your area'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-[-0.03em] text-slate-950">
            <Compass size={26} className="text-[#3A7618]" />
            Nearby
          </h1>
          <p className="mt-1 text-sm text-slate-500">{headerSubtitle} &middot; sorted by distance</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void refresh()
            }}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:text-slate-950"
          >
            {isLoading ? <LoaderCircle size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Refresh
          </button>
          <button
            type="button"
            onClick={() => runWithRole('spotter', { path: '/found-items/post' })}
            className="inline-flex items-center gap-2 rounded-full bg-[#111611] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1B231B]"
          >
            <Camera size={14} />
            Spot one yourself
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 rounded-full bg-[#F2F4EC] p-1.5">
          <Chip label="All" isActive={statusChip === 'all'} onClick={() => setStatusChip('all')} />
          <Chip label="Live" isActive={statusChip === 'available'} onClick={() => setStatusChip('available')} />
          <Chip label="Claimed" isActive={statusChip === 'claimed'} onClick={() => setStatusChip('claimed')} />
        </div>
        <div className="flex flex-wrap gap-2 rounded-full bg-[#F2F4EC] p-1.5">
          <Chip
            label="All categories"
            isActive={categoryChip === 'all'}
            onClick={() => setCategoryChip('all')}
          />
          {foundItemCategories.map((cat) => (
            <Chip
              key={cat}
              label={categoryChipMeta[cat]}
              isActive={categoryChip === cat}
              onClick={() => setCategoryChip(cat)}
            />
          ))}
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      {isLoading && visibleItems.length === 0 ? (
        <div className="flex items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-white p-12 text-sm text-slate-500">
          <LoaderCircle size={16} className="mr-2 animate-spin" />
          Finding spots near you...
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-200 bg-white p-10 text-center">
          <p className="text-base font-semibold text-slate-900">No spots within 5 km right now</p>
          <p className="mt-1 text-sm text-slate-500">
            Be the first &mdash; tap "Spot one yourself" to add the next item to your community board.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleItems.map((item) => (
            <NearbyCard
              key={item.id}
              item={item}
              onClick={() => {
                runWithRole('collector', { path: `/map?highlight=${encodeURIComponent(item.id)}` })
              }}
            />
          ))}
        </div>
      )}

      <p className="text-center text-xs text-slate-400">
        Tap a card to open it on the live map &middot;{' '}
        <button
          type="button"
          className="underline-offset-2 hover:underline"
          onClick={() => navigate('/map')}
        >
          See full map
        </button>
      </p>
    </div>
  )
}
