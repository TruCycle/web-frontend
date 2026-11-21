import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Compass, LoaderCircle, RefreshCw } from 'lucide-react'
import { useFoundItems } from '../hooks/useFoundItems'
import type { FoundItemCategory, FoundItemStatus } from '../types'
import { foundItemCategories } from '../types'
import { NearbyCard } from './components/NearbyCard'
import { useAuthSession } from '@/shared/context/useAuthSession'
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
        'min-h-9 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm font-medium transition',
        isActive
          ? 'border-tc-brand-deep bg-tc-brand-deep text-white'
          : 'border-tc-brand-control bg-white text-tc-brand-deep hover:bg-tc-brand-soft',
      )}
    >
      {label}
    </button>
  )
}

export default function NearbyPage() {
  const { user } = useAuthSession()
  const navigate = useNavigate()
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
    <div className="mx-auto w-full max-w-[1120px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-[30px] leading-9 font-semibold tracking-[-0.02em] text-tc-brand-ink">
            <Compass size={26} className="text-tc-brand-ink" />
            Nearby
          </h1>
          <p className="mt-1 text-base leading-6 text-tc-brand-body">{headerSubtitle} &middot; sorted by distance</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              void refresh()
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-tc-md border border-tc-brand-control bg-white px-4 py-2 text-sm font-semibold text-tc-brand-deep transition hover:bg-tc-brand-soft"
          >
            {isLoading ? <LoaderCircle size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Refresh
          </button>
          <button
            type="button"
            onClick={() => navigate('/found-items/post')}
            className="inline-flex min-h-11 items-center gap-2 rounded-tc-md bg-tc-brand-deep px-4 py-2 text-sm font-semibold text-white transition hover:bg-tc-brand-hover"
          >
            <Camera size={14} />
            Spot one yourself
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Chip label="All" isActive={statusChip === 'all'} onClick={() => setStatusChip('all')} />
          <Chip label="Live" isActive={statusChip === 'available'} onClick={() => setStatusChip('available')} />
          <Chip label="Claimed" isActive={statusChip === 'claimed'} onClick={() => setStatusChip('claimed')} />
        </div>
        <div className="flex flex-wrap gap-2">
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

      {error ? <p className="rounded-tc-md border border-tc-brand-dangerLine bg-tc-brand-dangerSoft px-4 py-3 text-sm text-tc-brand-danger">{error}</p> : null}

      {isLoading && visibleItems.length === 0 ? (
        <div className="flex items-center justify-center rounded-tc-lg border border-dashed border-tc-brand-control bg-white p-12 text-sm text-tc-brand-body">
          <LoaderCircle size={16} className="mr-2 animate-spin" />
          Finding spots near you...
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="rounded-tc-lg border border-dashed border-tc-brand-control bg-white p-8 text-center">
          <p className="text-base font-semibold text-tc-brand-ink">No spots within 5 km right now</p>
          <p className="mt-1 text-base leading-6 text-tc-brand-body">
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
                navigate(`/map?highlight=${encodeURIComponent(item.id)}`)
              }}
            />
          ))}
        </div>
      )}

      <p className="text-center text-xs text-tc-brand-muted">
        Tap a card to open it on the live map &middot;{' '}
        <button
          type="button"
          className="font-semibold text-tc-brand-deep underline underline-offset-4 hover:text-black"
          onClick={() => navigate('/map')}
        >
          See full map
        </button>
      </p>
    </div>
  )
}
