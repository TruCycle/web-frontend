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

  return message.imageUrl ? 'Sent an image' : 'You received a new message.'
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
    window.addEventListener(unreadChangedEvent, refresh)
    document.addEventListener('visibilitychange', visible)
    return () => {
      alive = false; revision++; clearTimeout(timer)
      websocketClient.off('auth:ready', refresh)
      websocketClient.off('message:new', refresh)
      websocketClient.off('messages:read', refresh)
      window.removeEventListener(unreadChangedEvent, refresh)
      document.removeEventListener('visibilitychange', visible)
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

    websocketClient.connect()
    websocketClient.on('message:new', handleNewMessage)

    return () => {
      websocketClient.off('message:new', handleNewMessage)
      websocketClient.disconnect()
    }
  }, [info, isOnMessagesPage, websocketClient])

  return {
    unreadMessagesCount,
  }
}
