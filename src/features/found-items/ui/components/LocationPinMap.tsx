import 'leaflet/dist/leaflet.css'

import { divIcon, point, type LeafletMouseEvent } from 'leaflet'
import { useCallback, useEffect, useMemo } from 'react'
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'

export interface LatLngPoint {
  readonly latitude: number
  readonly longitude: number
}

interface LocationPinMapProps {
  /** The device's live GPS reading — the map recentres here when it changes. */
  readonly liveLocation: LatLngPoint | null
  /** The currently chosen pin position (defaults to liveLocation). */
  readonly value: LatLngPoint | null
  readonly onChange: (next: LatLngPoint) => void
  readonly heightClassName?: string
}

const pinIcon = divIcon({
  className: '',
  iconSize: point(34, 44),
  iconAnchor: point(17, 42),
  html: `
    <div style="filter:drop-shadow(0 8px 14px rgba(0,0,0,0.28));">
      <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17 43C17 43 32 27.4 32 16.5C32 8.49 25.28 2 17 2C8.72 2 2 8.49 2 16.5C2 27.4 17 43 17 43Z" fill="#447D24" stroke="#FFFFFF" stroke-width="3"/>
        <circle cx="17" cy="16.5" r="5" fill="#FFFFFF"/>
      </svg>
    </div>
  `,
})

function RecenterOnLiveLocation({ liveLocation }: { readonly liveLocation: LatLngPoint | null }) {
  const map = useMap()
  const latitude = liveLocation?.latitude ?? null
  const longitude = liveLocation?.longitude ?? null

  useEffect(() => {
    if (latitude === null || longitude === null) {
      return
    }

    map.setView([latitude, longitude], Math.max(map.getZoom(), 17))
  }, [map, latitude, longitude])

  return null
}

function TapToPlacePin({ onChange }: { readonly onChange: (next: LatLngPoint) => void }) {
  useMapEvents({
    click(event: LeafletMouseEvent) {
      onChange({ latitude: event.latlng.lat, longitude: event.latlng.lng })
    },
  })
  return null
}

export function LocationPinMap({
  liveLocation,
  value,
  onChange,
  heightClassName = 'h-64',
}: LocationPinMapProps) {
  const pin = value ?? liveLocation
  const center = useMemo<[number, number]>(
    () => (pin ? [pin.latitude, pin.longitude] : [51.5074, -0.1278]),
    [pin],
  )

  const handleDragEnd = useCallback(
    (event: { target: { getLatLng: () => { lat: number; lng: number } } }) => {
      const { lat, lng } = event.target.getLatLng()
      onChange({ latitude: lat, longitude: lng })
    },
    [onChange],
  )

  if (!pin) {
    return (
      <div
        className={`flex ${heightClassName} items-center justify-center rounded-[24px] bg-[#EEF1E6] text-sm text-slate-500`}
      >
        Waiting for GPS…
      </div>
    )
  }

  return (
    <div className={`overflow-hidden rounded-[24px] ${heightClassName}`}>
      <MapContainer
        center={center}
        zoom={17}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <RecenterOnLiveLocation liveLocation={liveLocation} />
        <TapToPlacePin onChange={onChange} />
        <Marker
          position={[pin.latitude, pin.longitude]}
          icon={pinIcon}
          draggable
          eventHandlers={{ dragend: handleDragEnd }}
        />
      </MapContainer>
    </div>
  )
}
