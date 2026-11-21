import 'leaflet/dist/leaflet.css'

import { divIcon, point } from 'leaflet'
import { ArrowRight, LoaderCircle, LocateFixed, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CircleMarker, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import {
  cancelFoundItemClaim,
  claimFoundItem,
  fetchFoundItemById,
  fetchFoundItems,
  reportFoundItem,
} from '../api/foundItemsApi'
import type { FoundItem, FoundItemCategory, FoundItemStatus, FoundItemsFilter } from '../types'
import { foundItemCategories } from '../types'
import { useFoundItemDetails } from '../hooks/useFoundItemDetails'
import { foundItemMapPoint, formatApproximateDistance, outwardPostcode } from '../lib/foundItemLocation'
import { FoundItemLifecycleActions } from './components/FoundItemLifecycleActions'
import type { FoundItemClaim } from '../types'
import { FoundItemStatusBadge } from './components/FoundItemStatusBadge'
import {
  formatFoundItemAttribution,
  formatFoundItemLocationSummary,
} from './components/foundItemDisplay'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { Modal } from '@/shared/ui/modal/Modal'
import { useToast } from '@/shared/ui/toast/useToast'
import { classNames } from '@/shared/utils/classNames'

type MapFilter = 'all' | 'available' | 'fly_tipped'
type CategoryFilter = 'all' | FoundItemCategory
type FocusMode = 'me' | 'selected'

const categoryFilterMeta: Record<FoundItemCategory, string> = {
  furniture: 'Furniture',
  electronics: 'Electronics',
  clothing: 'Clothing',
  books: 'Books',
  appliances: 'Appliances',
  outdoor: 'Outdoor',
  toys: 'Toys',
  other: 'Other',
}

interface GeoPoint {
  readonly latitude: number
  readonly longitude: number
}

const fallbackCenter: GeoPoint = {
  latitude: 51.5394,
  longitude: 0.0812,
}

function isVisibleMapStatus(status: FoundItemStatus): boolean {
  return status === 'available' || status === 'claimed' || status === 'picked_up' || status === 'gone' || status === 'expired'
}

function toGeoPoint(item: FoundItem): GeoPoint | null {
  return foundItemMapPoint(item.location)
}

function distanceBetweenPoints(from: GeoPoint, to: GeoPoint): number {
  const earthRadiusKm = 6371
  const toRadians = (value: number) => (value * Math.PI) / 180
  const latitudeDelta = toRadians(to.latitude - from.latitude)
  const longitudeDelta = toRadians(to.longitude - from.longitude)
  const fromLatitude = toRadians(from.latitude)
  const toLatitude = toRadians(to.latitude)

  const haversineValue =
    Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
    Math.sin(longitudeDelta / 2) *
      Math.sin(longitudeDelta / 2) *
      Math.cos(fromLatitude) *
      Math.cos(toLatitude)

  const angularDistance = 2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue))

  return earthRadiusKm * angularDistance
}

function readDistanceKm(item: FoundItem, liveLocation: GeoPoint | null): number | null {
  const point = toGeoPoint(item)
  if (liveLocation && point) {
    return distanceBetweenPoints(liveLocation, point)
  }

  return item.location.approximateDistance
}

function formatDistance(distanceKm: number | null): string {
  return formatApproximateDistance(distanceKm)
}

function markerPalette(status: FoundItemStatus): {
  readonly fill: string
  readonly text: string
  readonly shadow: string
} {
  if (status === 'claimed') {
    return {
      fill: '#FFFFFF',
      text: '#232323',
      shadow: 'rgba(10, 13, 10, 0.22)',
    }
  }

  if (status === 'picked_up') {
    return {
      fill: '#232323',
      text: '#FFFFFF',
      shadow: 'rgba(10, 13, 10, 0.22)',
    }
  }

  return {
    fill: '#8EE3A8',
    text: '#0B1F16',
    shadow: 'rgba(10, 13, 10, 0.22)',
  }
}

