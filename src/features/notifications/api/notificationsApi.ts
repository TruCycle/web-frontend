import { apiRequest } from '@/shared/lib/api/client'
import { unwrapApiData } from '@/shared/lib/api/envelope'
import { clampLimit } from '@/shared/lib/api/query'
import type { NotificationItem } from '@/features/notifications/types'

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function mapNotification(value: unknown): NotificationItem | null {
  const item = asRecord(value)
  const id = readString(item?.id)
  const title = readString(item?.title)
  if (!item || !id || !title) {
    return null
  }

  const rawData = item.data
  const parsedData =
    rawData && typeof rawData === 'object' && !Array.isArray(rawData)
      ? (rawData as Record<string, unknown>)
      : null

  return {
    id,
    type: readString(item.type) ?? 'general',
    title,
    body: readString(item.body) ?? '',
    data: parsedData,
    createdAt: readString(item.createdAt) ?? new Date().toISOString(),
    readAt: readString(item.readAt),
    isRead: Boolean(item.read),
  }
}

export async function fetchNotifications(params?: {
  readonly unreadOnly?: boolean
  readonly limit?: number
}): Promise<NotificationItem[]> {
  const query = new URLSearchParams()
  if (params?.limit) {
    query.set('limit', String(clampLimit(params.limit)))
  }
  if (params?.unreadOnly) {
    query.set('unread', 'true')
  }

  const response = await apiRequest<unknown>(
    `/notifications${query.size > 0 ? `?${query.toString()}` : ''}`,
  )
  const data = unwrapApiData<unknown>(response)
  if (!Array.isArray(data)) {
    return []
  }

  return data
    .map((entry) => mapNotification(entry))
    .filter((entry): entry is NotificationItem => entry !== null)
}

export async function fetchUnreadNotificationsCount(): Promise<number> {
  const response = await apiRequest<unknown>('/notifications/unread-count')
  const payload = unwrapApiData<unknown>(response)
  const data = asRecord(payload)
  const count = data?.count
  return typeof count === 'number' && Number.isFinite(count) ? count : 0
}
