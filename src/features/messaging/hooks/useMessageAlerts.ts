import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { fetchActiveRooms } from '@/features/messaging/api/messagingApi'
import { playIncomingMessageTone } from '@/features/messaging/lib/playIncomingMessageTone'
import type { RoomMessage } from '@/features/messaging/types'
import { WebSocketClient } from '@/shared/lib/websocket/client'
import { captureStoredSession, isSameSessionIdentity } from '@/shared/lib/auth/session'
import { unreadChangedEvent } from '@/features/messaging/lib/unreadEvents'
import { useToast } from '@/shared/ui/toast/useToast'

interface MessagingServerEvents extends Record<string, (...args: never[]) => void> {
  'message:new': (message: RoomMessage) => void
  'auth:ready': () => void
  'messages:read': () => void
  'room:cleared': () => void
  'room:deleted': () => void
}

type MessagingClientEvents = Record<string, (...args: never[]) => void>

function getSenderName(message: RoomMessage): string {
  const firstName = message.sender?.firstName?.trim() ?? ''
  const lastName = message.sender?.lastName?.trim() ?? ''
  const fullName = `${firstName} ${lastName}`.trim()
  return fullName || 'your contact'
}

function getMessagePreview(message: RoomMessage): string {
  const preview = (message.text ?? message.caption ?? '').trim()
  if (preview) {
    return preview
  }

  return message.imageUrl || message.hasAttachment ? 'Sent an image' : 'You received a new message.'
}

export function useMessageAlerts() {
  const location = useLocation()
  const { info } = useToast()
  const isOnMessagesPage = location.pathname.startsWith('/messages')
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const seenMessageIdsRef = useRef<Set<string>>(new Set())
  const websocketClient = useMemo(
    () =>
      new WebSocketClient<MessagingServerEvents, MessagingClientEvents>({
        namespace: '/messages',
      }),
    [],
  )
  useEffect(() => {
    // The wrapper registers listeners only after connect creates its socket.
    // Keep connection ownership with these stable authoritative listeners.
    websocketClient.connect()
    let alive = true
    let revision = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    const refresh = () => {
      const request = ++revision
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        let capture: ReturnType<typeof captureStoredSession>
        try { capture = captureStoredSession() } catch { return }
        if (!capture) return
        void fetchActiveRooms().then(rooms => {
          if (alive && request === revision && isSameSessionIdentity(capture)) {
            setUnreadMessagesCount(rooms.reduce((sum, room) => sum + room.unreadCount, 0))
          }
        }).catch(() => { /* Keep last confirmed count on failure. */ })
      }, 100)
    }
    const visible = () => { if (document.visibilityState === 'visible') refresh() }
    refresh()
    websocketClient.on('auth:ready', refresh)
    websocketClient.on('message:new', refresh)
    websocketClient.on('messages:read', refresh)
    websocketClient.on('room:cleared', refresh)
    websocketClient.on('room:deleted', refresh)
    window.addEventListener(unreadChangedEvent, refresh)
    window.addEventListener('online', refresh)
    document.addEventListener('visibilitychange', visible)
    return () => {
      alive = false; revision++; clearTimeout(timer)
      websocketClient.off('auth:ready', refresh)
      websocketClient.off('message:new', refresh)
      websocketClient.off('messages:read', refresh)
      websocketClient.off('room:cleared', refresh)
      websocketClient.off('room:deleted', refresh)
      window.removeEventListener(unreadChangedEvent, refresh)
      window.removeEventListener('online', refresh)
      document.removeEventListener('visibilitychange', visible)
      websocketClient.disconnect()
    }
  }, [websocketClient])

  useEffect(() => {
    const handleNewMessage = (message: RoomMessage) => {
      if (message.direction !== 'incoming') {
        return
      }

      if (seenMessageIdsRef.current.has(message.id)) {
        return
      }
      seenMessageIdsRef.current.add(message.id)

      if (isOnMessagesPage || document.visibilityState !== 'visible') {
        return
      }

      info(`New message from ${getSenderName(message)}`, getMessagePreview(message), 4200)
      playIncomingMessageTone()
    }

    websocketClient.on('message:new', handleNewMessage)

    return () => {
      websocketClient.off('message:new', handleNewMessage)
    }
  }, [info, isOnMessagesPage, websocketClient])

  return {
    unreadMessagesCount,
  }
}
