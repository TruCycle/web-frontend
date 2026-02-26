import { apiRequest } from '@/shared/lib/api/client'
import type { NotificationItem } from '@/features/notifications/types'

const storageKey = 'trucycle.notifications'
export const notificationsUpdatedEventName = 'trucycle-notifications-updated'
const fallbackNotifications: NotificationItem[] = [
  {
    id: 'seed-notification-1',
    title: 'Welcome to TruCycle',
    description:
      'This notification is local fallback data until backend endpoints are connected.',
    createdAt: '2026-02-16T00:00:00.000Z',
    isRead: false,
  },
]

interface ApiEnvelope<TData> {
  readonly status: string
  readonly message: string
  readonly data: TData
}

interface ApiNotificationItem {
  readonly id: string
  readonly title?: string
  readonly description?: string
  readonly body?: string
  readonly createdAt?: string
  readonly created_at?: string
  readonly isRead?: boolean
  readonly read?: boolean
}

function isNotificationItem(value: unknown): value is NotificationItem {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Partial<NotificationItem>

  return (
    typeof candidate.id === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.description === 'string' &&
    typeof candidate.createdAt === 'string' &&
    typeof candidate.isRead === 'boolean'
  )
}

function readStoredNotifications(): NotificationItem[] {
  const storedValue = window.localStorage.getItem(storageKey)
  if (!storedValue) {
    return []
  }

  try {
    const parsed = JSON.parse(storedValue) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(isNotificationItem)
  } catch {
    return []
  }
}

function writeStoredNotifications(notifications: NotificationItem[]): void {
  window.localStorage.setItem(storageKey, JSON.stringify(notifications))
  window.dispatchEvent(new Event(notificationsUpdatedEventName))
}

function isApiNotificationItem(value: unknown): value is ApiNotificationItem {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as Partial<ApiNotificationItem>
  return typeof candidate.id === 'string'
}

function mapApiNotification(value: ApiNotificationItem): NotificationItem {
  return {
    id: value.id,
    title: value.title ?? 'Notification',
    description: value.description ?? value.body ?? '',
    createdAt: value.createdAt ?? value.created_at ?? new Date().toISOString(),
    isRead: typeof value.isRead === 'boolean' ? value.isRead : Boolean(value.read),
  }
}

function normalizeNotificationsPayload(payload: unknown): NotificationItem[] {
  const maybeEnvelope = payload as Partial<ApiEnvelope<unknown>>
  const collection = Array.isArray(payload)
    ? payload
    : Array.isArray(maybeEnvelope.data)
      ? maybeEnvelope.data
      : []

  return collection
    .filter(isApiNotificationItem)
    .map(mapApiNotification)
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  try {
    const response = await apiRequest<unknown>('/notifications')
    const normalized = normalizeNotificationsPayload(response)
    if (normalized.length > 0) {
      writeStoredNotifications(normalized)
      return normalized
    }

    const localNotifications = readStoredNotifications()
    if (localNotifications.length > 0) {
      return localNotifications
    }

    writeStoredNotifications(fallbackNotifications)
    return fallbackNotifications
  } catch {
    const localNotifications = readStoredNotifications()
    if (localNotifications.length > 0) {
      return localNotifications
    }

    writeStoredNotifications(fallbackNotifications)
    return fallbackNotifications
  }
}

export async function markNotificationAsRead(notificationId: string): Promise<void> {
  const currentNotifications = readStoredNotifications()
  const nextNotifications = currentNotifications.map((notification) =>
    notification.id === notificationId
      ? { ...notification, isRead: true }
      : notification,
  )
  writeStoredNotifications(nextNotifications)

  try {
    await apiRequest<void>(`/notifications/${notificationId}/read`, {
      method: 'POST',
    })
  } catch {
    // Local optimistic update is enough for scaffold mode.
  }
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const currentNotifications = readStoredNotifications()
  const nextNotifications = currentNotifications.map((notification) => ({
    ...notification,
    isRead: true,
  }))
  writeStoredNotifications(nextNotifications)

  try {
    await apiRequest<void>('/notifications/read-all', {
      method: 'POST',
    })
  } catch {
    // Local optimistic update is enough for scaffold mode.
  }
}
