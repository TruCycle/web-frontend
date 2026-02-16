import { apiRequest } from '@/shared/lib/api/client'
import type { NotificationItem } from '@/features/notifications/types'

const storageKey = 'trucycle.notifications'
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
}

export async function fetchNotifications(): Promise<NotificationItem[]> {
  try {
    const response = await apiRequest<NotificationItem[]>('/notifications')
    writeStoredNotifications(response)
    return response
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
