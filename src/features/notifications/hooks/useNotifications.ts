import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  notificationsUpdatedEventName,
} from '@/features/notifications/api/notificationsApi'
import type { NotificationItem } from '@/features/notifications/types'

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const loadNotifications = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetchNotifications()
      setNotifications(response)
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
    const refreshNotifications = () => {
      void loadNotifications()
    }

    window.addEventListener(notificationsUpdatedEventName, refreshNotifications)
    window.addEventListener('storage', refreshNotifications)

    return () => {
      window.removeEventListener(
        notificationsUpdatedEventName,
        refreshNotifications,
      )
      window.removeEventListener('storage', refreshNotifications)
    }
  }, [loadNotifications])

  const markAsRead = useCallback(
    async (notificationId: string) => {
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification,
        ),
      )

      try {
        await markNotificationAsRead(notificationId)
      } catch {
        setError('Failed to update a notification. Refresh and try again.')
      }
    },
    [],
  )

  const markAllAsRead = useCallback(async () => {
    setNotifications((currentNotifications) =>
      currentNotifications.map((notification) => ({
        ...notification,
        isRead: true,
      })),
    )

    try {
      await markAllNotificationsAsRead()
    } catch {
      setError('Failed to update notifications. Refresh and try again.')
    }
  }, [])

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  )

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
