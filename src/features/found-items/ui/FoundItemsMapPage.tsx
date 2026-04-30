import 'leaflet/dist/leaflet.css'

import { divIcon, point } from 'leaflet'
import { ArrowRight, LoaderCircle, LocateFixed, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CircleMarker, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'
import {
  claimFoundItem,
  fetchFoundItemById,
  fetchFoundItems,
} from '../api/foundItemsApi'
import type { FoundItem, FoundItemStatus } from '../types'
import { FoundItemStatusBadge } from './components/FoundItemStatusBadge'
import {
  formatFoundItemAttribution,
  formatFoundItemLocationSummary,
} from './components/foundItemDisplay'
import { useAuthSession } from '@/shared/context/useAuthSession'
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

export default function FoundItemsMapPage() {
  const { user } = useAuthSession()
  const { success, error } = useToast()
  const [searchParams] = useSearchParams()
  const highlightId = searchParams.get('highlight')?.trim() ?? ''
  const [items, setItems] = useState<FoundItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [itemsError, setItemsError] = useState<string | null>(null)
  const [selectedItemId, setSelectedItemId] = useState<string | null>(highlightId || null)
  const [mapFilter, setMapFilter] = useState<MapFilter>('all')
  const [isClaimingId, setIsClaimingId] = useState<string | null>(null)
  const [claimedItemIds, setClaimedItemIds] = useState<string[]>([])
  const [liveLocation, setLiveLocation] = useState<GeoPoint | null>(null)
  const [isLocating, setIsLocating] = useState(true)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [focusMode, setFocusMode] = useState<FocusMode>(highlightId ? 'selected' : 'me')
  const [focusRequestKey, setFocusRequestKey] = useState(0)

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
  const selectedDistanceKm = selectedItem ? readDistanceKm(selectedItem, liveLocation) : null
  const selectedItemOwnPost = selectedItem ? selectedItem.poster.id === user?.id : false
  const selectedItemClaimed = selectedItem ? claimedItemIds.includes(selectedItem.id) : false
  const selectedPoint = selectedItem ? toGeoPoint(selectedItem) : null
  const focusPoint =
    focusMode === 'selected' && selectedPoint
      ? selectedPoint
      : liveLocation ?? selectedPoint ?? fallbackCenter
  const mapZoom = focusMode === 'selected' && selectedPoint ? 16 : liveLocation ? 15 : 13
  const liveCount = items.filter((item) => item.status === 'available').length
  const claimedCount = items.filter((item) => item.status === 'claimed').length
  const rescuedCount = items.filter((item) => item.status === 'picked_up').length
  const locationLabel = user?.postcode?.trim()
    ? `Live spots around ${user.postcode.trim().toUpperCase()} · tap a pin to rescue`
    : 'Live spots around you · tap a pin to rescue'

  const handleClaim = async () => {
    if (!selectedItem || selectedItemOwnPost || selectedItem.status !== 'available') {
      return
    }

    try {
      setIsClaimingId(selectedItem.id)
      await claimFoundItem(selectedItem.id, actor)
      setClaimedItemIds((currentIds) =>
        currentIds.includes(selectedItem.id) ? currentIds : [...currentIds, selectedItem.id],
      )
      success('Interest sent', 'The poster can now see your request.')
      await loadBoard()
    } catch {
      error('Unable to send request', 'Please try again in a moment.')
    } finally {
      setIsClaimingId(null)
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

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_320px]">
        <div className="space-y-2">
          <div className="relative overflow-hidden rounded-[30px] border border-[#E4E8D8] bg-[#EEF3E6] shadow-sm">
            <div className="absolute left-4 top-4 z-[500] flex items-center gap-1 rounded-full bg-white/95 p-1 shadow-[0_12px_30px_rgba(148,163,184,0.16)] backdrop-blur">
              <FilterChip isActive={mapFilter === 'all'} label="All" onClick={() => setMapFilter('all')} />
              <FilterChip isActive={mapFilter === 'available'} label="Live" onClick={() => setMapFilter('available')} />
              <FilterChip isActive={mapFilter === 'fly_tipped'} label="Fly-tipped" onClick={() => setMapFilter('fly_tipped')} />
            </div>

            <button
              type="button"
              className="absolute right-4 top-4 z-[500] inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_12px_30px_rgba(148,163,184,0.16)] backdrop-blur transition hover:text-slate-950"
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
              className="h-[520px] w-full sm:h-[640px]"
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
                    },
                  }}
                />
              ))}
            </MapContainer>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-4">
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

        <aside className="rounded-[28px] border border-[#E5E7EB] bg-white p-4 shadow-sm">
          {selectedItem ? (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,#E3F0C7_0%,#F2F7E6_100%)]">
                {selectedItem.images[0] ? (
                  <img
                    src={selectedItem.images[0].url}
                    alt={selectedItem.title}
                    className="h-[220px] w-full object-cover"
                  />
                ) : (
                  <div className="flex h-[220px] items-center justify-center text-center text-[#446B16]">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.24em]">No image yet</p>
                      <p className="mt-3 text-3xl font-bold tracking-[-0.03em]">{selectedItem.title}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-[2rem] font-semibold tracking-[-0.04em] text-slate-950">{selectedItem.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{formatFoundItemLocationSummary(selectedItem)}</p>
                </div>
                <FoundItemStatusBadge status={selectedItem.status} />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-[#F3F5EE] px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Weight</p>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{selectedItem.weightKg ?? 0} kg</p>
                </div>
                <div className="rounded-2xl bg-[#F3F5EE] px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">CO2e</p>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{selectedItem.estimatedCo2eKg} kg</p>
                </div>
                <div className="rounded-2xl bg-[#F3F5EE] px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Distance</p>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-slate-950">{formatDistance(selectedDistanceKm)}</p>
                </div>
              </div>

              <div className="rounded-2xl bg-[#F7FAF1] px-4 py-4 text-sm leading-7 text-slate-600">
                <p className="italic">“{selectedItem.description}”</p>
              </div>

              <div className="flex items-center justify-between gap-3 text-sm text-slate-500">
                <span>{formatFoundItemAttribution(selectedItem)}</span>
                {isLocating ? <span className="font-medium text-[#446B16]">Tracking live location…</span> : null}
              </div>

              {selectedItemOwnPost ? (
                <Link
                  to="/found-items/my-posts"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#111611] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#1B231B]"
                >
                  Open my posts
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#111611] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#1B231B] disabled:cursor-not-allowed disabled:bg-slate-300"
                  disabled={
                    isClaimingId === selectedItem.id ||
                    selectedItem.status !== 'available' ||
                    selectedItemClaimed
                  }
                  onClick={() => {
                    void handleClaim()
                  }}
                >
                  {selectedItemClaimed
                    ? 'Interest sent'
                    : isClaimingId === selectedItem.id
                      ? 'Sending...'
                      : 'Rescue this'}
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          ) : (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center rounded-[24px] bg-[#F7FAF1] px-6 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">No spots yet</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-950">Nothing matches this view</h2>
              <p className="mt-3 max-w-[240px] text-sm leading-6 text-slate-500">
                Switch filters or refresh the board to pull in more nearby finds.
              </p>
            </div>
          )}

          <div className="mt-4 grid grid-cols-3 gap-2 rounded-[22px] bg-[#F8FAFC] p-3 text-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Live</p>
              <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950">{liveCount}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Claimed</p>
              <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950">{claimedCount}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Rescued</p>
              <p className="mt-1 text-xl font-semibold tracking-[-0.03em] text-slate-950">{rescuedCount}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}