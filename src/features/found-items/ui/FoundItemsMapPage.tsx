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
import type { FoundItem, FoundItemStatus } from '../types'
import { useFoundItemDetails } from '../hooks/useFoundItemDetails'
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
type FocusMode = 'me' | 'selected'

interface GeoPoint {
  readonly latitude: number
  readonly longitude: number
}

const fallbackCenter: GeoPoint = {
  latitude: 51.5394,
  longitude: 0.0812,
}

function hasMapLocation(item: FoundItem): boolean {
  return (
    Number.isFinite(item.location.latitude) &&
    Number.isFinite(item.location.longitude) &&
    !(item.location.latitude === 0 && item.location.longitude === 0)
  )
}

function isVisibleMapStatus(status: FoundItemStatus): boolean {
  return status === 'available' || status === 'claimed' || status === 'picked_up'
}

function toGeoPoint(item: FoundItem): GeoPoint {
  return {
    latitude: item.location.latitude,
    longitude: item.location.longitude,
  }
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
  if (liveLocation && hasMapLocation(item)) {
    return distanceBetweenPoints(liveLocation, toGeoPoint(item))
  }

  return item.location.approximateDistance
}

function formatDistance(distanceKm: number | null): string {
  if (distanceKm === null || !Number.isFinite(distanceKm)) {
    return '—'
  }

  if (distanceKm < 1) {
    return `${Math.max(50, Math.round(distanceKm * 1000))} m`
  }

  if (distanceKm < 10) {
    return `${distanceKm.toFixed(1)} km`
  }

  return `${Math.round(distanceKm)} km`
}

