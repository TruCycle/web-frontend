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
}, signal?: AbortSignal): Promise<NotificationItem[]> {
  const query = new URLSearchParams()
  if (params?.limit) {
    query.set('limit', String(clampLimit(params.limit)))
  }
  if (params?.unreadOnly) {
    query.set('unread', 'true')
  }

  const response = await apiRequest<unknown>(
    `/notifications${query.size > 0 ? `?${query.toString()}` : ''}`,
    { signal },
  )
  const data = unwrapApiData<unknown>(response)
  if (!Array.isArray(data)) {
    throw new Error('Notifications could not be confirmed.')
  }

  const items = data.map((entry) => mapNotification(entry))
  if (items.some((item) => item === null)) throw new Error('Notifications could not be confirmed.')
  return items.filter((item): item is NotificationItem => item !== null)
}

export async function fetchUnreadNotificationsCount(signal?: AbortSignal): Promise<number> {
  const response = await apiRequest<unknown>('/notifications/unread-count', { signal })
  const payload = unwrapApiData<unknown>(response)
  const data = asRecord(payload)
  const count = data?.count
  if (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0) {
    throw new Error('Unread notification count could not be confirmed.')
  }
  return count
}

export async function markNotificationsRead(ids?: string[]): Promise<void> {
  const response = ids
    ? await apiRequest<unknown, { ids: string[] }>('/notifications/read', { method: 'POST', body: { ids } })
    : await apiRequest<unknown>('/notifications/read-all', { method: 'POST' })
  const result = asRecord(unwrapApiData<unknown>(response))
  if (typeof result?.updated !== 'number' || !Number.isSafeInteger(result.updated) || result.updated < 0) {
    throw new Error('Notification read status could not be confirmed.')
  }
}
