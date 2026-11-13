import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchNotifications,
  fetchUnreadNotificationsCount,
  markNotificationsRead,
} from '@/features/notifications/api/notificationsApi'
import type { NotificationItem } from '@/features/notifications/types'
import { WebSocketClient } from '@/shared/lib/websocket/client'

const notificationsUpdatedEvent = 'trucycle:notifications-updated'

interface NotificationServerEvents extends Record<string, (...args: never[]) => void> {
  'notification:new': () => void
  'notification:read:ack': () => void
  'notification:read:changed': () => void
  'auth:ready': () => void
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingRead, setIsMarkingRead] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const activeRequest = useRef<AbortController | null>(null)
  const mutation = useRef(false)
  const mounted = useRef(false)
  const reloadQueued = useRef(false)
  const websocketClient = useMemo(() => new WebSocketClient<NotificationServerEvents>({
    namespace: '/notifications',
  }), [])

  const loadNotifications = useCallback(async (replace = false): Promise<void> => {
    if (activeRequest.current && !replace) {
      reloadQueued.current = true
      return
    }
    reloadQueued.current = false
    activeRequest.current?.abort()
    const request = new AbortController()
    activeRequest.current = request
    try {
      setIsLoading(true)
      setError(null)
      const [items, count] = await Promise.all([
        fetchNotifications({ limit: 50 }, request.signal),
        fetchUnreadNotificationsCount(request.signal),
      ])
      if (request.signal.aborted) return
      setNotifications(items)
      setUnreadCount(count)
    } catch {
      if (!request.signal.aborted) setError('Unable to load notifications right now. Please refresh to retry.')
    } finally {
      if (activeRequest.current === request) {
        activeRequest.current = null
        if (!request.signal.aborted) setIsLoading(false)
        if (reloadQueued.current && mounted.current) {
          reloadQueued.current = false
          void loadNotifications()
        }
      }
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    let timer: ReturnType<typeof setTimeout> | undefined
    const refresh = () => {
      if (timer !== undefined) return
      timer = setTimeout(() => {
        timer = undefined
        void loadNotifications()
      }, 100)
    }
    const readChanged = () => { void loadNotifications(true) }
    const visible = () => { if (document.visibilityState === 'visible') refresh() }
    void loadNotifications()
    websocketClient.connect()
    websocketClient.on('auth:ready', refresh)
    websocketClient.on('notification:new', refresh)
    websocketClient.on('notification:read:ack', readChanged)
    websocketClient.on('notification:read:changed', readChanged)
    window.addEventListener(notificationsUpdatedEvent, readChanged)
    window.addEventListener('online', refresh)
    document.addEventListener('visibilitychange', visible)
    return () => {
      mounted.current = false
      reloadQueued.current = false
      clearTimeout(timer)
      activeRequest.current?.abort()
      websocketClient.off('auth:ready', refresh)
      websocketClient.off('notification:new', refresh)
      websocketClient.off('notification:read:ack', readChanged)
      websocketClient.off('notification:read:changed', readChanged)
      window.removeEventListener(notificationsUpdatedEvent, readChanged)
      window.removeEventListener('online', refresh)
      document.removeEventListener('visibilitychange', visible)
      websocketClient.disconnect()
    }
  }, [loadNotifications, websocketClient])

  const saveReadStatus = useCallback(async (ids?: string[]) => {
    if (mutation.current) return
    mutation.current = true
    setIsMarkingRead(true)
    setError(null)
    try {
      await markNotificationsRead(ids)
      if (mounted.current) window.dispatchEvent(new Event(notificationsUpdatedEvent))
    } catch {
      if (mounted.current) setError('Read status could not be confirmed. Please retry the action.')
    } finally {
      mutation.current = false
      if (mounted.current) setIsMarkingRead(false)
    }
  }, [])

  return {
    notifications,
    unreadCount,
    isLoading,
    isMarkingRead,
    error,
    reload: () => loadNotifications(true),
    markAsRead: (id: string) => saveReadStatus([id]),
    markAllAsRead: () => saveReadStatus(),
  }
}