function markerPalette(status: FoundItemStatus): {
  readonly fill: string
  readonly text: string
  readonly shadow: string
} {
  if (status === 'claimed') {
    return {
      fill: '#F0A338',
      text: '#FFFFFF',
      shadow: 'rgba(240, 163, 56, 0.28)',
    }
  }

  if (status === 'picked_up') {
    return {
      fill: '#A8B0AA',
      text: '#FFFFFF',
      shadow: 'rgba(148, 163, 184, 0.22)',
    }
  }

  return {
    fill: '#2FB463',
    text: '#FFFFFF',
    shadow: 'rgba(47, 180, 99, 0.26)',
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
        <div style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:999px;background:${palette.fill};color:${palette.text};font:700 13px/1 system-ui, sans-serif;border:3px solid #FFFFFF;box-shadow:${isSelected ? '0 0 0 5px rgba(255,255,255,0.75)' : 'none'};">
          ${label}
        </div>
        <div style="width:${pointerSize}px;height:${pointerSize}px;margin-top:-4px;transform:rotate(45deg);background:${palette.fill};border-right:3px solid #FFFFFF;border-bottom:3px solid #FFFFFF;"></div>
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
        'rounded-full px-4 py-2 text-sm font-semibold transition',
        isActive ? 'bg-[#111611] text-white shadow-[0_10px_20px_rgba(17,22,17,0.2)]' : 'text-slate-500 hover:text-slate-900',
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

  useEffect(() => {
    setClaimMessage('')
    setReportReason('')
    setReportDetails('')
  }, [item?.id])

  if (!item) {
    return (
      <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-[24px] bg-[#F7FAF1] px-6 text-center">
        <p className="text-sm font-semibold text-slate-400">No spots yet</p>
        <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-slate-950">Nothing matches this view</h2>
        <p className="mt-2 max-w-[240px] text-sm leading-6 text-slate-500">
          Switch filters or refresh the board to pull in more nearby finds.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      <div className="aspect-square overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,#E3F0C7_0%,#F2F7E6_100%)] sm:aspect-auto">
        {item.images[0] ? (
          <img src={item.images[0].url} alt={item.title} className="h-full w-full object-cover sm:h-[196px]" />
        ) : (
          <div className="flex h-full items-center justify-center text-center text-[#446B16] sm:h-[196px]">
            <div>
              <p className="text-xs font-semibold tracking-[0.01em]">No image yet</p>
              <p className="mt-2 text-lg font-bold tracking-[-0.03em]">{item.title}</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-start justify-between gap-2.5">
        <div>
          <h2 className="text-[0.95rem] font-semibold leading-snug tracking-[-0.02em] text-slate-950 sm:text-[1.02rem]">
            {item.title}
          </h2>
          <p className="mt-0.5 text-[0.78rem] leading-5 text-slate-500">{formatFoundItemLocationSummary(item)}</p>
        </div>
        <FoundItemStatusBadge status={item.status} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-[#F3F5EE] px-3 py-2.5">
          <p className="text-[0.62rem] font-semibold tracking-[0.01em] text-slate-400">Weight</p>
          <p className="mt-0.5 text-[0.78rem] font-semibold tracking-[-0.01em] text-slate-950 sm:text-[0.86rem]">{item.weightKg ?? 0} kg</p>
        </div>
        <div className="rounded-2xl bg-[#F3F5EE] px-3 py-2.5">
          <p className="text-[0.62rem] font-semibold tracking-[0.01em] text-slate-400">CO2e</p>
          <p className="mt-0.5 text-[0.78rem] font-semibold tracking-[-0.01em] text-slate-950 sm:text-[0.86rem]">{item.estimatedCo2eKg} kg</p>
        </div>
        <div className="rounded-2xl bg-[#F3F5EE] px-3 py-2.5">
          <p className="text-[0.62rem] font-semibold tracking-[0.01em] text-slate-400">Distance</p>
          <p className="mt-0.5 text-[0.78rem] font-semibold tracking-[-0.01em] text-slate-950 sm:text-[0.86rem]">{formatDistance(distanceKm)}</p>
        </div>
      </div>

      <div className="rounded-2xl bg-[#F7FAF1] px-3.5 py-3 text-[0.8rem] leading-5 text-slate-600">
        <p className="italic">“{item.description}”</p>
      </div>

      <div className="flex items-center justify-between gap-2 text-[0.72rem] text-slate-500">
        <span>{formatFoundItemAttribution(item)}</span>
        {isLocating ? <span className="font-medium text-[#446B16]">Tracking live location…</span> : null}
      </div>

      {isLoadingDetails ? <p className="text-xs text-slate-400">Loading request status…</p> : null}
      {detailsError ? <p className="text-xs text-rose-600">{detailsError}</p> : null}

      {isOwnPost ? (
        <Link
          to="/found-items/my-posts"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#111611] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#1B231B]"
        >
          Open my posts
          <ArrowRight size={16} />
        </Link>
      ) : (
        <div className="space-y-3 rounded-[24px] border border-slate-200 bg-white p-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Pickup note</h3>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {viewerHasActiveClaim
                ? 'Your request is already live for this spot.'
                : 'Add a short note for the poster before you send your request.'}
            </p>
          </div>

          <textarea
            value={claimMessage}
            onChange={(event) => setClaimMessage(event.target.value)}
            disabled={viewerHasActiveClaim}
            className="min-h-[88px] w-full rounded-[16px] border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#87C15F] focus:ring-4 focus:ring-[#EAF6DA] disabled:cursor-not-allowed disabled:bg-slate-100"
            placeholder="Can collect this today after work. Happy to confirm by message."
          />

          {!viewerHasActiveClaim ? (
            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#111611] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#1B231B] disabled:cursor-not-allowed disabled:bg-slate-300"
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
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
              disabled={isCancelling || item.status === 'picked_up' || item.status === 'reported'}
              onClick={onCancelClaim}
            >
              {isCancelling ? 'Cancelling...' : 'Cancel request'}
            </button>
          )}

          {item.status !== 'reported' ? (
            <div className="space-y-3 rounded-[20px] bg-[#F8FAFC] p-3.5">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Report this spot</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Flag misleading, unsafe or duplicate posts for review.
                </p>
              </div>

              <input
                value={reportReason}
                onChange={(event) => setReportReason(event.target.value)}
                className="h-11 w-full rounded-[14px] border border-slate-200 px-3 text-sm text-slate-900 outline-none transition focus:border-[#87C15F] focus:ring-4 focus:ring-[#EAF6DA]"
                placeholder="Reason for reporting"
              />

              <textarea
                value={reportDetails}
                onChange={(event) => setReportDetails(event.target.value)}
                className="min-h-[80px] w-full rounded-[14px] border border-slate-200 px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-[#87C15F] focus:ring-4 focus:ring-[#EAF6DA]"
                placeholder="Extra details (optional)"
              />

              <button
                type="button"
                className="inline-flex w-full items-center justify-center rounded-full bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
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
  const [isClaimingId, setIsClaimingId] = useState<string | null>(null)
  const [isCancellingId, setIsCancellingId] = useState<string | null>(null)
  const [isReportingId, setIsReportingId] = useState<string | null>(null)
  const [liveLocation, setLiveLocation] = useState<GeoPoint | null>(null)
  const [isLocating, setIsLocating] = useState(true)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [focusMode, setFocusMode] = useState<FocusMode>(highlightId ? 'selected' : 'me')
  const [focusRequestKey, setFocusRequestKey] = useState(0)
  const [isMobileItemModalOpen, setIsMobileItemModalOpen] = useState(Boolean(highlightId))
  const {
    item: detailedSelectedItem,
    viewerClaim,
    isLoading: isLoadingDetails,
    error: detailsError,
    refresh: refreshDetails,
  } = useFoundItemDetails(selectedItemId, user?.id)

  const actor = {
    id: user?.id ?? 'current-user',
    name: [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'You',
    avatarUrl: null,
  }

  const loadBoard = useCallback(async () => {
    setIsLoading(true)
    setItemsError(null)

    try {
      const response = await fetchFoundItems(
        {
          postcode: user?.postcode?.trim() || undefined,
          sortBy: user?.postcode ? 'nearest' : 'newest',
        },
        1,
        50,
      )

      let nextItems = response.items.filter((item) => hasMapLocation(item) && isVisibleMapStatus(item.status))

      if (highlightId) {
        try {
          const highlightResponse = await fetchFoundItemById(highlightId, user?.id)
          if (!nextItems.some((item) => item.id === highlightResponse.item.id) && hasMapLocation(highlightResponse.item)) {
            nextItems = [highlightResponse.item, ...nextItems]
          }
        } catch {
          // Keep the main board responsive even if the highlighted item can no longer be fetched.
        }
      }

      setItems(nextItems)
    } catch {
      setItemsError('Unable to load the live map right now.')
    } finally {
      setIsLoading(false)
    }
  }, [highlightId, user?.id, user?.postcode])

  useEffect(() => {
    void loadBoard()
  }, [loadBoard])

  useEffect(() => {
    if (!navigator.geolocation) {
      setIsLocating(false)
      setLocationError('Live location is not available in this browser.')
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLiveLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setLocationError(null)
        setIsLocating(false)
      },
      () => {
        setLocationError('Allow location access to keep nearby spots updated as you move.')
        setIsLocating(false)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 12000,
      },
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

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
  const mapZoom = focusMode === 'selected' && selectedPoint ? 16 : liveLocation ? 15 : 13
  const locationLabel = user?.postcode?.trim()
    ? `Live spots around ${user.postcode.trim().toUpperCase()} · tap a pin to rescue`
    : 'Live spots around you · tap a pin to rescue'

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
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-[-0.03em] text-slate-950">Map</h1>
        <p className="mt-1 text-sm text-slate-500">{locationLabel}</p>
      </div>

      {itemsError ? <p className="text-sm text-rose-600">{itemsError}</p> : null}
      {locationError ? <p className="text-sm text-amber-700">{locationError}</p> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.38fr)_340px] 2xl:grid-cols-[minmax(0,1.26fr)_360px]">
        <div className="min-w-0 space-y-2">
          <div className="relative isolate overflow-hidden rounded-[30px] border border-[#E4E8D8] bg-[#EEF3E6] shadow-sm">
            <div className="absolute left-4 top-4 z-[700] flex items-center gap-1 rounded-full bg-white/95 p-1 shadow-[0_12px_30px_rgba(148,163,184,0.16)] backdrop-blur">
              <FilterChip isActive={mapFilter === 'all'} label="All" onClick={() => setMapFilter('all')} />
              <FilterChip isActive={mapFilter === 'available'} label="Live" onClick={() => setMapFilter('available')} />
              <FilterChip isActive={mapFilter === 'fly_tipped'} label="Fly-tipped" onClick={() => setMapFilter('fly_tipped')} />
            </div>

            <button
              type="button"
              className="absolute right-4 top-4 z-[700] inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_12px_30px_rgba(148,163,184,0.16)] backdrop-blur transition hover:text-slate-950"
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

              {nearbyItems.map(({ item }) => (
                <Marker
                  key={item.id}
                  position={[item.location.latitude, item.location.longitude]}
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
              <div className="pointer-events-auto inline-flex flex-wrap items-center gap-4 rounded-full bg-white/95 px-4 py-3 text-sm text-slate-600 shadow-[0_12px_30px_rgba(148,163,184,0.16)] backdrop-blur">
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#2FB463]" />
                  Live
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#F0A338]" />
                  Claimed
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#A8B0AA]" />
                  Rescued
                </span>
              </div>

              <button
                type="button"
                className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-3 text-sm font-semibold text-slate-800 shadow-[0_12px_30px_rgba(148,163,184,0.16)] backdrop-blur transition hover:text-slate-950"
                onClick={() => {
                  if (!liveLocation) {
                    error('Location unavailable', 'Allow location access to centre the map on you.')
                    return
                  }

                  setFocusMode('me')
                  setFocusRequestKey((current) => current + 1)
                }}
              >
                <LocateFixed size={16} />
                Centre on me
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-400">Map data © OpenStreetMap contributors</p>
        </div>

        <aside className="relative z-10 hidden rounded-[28px] border border-[#E5E7EB] bg-white p-4 shadow-sm md:block lg:p-5">
          <SelectedItemDetails
            item={selectedItemForPanel}
            distanceKm={selectedDistanceKm}
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
        containerClassName="max-w-[420px] rounded-[28px]"
        contentClassName="max-h-[calc(100vh-3.5rem)] overflow-y-auto p-4"
      >
        <SelectedItemDetails
          item={selectedItemForPanel}
          distanceKm={selectedDistanceKm}
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