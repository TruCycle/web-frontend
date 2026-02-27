import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchNotifications,
  fetchUnreadNotificationsCount,
} from '@/features/notifications/api/notificationsApi'
import type { NotificationItem } from '@/features/notifications/types'
import { WebSocketClient } from '@/shared/lib/websocket/client'

const notificationsUpdatedEvent = 'trucycle:notifications-updated'

interface NotificationServerEvents extends Record<string, (...args: never[]) => void> {
  'notification:new': (notification: unknown) => void
  'notification:read:ack': (payload: { count: number }) => void
}

interface NotificationClientEvents extends Record<string, (...args: never[]) => void> {
  'notification:read': (payload: { id?: string; ids?: string[] }) => void
}

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

  const payload = item.data
  return {
    id,
    type: readString(item.type) ?? 'general',
    title,
    body: readString(item.body) ?? '',
    data:
      payload && typeof payload === 'object' && !Array.isArray(payload)
        ? (payload as Record<string, unknown>)
        : null,
    createdAt: readString(item.createdAt) ?? new Date().toISOString(),
    readAt: readString(item.readAt),
    isRead: Boolean(item.read),
  }
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const websocketClient = useMemo(
    () =>
      new WebSocketClient<NotificationServerEvents, NotificationClientEvents>({
        namespace: '/notifications',
      }),
    [],
  )

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [items, count] = await Promise.all([
        fetchNotifications({ limit: 50 }),
        fetchUnreadNotificationsCount(),
      ])
      setNotifications(items)
      setUnreadCount(count)
    } catch {
      setError('Unable to load notifications right now.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    const handleNotificationsUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{
        notifications: NotificationItem[]
        unreadCount: number
      }>
      if (!customEvent.detail) {
        return
      }
      setNotifications(customEvent.detail.notifications)
      setUnreadCount(customEvent.detail.unreadCount)
    }

    window.addEventListener(notificationsUpdatedEvent, handleNotificationsUpdated)
    return () => {
      window.removeEventListener(notificationsUpdatedEvent, handleNotificationsUpdated)
    }
  }, [])

  const broadcastNotifications = useCallback((nextNotifications: NotificationItem[]) => {
    const nextUnreadCount = nextNotifications.filter((item) => !item.isRead).length
    setUnreadCount(nextUnreadCount)
    window.dispatchEvent(
      new CustomEvent(notificationsUpdatedEvent, {
        detail: {
          notifications: nextNotifications,
          unreadCount: nextUnreadCount,
        },
      }),
    )
  }, [])

  useEffect(() => {
    const handleRealtimeNotification = (payload: unknown) => {
      const mappedNotification = mapNotification(payload)
      if (!mappedNotification) {
        return
      }

      setNotifications((currentNotifications) => {
        const dedupedNotifications = currentNotifications.filter(
          (notification) => notification.id !== mappedNotification.id,
        )
        const nextNotifications = [mappedNotification, ...dedupedNotifications]
        broadcastNotifications(nextNotifications)
        return nextNotifications
      })
    }

    websocketClient.connect()
    websocketClient.on('notification:new', handleRealtimeNotification)

    return () => {
      websocketClient.off('notification:new', handleRealtimeNotification)
      websocketClient.disconnect()
    }
  }, [broadcastNotifications, websocketClient])

  const markAsRead = useCallback(
    async (notificationId: string) => {
      setNotifications((currentNotifications) => {
        const nextNotifications = currentNotifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification,
        )
        broadcastNotifications(nextNotifications)
        return nextNotifications
      })

      websocketClient.emit('notification:read', { id: notificationId })
    },
    [broadcastNotifications, websocketClient],
  )

  const markAllAsRead = useCallback(async () => {
    setNotifications((currentNotifications) => {
      const nextNotifications = currentNotifications.map((notification) => ({
        ...notification,
        isRead: true,
      }))
      broadcastNotifications(nextNotifications)
      return nextNotifications
    })

    const notificationIds = notifications.map((notification) => notification.id)
    websocketClient.emit('notification:read', { ids: notificationIds })
  }, [broadcastNotifications, notifications, websocketClient])

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    reload: loadNotifications,
    markAsRead,
    markAllAsRead,
  }
}
