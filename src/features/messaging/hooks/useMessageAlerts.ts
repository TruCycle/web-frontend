import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { fetchActiveRooms } from '@/features/messaging/api/messagingApi'
import { playIncomingMessageTone } from '@/features/messaging/lib/playIncomingMessageTone'
import type { RoomMessage } from '@/features/messaging/types'
import { WebSocketClient } from '@/shared/lib/websocket/client'
import { useToast } from '@/shared/ui/toast/useToast'

interface MessagingServerEvents extends Record<string, (...args: never[]) => void> {
  'message:new': (message: RoomMessage) => void
}

interface MessagingClientEvents extends Record<string, (...args: never[]) => void> {}

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
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const seenMessageIdsRef = useRef<Set<string>>(new Set())
  const websocketClient = useMemo(
    () =>
      new WebSocketClient<MessagingServerEvents, MessagingClientEvents>({
        namespace: '/messages',
      }),
    [],
  )
  const isOnMessagesPage = location.pathname.startsWith('/messages')

  const loadUnreadSummary = useCallback(async () => {
    try {
      const rooms = await fetchActiveRooms()
      const nextCount = rooms.reduce((total, room) => total + room.unreadCount, 0)
      setUnreadMessagesCount(nextCount)
    } catch {
      // Best-effort bootstrap for message alerts.
    }
  }, [])

  useEffect(() => {
    void loadUnreadSummary()
  }, [loadUnreadSummary])

  useEffect(() => {
    if (isOnMessagesPage) {
      setUnreadMessagesCount(0)
    }
  }, [isOnMessagesPage])

  useEffect(() => {
    const handleNewMessage = (message: RoomMessage) => {
      if (message.direction !== 'incoming') {
        return
      }

      if (seenMessageIdsRef.current.has(message.id)) {
        return
      }
      seenMessageIdsRef.current.add(message.id)

      if (!isOnMessagesPage) {
        setUnreadMessagesCount((currentCount) => currentCount + 1)
      }

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