function buildMarkerIcon(item: FoundItem, isSelected: boolean) {
  const palette = markerPalette(item.status)
  const size = isSelected ? 42 : 38
  const pointerSize = isSelected ? 12 : 10
  const label = String(Math.max(1, Math.min(99, item.impactPoints || item.estimatedCo2eKg || 1)))

  return divIcon({
    className: '',
    iconSize: point(size + 8, size + 18),
    iconAnchor: point((size + 8) / 2, size + 18),
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 10px 18px ${palette.shadow});">
        <div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:999px;background:${palette.fill};color:${palette.text};font:600 13px/1 Inter, system-ui, sans-serif;border:2px solid #232323;box-shadow:${isSelected ? '0 0 0 4px rgba(142,227,168,0.9)' : 'none'};">
          ${label}
        </div>
        <div style="width:${pointerSize}px;height:${pointerSize}px;margin-top:-4px;transform:rotate(45deg);background:${palette.fill};border-right:2px solid #232323;border-bottom:2px solid #232323;"></div>
      </div>
    `,
  })
}

function MapViewportSync({
  focusPoint,
  zoom,
  requestKey,
}: {
  readonly focusPoint: GeoPoint
  readonly zoom: number
  readonly requestKey: number
}) {
  const map = useMap()
  const previousSignatureRef = useRef('')

  useEffect(() => {
    const signature = `${focusPoint.latitude.toFixed(5)}:${focusPoint.longitude.toFixed(5)}:${zoom}:${requestKey}`
    if (previousSignatureRef.current === signature) {
      return
    }

    map.setView([focusPoint.latitude, focusPoint.longitude], zoom, {
      animate: true,
    })
    previousSignatureRef.current = signature
  }, [focusPoint, map, requestKey, zoom])

  return null
}

function FilterChip({
  isActive,
  label,
  onClick,
}: {
  readonly isActive: boolean
  readonly label: string
  readonly onClick: () => void
}) {
  return (
    <button
      type="button"
      className={classNames(
        'min-h-9 shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-[13px] leading-5 transition sm:px-3.5',
        isActive ? 'bg-tc-brand-deep font-semibold text-white' : 'font-medium text-tc-brand-body hover:bg-tc-brand-soft hover:text-tc-brand-ink',
      )}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

interface SelectedItemDetailsProps {
  readonly item: FoundItem | null
  readonly distanceKm: number | null
  readonly currentUserId?: string
  readonly viewerClaim?: FoundItemClaim | null
  readonly onLifecycleChange?: () => void
  readonly isOwnPost: boolean
  readonly isLocating: boolean
  readonly isClaiming: boolean
  readonly isLoadingDetails: boolean
  readonly isCancelling: boolean
  readonly isReporting: boolean
  readonly viewerHasActiveClaim: boolean
  readonly detailsError: string | null
  readonly onClaim: (message?: string) => void
  readonly onCancelClaim: () => void
  readonly onReport: (reason: string, details?: string) => void
}

function SelectedItemDetails({
  item,
  distanceKm,
  isOwnPost,
  currentUserId,
  viewerClaim,
  onLifecycleChange,
  isLocating,
  isClaiming,
  isLoadingDetails,
  isCancelling,
  isReporting,
  viewerHasActiveClaim,
  detailsError,
  onClaim,
  onCancelClaim,
  onReport,
}: SelectedItemDetailsProps) {
  const [claimMessage, setClaimMessage] = useState('')
  const [reportReason, setReportReason] = useState('')
  const [reportDetails, setReportDetails] = useState('')

  if (!item) {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-tc-lg bg-white px-6 py-10 text-center">
        <p className="rounded-full bg-tc-brand-mintSoft px-3 py-1.5 text-xs leading-4 font-semibold text-tc-brand-deep">No spots yet</p>
        <h2 className="mt-3 text-lg leading-7 font-semibold tracking-[-0.015em] text-tc-brand-ink">Nothing matches this view</h2>
        <p className="mt-2 max-w-[380px] text-sm leading-6 text-tc-brand-body">
          Switch filters or refresh the board to pull in more nearby finds.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="aspect-square overflow-hidden rounded-tc-lg bg-tc-brand-soft sm:aspect-auto">
        {item.images[0] ? (
          <img src={item.images[0].url} alt={item.title} className="h-full w-full object-cover sm:h-[196px]" />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-tc-brand-ink sm:h-[196px]">
            <div>
              <p className="text-xs leading-4 font-semibold text-tc-brand-muted">No image yet</p>
              <p className="mt-2 text-lg font-semibold tracking-[-0.015em]">{item.title}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-2.5">
        <div>
          <h2 className="text-base leading-6 font-semibold text-tc-brand-ink sm:text-lg">
            {item.title}
          </h2>
          <p className="mt-0.5 text-[13px] leading-5 text-tc-brand-muted">{formatFoundItemLocationSummary(item)}</p>
        </div>
        <FoundItemStatusBadge status={item.status} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-tc-md bg-tc-brand-soft px-3 py-2.5">
          <p className="text-xs leading-4 font-semibold text-tc-brand-muted">Weight</p>
          <p className="mt-0.5 text-[13px] leading-5 font-semibold tabular-nums text-tc-brand-ink sm:text-sm">{item.weightKg ?? 0} kg</p>
        </div>
        <div className="rounded-tc-md bg-tc-brand-soft px-3 py-2.5">
          <p className="text-xs leading-4 font-semibold text-tc-brand-muted">CO2e</p>
          <p className="mt-0.5 text-[13px] leading-5 font-semibold tabular-nums text-tc-brand-ink sm:text-sm">{item.estimatedCo2eKg} kg</p>
        </div>
        <div className="rounded-tc-md bg-tc-brand-soft px-3 py-2.5">
          <p className="text-xs leading-4 font-semibold text-tc-brand-muted">Distance</p>
          <p className="mt-0.5 text-[13px] leading-5 font-semibold tabular-nums text-tc-brand-ink sm:text-sm">{formatDistance(distanceKm)}</p>
        </div>
      </div>

      <div className="rounded-tc-md border border-tc-brand-line px-3.5 py-3 text-[13px] leading-5 text-tc-brand-body">
        <p className="italic">“{item.description}”</p>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs leading-4 text-tc-brand-muted">
        <span>{formatFoundItemAttribution(item)}</span>
        {isLocating ? <span className="font-semibold text-tc-brand-ink">Tracking live location…</span> : null}
      </div>

      {isLoadingDetails ? <p className="text-xs leading-4 text-tc-brand-muted">Loading request status…</p> : null}
      {detailsError ? <p className="text-[13px] leading-5 text-tc-brand-danger">{detailsError}</p> : null}

      <FoundItemLifecycleActions item={item} currentUserId={currentUserId} viewerClaim={viewerClaim} onChanged={onLifecycleChange} />
      {isOwnPost ? (
        <Link
          to="/found-items/my-posts"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-tc-md bg-tc-brand-deep px-4 py-3 text-sm font-semibold text-white transition hover:bg-tc-brand-hover"
        >
          Open my posts
          <ArrowRight size={16} />
        </Link>
      ) : (
        <div className="space-y-3 rounded-tc-lg border border-tc-brand-line bg-white p-4">
          <div>
            <h3 className="text-sm font-semibold text-tc-brand-ink">Pickup note</h3>
            <p className="mt-1 text-[13px] leading-5 text-tc-brand-muted">
              {viewerHasActiveClaim
                ? 'Your request is already live for this spot.'
                : 'Add a short note for the poster before you send your request.'}
            </p>
          </div>

          <textarea
            value={claimMessage}
            onChange={(event) => setClaimMessage(event.target.value)}
            disabled={viewerHasActiveClaim}
            className="min-h-[88px] w-full rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:outline-none focus:ring-2 focus:ring-tc-brand-mint py-3 transition disabled:cursor-not-allowed disabled:bg-tc-brand-soft"
            placeholder="Can collect this today after work. Happy to confirm by message."
          />

          {!viewerHasActiveClaim ? (
            <button
              type="button"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-tc-md bg-tc-brand-deep px-4 py-3 text-sm font-semibold text-white transition hover:bg-tc-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isClaiming || item.status !== 'available'}
              onClick={() => {
                onClaim(claimMessage)
              }}
            >
              {isClaiming ? 'Sending...' : 'Send pickup request'}
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-tc-md border border-tc-brand-control bg-white px-4 py-3 text-sm font-semibold text-tc-brand-deep transition hover:bg-tc-brand-soft disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isCancelling || (item.status !== 'available' && item.status !== 'claimed')}
              onClick={onCancelClaim}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel request'}
            </button>
          )}

          {item.status !== 'reported' ? (
            <div className="space-y-3 rounded-tc-md bg-tc-brand-soft p-4">
              <div>
                <h3 className="text-sm font-semibold text-tc-brand-ink">Report this spot</h3>
                <p className="mt-1 text-[13px] leading-5 text-tc-brand-muted">
                  Report what you observed. Reports do not confirm pickup or award pickup points.
                </p>
              </div>

              <label className="block text-sm font-semibold text-tc-brand-ink">Report reason
                <select aria-label="Report reason" value={reportReason} onChange={(event) => setReportReason(event.target.value)} className="mt-1.5 min-h-11 font-normal w-full rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:outline-none focus:ring-2 focus:ring-tc-brand-mint">
                  <option value="">Choose a reason</option>
                  <option value="already_gone">Already gone</option>
                  {viewerHasActiveClaim ? <option value="not_there">Not there when I arrived</option> : null}
                  <option value="unsafe">Unsafe</option>
                  <option value="misleading">Misleading</option>
                  <option value="duplicate">Duplicate</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <textarea
                value={reportDetails}
                onChange={(event) => setReportDetails(event.target.value)}
                className="min-h-[80px] w-full rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:outline-none focus:ring-2 focus:ring-tc-brand-mint py-3 transition"
                placeholder="Extra details (optional)"
              />

              <button
                type="button"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-tc-md border border-tc-brand-dangerLine bg-white px-4 py-3 text-sm font-semibold text-tc-brand-danger transition hover:bg-tc-brand-dangerSoft disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isReporting || !reportReason.trim()}
                onClick={() => {
                  onReport(reportReason, reportDetails)
                }}
              >
                {isReporting ? 'Sending report...' : 'Send report'}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default function FoundItemsMapPage() {
  const { user } = useAuthSession()
  const { success, error } = useToast()
  const isMobileViewport = useMediaQuery('(max-width: 767px)')
  const [searchParams] = useSearchParams()
  const highlightId = searchParams.get('highlight')?.trim() ?? ''
  const [items, setItems] = useState<FoundItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [itemsError, setItemsError] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(highlightId || null)
  const [mapFilter, setMapFilter] = useState<MapFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [isClaimingId, setIsClaimingId] = useState<string | null>(null)
  const [isCancellingId, setIsCancellingId] = useState<string | null>(null)
  const [isReportingId, setIsReportingId] = useState<string | null>(null)
  const [liveLocation, setLiveLocation] = useState<GeoPoint | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const locationWatch = useRef<number | null>(null)
  const [focusMode, setFocusMode] = useState<FocusMode>(highlightId ? 'selected' : 'me')
  const [focusRequestKey, setFocusRequestKey] = useState(0)
  const [isMobileItemModalOpen, setIsMobileItemModalOpen] = useState(false)
  const appliedHighlight = useRef('')

  const actor = {
    id: user?.id ?? 'current-user',
    name: [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'You',
    avatarUrl: null,
  }

  const boardRequest = useRef<AbortController | null>(null)
  const loadBoard = useCallback(async () => {
    boardRequest.current?.abort()
    const request = new AbortController()
    boardRequest.current = request
    setIsLoading(true)
    setItemsError(null)

    try {
      const postcode = user?.postcode?.trim() || undefined
      const filters: FoundItemsFilter = {
        postcode,
        sortBy: postcode ? 'nearest' : 'newest',
        maxDistance: postcode ? 5 : undefined,
        includeRecentClosed: true,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
      }
      const response = await fetchFoundItems(filters, 1, 50, request.signal)

      const allItems = [...response.items]
      for (let page = 2; page <= response.pagination.totalPages; page += 1) {
        if (request.signal.aborted) return
        const next = await fetchFoundItems(filters, page, 50, request.signal)
        allItems.push(...next.items)
      }
      let nextItems = allItems.filter((item) => isVisibleMapStatus(item.status))

      if (highlightId && !nextItems.some((item) => item.id === highlightId)) {
        try {
          const highlightResponse = await fetchFoundItemById(highlightId, user?.id, request.signal)
          nextItems = [highlightResponse.item, ...nextItems]
        } catch {
          // Keep the main board responsive even if the highlighted item can no longer be fetched.
        }
      }

      if (request.signal.aborted) return
      setItems(nextItems)
      if (highlightId && appliedHighlight.current !== highlightId && nextItems.some((item) => item.id === highlightId)) {
        appliedHighlight.current = highlightId
        setMapFilter('all')
        setSelectedItemId(highlightId)
        setFocusMode('selected')
        setFocusRequestKey((current) => current + 1)
        setIsMobileItemModalOpen(true)
      }
    } catch {
      if (request.signal.aborted) return
      setItems([])
      setItemsError('Unable to load the live map right now.')
    } finally {
      if (boardRequest.current === request) {
        boardRequest.current = null
        if (!request.signal.aborted) setIsLoading(false)
      }
    }
  }, [highlightId, user?.id, user?.postcode, categoryFilter])

  useEffect(() => {
    if (!highlightId) appliedHighlight.current = ''
    void loadBoard()
    return () => { boardRequest.current?.abort() }
  }, [highlightId, loadBoard])

  const stopLocationWatch = useCallback(() => {
    if (locationWatch.current !== null) {
      navigator.geolocation.clearWatch(locationWatch.current)
      locationWatch.current = null
    }
  }, [])

  useEffect(() => stopLocationWatch, [stopLocationWatch])

  const centreOnMe = () => {
    if (liveLocation && locationWatch.current !== null) {
      setFocusMode('me')
      setFocusRequestKey((current) => current + 1)
      return
    }
    if (locationWatch.current !== null) return
    if (!navigator.geolocation) {
      setLocationError('Live location is unavailable in this browser. You can still use the map.')
      return
    }

    setLocationError(null)
    setIsLocating(true)
    setFocusMode('me')
    setFocusRequestKey((current) => current + 1)
    locationWatch.current = navigator.geolocation.watchPosition(
      (position) => {
        setLiveLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setLocationError(null)
        setIsLocating(false)
      },
      (locationFailure) => {
        stopLocationWatch()
        setLiveLocation(null)
        setLocationError(locationFailure.code === 1
          ? 'Location access was blocked. You can still use the map and menu.'
          : 'Could not get your location. You can still use the map and menu.')
        setIsLocating(false)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 12000,
      },
    )

  }

  useEffect(() => {
    const nextFilteredIds = items
      .filter((item) => {
        if (mapFilter === 'available') {
          return item.status === 'available'
        }

        if (mapFilter === 'fly_tipped') {
          return item.isFlyTipped
        }

        return true
      })
      .map((item) => item.id)

    if (nextFilteredIds.length === 0) {
      setSelectedItemId(null)
      return
    }

    setSelectedItemId((current) => {
      if (current && nextFilteredIds.includes(current)) {
        return current
      }

      if (highlightId && nextFilteredIds.includes(highlightId)) {
        return highlightId
      }

      return nextFilteredIds[0]
    })
  }, [highlightId, items, mapFilter])

  const filteredItems = items.filter((item) => {
    if (mapFilter === 'available') {
      return item.status === 'available'
    }

    if (mapFilter === 'fly_tipped') {
      return item.isFlyTipped
    }

    return true
  })

  const nearbyItems = filteredItems
    .map((item) => ({
      item,
      distanceKm: readDistanceKm(item, liveLocation),
    }))
    .sort((left, right) => {
      const leftDistance = left.distanceKm ?? Number.POSITIVE_INFINITY
      const rightDistance = right.distanceKm ?? Number.POSITIVE_INFINITY
      return leftDistance - rightDistance
    })

  const selectedItem =
    nearbyItems.find((entry) => entry.item.id === selectedItemId)?.item ?? nearbyItems[0]?.item ?? null
  const {
    item: detailedSelectedItem,
    viewerClaim,
    isLoading: isLoadingDetails,
    error: detailsError,
    refresh: refreshDetails,
  } = useFoundItemDetails(selectedItem?.id ?? null, user?.id)
  const selectedItemForPanel = detailedSelectedItem ?? selectedItem
  const selectedDistanceKm = selectedItem ? readDistanceKm(selectedItem, liveLocation) : null
  const selectedItemOwnPost = selectedItem ? selectedItem.poster.id === user?.id : false
  const selectedItemClaimed = Boolean(
    viewerClaim && (viewerClaim.status === 'pending' || viewerClaim.status === 'acknowledged'),
  )
  const selectedPoint = selectedItem ? toGeoPoint(selectedItem) : null
  const focusPoint =
    focusMode === 'selected' && selectedPoint
      ? selectedPoint
      : liveLocation ?? selectedPoint ?? fallbackCenter
  const mapZoom = focusMode === 'selected' && selectedPoint ? selectedItem?.location.precision === 'exact' ? 16 : 14 : liveLocation ? 15 : 13
  const userArea = outwardPostcode(user?.postcode)
  const locationLabel = userArea
    ? `Spot map around ${userArea} · pins show approximate areas`
    : 'Spot map · pins show approximate areas'

  useEffect(() => {
    if (!selectedItem) {
      setIsMobileItemModalOpen(false)
    }
  }, [selectedItem])

  const handleClaim = async (message?: string) => {
    if (!selectedItem || selectedItemOwnPost || selectedItem.status !== 'available') {
      return
    }

    try {
      setIsClaimingId(selectedItem.id)
      await claimFoundItem(selectedItem.id, actor, message)
      success('Interest sent', 'The poster can now see your request.')
      await Promise.all([loadBoard(), refreshDetails()])
    } catch {
      error('Unable to send request', 'Please try again in a moment.')
    } finally {
      setIsClaimingId(null)
    }
  }

  const handleCancelClaim = async () => {
    if (!selectedItem) {
      return
    }

    try {
      setIsCancellingId(selectedItem.id)
      await cancelFoundItemClaim(selectedItem.id, user?.id)
      success('Request cancelled', 'This spot is back on your board as available.')
      await Promise.all([loadBoard(), refreshDetails()])
    } catch {
      error('Unable to cancel request', 'Please try again in a moment.')
    } finally {
      setIsCancellingId(null)
    }
  }

  const handleReport = async (reason: string, details?: string) => {
    if (!selectedItem) {
      return
    }

    try {
      setIsReportingId(selectedItem.id)
      await reportFoundItem(selectedItem.id, reason, details)
      success('Report sent', 'We have flagged this spot for review.')
      await Promise.all([loadBoard(), refreshDetails()])
    } catch {
      error('Unable to send report', 'Please try again in a moment.')
    } finally {
      setIsReportingId(null)
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1120px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[30px] leading-9 font-semibold tracking-[-0.02em] text-tc-brand-ink">Map</h1>
          <p className="mt-1 text-base leading-6 text-tc-brand-body">{locationLabel}</p>
        </div>
        <button
          type="button"
          onClick={centreOnMe}
          disabled={isLocating}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-tc-brand-control bg-white px-5 py-2 text-sm font-semibold text-tc-brand-ink transition hover:bg-tc-brand-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tc-brand-deep disabled:cursor-not-allowed disabled:opacity-50"
        >
          <LocateFixed aria-hidden="true" size={16} />
          {isLocating ? 'Finding your location…' : 'Centre on me'}
        </button>
      </div>

      {itemsError ? <p className="rounded-tc-md border border-tc-brand-dangerLine bg-tc-brand-dangerSoft px-4 py-3 text-sm text-tc-brand-danger">{itemsError}</p> : null}
      {locationError ? <p role="status" className="w-fit rounded-tc-md border border-tc-brand-mintLine bg-tc-brand-mintSoft px-3.5 py-2.5 text-sm leading-5 text-tc-brand-ink">{locationError}</p> : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.38fr)_340px] 2xl:grid-cols-[minmax(0,1.26fr)_360px]">
        <div className="min-w-0 space-y-2">
          <div className="relative isolate overflow-hidden rounded-tc-xl border border-tc-brand-line bg-tc-brand-soft">
            <div className="absolute left-4 top-4 z-[700] flex max-w-[calc(100%-7rem)] flex-col items-start gap-2">
              <div className="inline-flex items-center gap-1 rounded-full border border-tc-brand-line bg-white shadow-tc-card p-1">
                <FilterChip isActive={mapFilter === 'all'} label="All" onClick={() => setMapFilter('all')} />
                <FilterChip isActive={mapFilter === 'available'} label="Live" onClick={() => setMapFilter('available')} />
                <FilterChip isActive={mapFilter === 'fly_tipped'} label="Fly-tipped" onClick={() => setMapFilter('fly_tipped')} />
              </div>
              <div className="inline-flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-tc-brand-line bg-white shadow-tc-card p-1">
                <FilterChip
                  isActive={categoryFilter === 'all'}
                  label="All categories"
                  onClick={() => setCategoryFilter('all')}
                />
                {foundItemCategories.map((cat) => (
                  <FilterChip
                    key={cat}
                    isActive={categoryFilter === cat}
                    label={categoryFilterMeta[cat]}
                    onClick={() => setCategoryFilter(cat)}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              className="absolute right-4 top-4 z-[700] inline-flex min-h-11 items-center gap-1.5 rounded-full border border-tc-brand-control bg-white px-3 py-2 sm:gap-2 sm:px-4 text-sm font-semibold text-tc-brand-ink shadow-tc-card transition hover:bg-tc-brand-soft"
              onClick={() => {
                void loadBoard()
              }}
            >
              {isLoading ? <LoaderCircle size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              Refresh
            </button>

            <MapContainer
              center={[focusPoint.latitude, focusPoint.longitude]}
              zoom={mapZoom}
              zoomControl={false}
              attributionControl={false}
              className="z-0 h-[520px] w-full sm:h-[640px]"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
              <MapViewportSync focusPoint={focusPoint} zoom={mapZoom} requestKey={focusRequestKey} />

              {liveLocation ? (
                <>
                  <CircleMarker
                    center={[liveLocation.latitude, liveLocation.longitude]}
                    radius={20}
                    pathOptions={{
                      color: '#FFFFFF',
                      weight: 0,
                      fillColor: '#6E8AE6',
                      fillOpacity: 0.18,
                    }}
                  />
                  <CircleMarker
                    center={[liveLocation.latitude, liveLocation.longitude]}
                    radius={9}
                    pathOptions={{
                      color: '#FFFFFF',
                      weight: 5,
                      fillColor: '#5A74D6',
                      fillOpacity: 1,
                    }}
                  />
                </>
              ) : null}

              {nearbyItems.flatMap(({ item }) => {
                const point = toGeoPoint(item)
                return point ? [{ item, point }] : []
              }).map(({ item, point }) => (
                <Marker
                  key={item.id}
                  position={[point.latitude, point.longitude]}
                  icon={buildMarkerIcon(item, selectedItem?.id === item.id)}
                  eventHandlers={{
                    click: () => {
                      setSelectedItemId(item.id)
                      setFocusMode('selected')
                      setFocusRequestKey((current) => current + 1)
                      if (isMobileViewport) {
                        setIsMobileItemModalOpen(true)
                      }
                    },
                  }}
                />
              ))}
            </MapContainer>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[700] flex flex-wrap items-end justify-between gap-3 p-4">
              <div className="pointer-events-auto inline-flex flex-wrap items-center gap-3.5 rounded-full border border-tc-brand-line bg-white shadow-tc-card px-4 py-2.5 text-[13px] leading-5 text-tc-brand-ink">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full border border-tc-brand-deep bg-tc-brand-mint" />
                  Live
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full border border-tc-brand-deep bg-white" />
                  Claimed
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full border border-tc-brand-deep bg-tc-brand-deep" />
                  Rescued
                </span>
              </div>

            </div>
          </div>

          <p className="text-xs leading-4 text-tc-brand-muted">Map data © OpenStreetMap contributors</p>
          {nearbyItems.some(({ item }) => !toGeoPoint(item)) ? (
            <section className="rounded-tc-lg border border-tc-brand-line bg-white p-6">
              <h2 className="text-base leading-6 font-semibold text-tc-brand-ink">Spots without a map location</h2>
              <p className="mt-1 text-[13px] leading-5 text-tc-brand-muted">These spots are still available to view. A map location isn't available for them yet.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {nearbyItems.filter(({ item }) => !toGeoPoint(item)).map(({ item }) => (
                  <button key={item.id} type="button" className="min-h-11 rounded-tc-md border border-tc-brand-control bg-white px-3.5 py-2 text-sm font-semibold text-tc-brand-deep underline underline-offset-4 hover:bg-tc-brand-soft"
                    onClick={() => {
                      setSelectedItemId(item.id)
                      if (isMobileViewport) setIsMobileItemModalOpen(true)
                    }}>{item.title}</button>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="relative z-10 hidden rounded-tc-lg border border-tc-brand-line bg-white p-4 md:block lg:p-5">
          <SelectedItemDetails
            key={selectedItemForPanel?.id ?? 'no-item'}
            item={selectedItemForPanel}
            distanceKm={selectedDistanceKm}
            currentUserId={user?.id}
            viewerClaim={viewerClaim}
            onLifecycleChange={() => { void Promise.all([loadBoard(), refreshDetails()]) }}
            isOwnPost={selectedItemOwnPost}
            isLocating={isLocating}
            isClaiming={Boolean(selectedItem && isClaimingId === selectedItem.id)}
            isLoadingDetails={isLoadingDetails}
            isCancelling={Boolean(selectedItem && isCancellingId === selectedItem.id)}
            isReporting={Boolean(selectedItem && isReportingId === selectedItem.id)}
            viewerHasActiveClaim={selectedItemClaimed}
            detailsError={detailsError}
            onClaim={(message) => {
              void handleClaim(message)
            }}
            onCancelClaim={() => {
              void handleCancelClaim()
            }}
            onReport={(reason, details) => {
              void handleReport(reason, details)
            }}
          />
        </aside>
      </div>

      <Modal
        isOpen={isMobileViewport && isMobileItemModalOpen && Boolean(selectedItem)}
        onClose={() => setIsMobileItemModalOpen(false)}
        containerClassName="max-w-[420px] rounded-tc-xl"
        contentClassName="max-h-[calc(100vh-3.5rem)] overflow-y-auto p-4"
      >
        <SelectedItemDetails
          key={selectedItemForPanel?.id ?? 'no-item'}
          item={selectedItemForPanel}
          distanceKm={selectedDistanceKm}
          currentUserId={user?.id}
          viewerClaim={viewerClaim}
          onLifecycleChange={() => { void Promise.all([loadBoard(), refreshDetails()]) }}
          isOwnPost={selectedItemOwnPost}
          isLocating={isLocating}
          isClaiming={Boolean(selectedItem && isClaimingId === selectedItem.id)}
          isLoadingDetails={isLoadingDetails}
          isCancelling={Boolean(selectedItem && isCancellingId === selectedItem.id)}
          isReporting={Boolean(selectedItem && isReportingId === selectedItem.id)}
          viewerHasActiveClaim={selectedItemClaimed}
          detailsError={detailsError}
          onClaim={(message) => {
            void handleClaim(message)
          }}
          onCancelClaim={() => {
            void handleCancelClaim()
          }}
          onReport={(reason, details) => {
            void handleReport(reason, details)
          }}
        />
      </Modal>
    </div>
  )
}
