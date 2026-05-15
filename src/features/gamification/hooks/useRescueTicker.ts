import { useEffect, useState } from 'react'
import { WebSocketClient } from '@/shared/lib/websocket/client'
import { playClip } from '@/shared/lib/sound/playClip'

export interface RescueTickerEvent {
  readonly id: string
  readonly title: string
  readonly category?: string | null
  readonly postcode?: string | null
  readonly co2eKg?: number | null
  readonly impactPoints?: number | null
  readonly rescuerName?: string | null
  readonly imageUrl?: string | null
  readonly kind: 'rescue' | 'flytip'
  readonly receivedAt: string
}

interface RescueServerEvents extends Record<string, (...args: never[]) => void> {
  'rescue:new': (payload: unknown) => void
  'rescue:flytip': (payload: unknown) => void
}

interface RescueClientEvents extends Record<string, (...args: never[]) => void> {}

const RESCUE_POP_SRC = '/sounds/rescue-pop.mp3'
const FLYTIP_SIGH_SRC = '/sounds/flytip-sigh.mp3'

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function normaliseRescueEvent(raw: unknown, kind: 'rescue' | 'flytip'): RescueTickerEvent | null {
  const record = asRecord(raw)
  if (!record) return null

  const id = readString(record.id) ?? readString(record.foundItemId)
  if (!id) return null

  return {
    id,
    title: readString(record.title) ?? 'Item rescued',
    category: readString(record.category) ?? null,
    postcode: readString(record.postcode) ?? null,
    co2eKg: readNumber(record.co2eKg) ?? readNumber(record.estimatedCo2eKg) ?? null,
    impactPoints: readNumber(record.impactPoints) ?? null,
    rescuerName: readString(record.rescuerName) ?? readString(record.userName) ?? null,
    imageUrl: readString(record.imageUrl) ?? null,
    kind,
    receivedAt: readString(record.ts) ?? new Date().toISOString(),
  }
}

interface UseRescueTickerOptions {
  /** Maximum number of events to keep in memory. Default 12. */
  readonly bufferSize?: number
  /** Disable to silence sound effects regardless of global mute. */
  readonly playSounds?: boolean
}

export function useRescueTicker({
  bufferSize = 12,
  playSounds = true,
}: UseRescueTickerOptions = {}): RescueTickerEvent[] {
  const [events, setEvents] = useState<RescueTickerEvent[]>([])

  useEffect(() => {
    const client = new WebSocketClient<RescueServerEvents, RescueClientEvents>({
      namespace: '/notifications',
    })

    const handleRescue = (raw: unknown) => {
      const event = normaliseRescueEvent(raw, 'rescue')
      if (!event) return
      if (playSounds) playClip(RESCUE_POP_SRC, 0.55)
      setEvents((current) => [event, ...current].slice(0, bufferSize))
    }

    const handleFlytip = (raw: unknown) => {
      const event = normaliseRescueEvent(raw, 'flytip')
      if (!event) return
      if (playSounds) playClip(FLYTIP_SIGH_SRC, 0.4)
      setEvents((current) => [event, ...current].slice(0, bufferSize))
    }

    client.connect()
    client.on('rescue:new', handleRescue)
    client.on('rescue:flytip', handleFlytip)

    return () => {
      client.off('rescue:new', handleRescue)
      client.off('rescue:flytip', handleFlytip)
      client.disconnect()
    }
  }, [bufferSize, playSounds])

  return events
}
