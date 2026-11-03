import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { fetchActiveRooms } from '@/features/messaging/api/messagingApi'
import { playIncomingMessageTone } from '@/features/messaging/lib/playIncomingMessageTone'
import type { RoomMessage } from '@/features/messaging/types'
import { WebSocketClient } from '@/shared/lib/websocket/client'
import { useToast } from '@/shared/ui/toast/useToast'

interface MessagingServerEvents extends Record<string, (...args: never[]) => void> {
  'message:new': (message: RoomMessage) => void
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
  const [unreadState, setUnreadState] = useState({
    count: 0,
    isOnMessagesPage,
    hasVisitedMessages: isOnMessagesPage,
  })
  const seenMessageIdsRef = useRef<Set<string>>(new Set())
  const websocketClient = useMemo(
    () =>
      new WebSocketClient<MessagingServerEvents, MessagingClientEvents>({
        namespace: '/messages',
      }),
    [],
  )
  // Adjust route-dependent state before committing children so stale badges
  // cannot flash or reappear when leaving the messages page.
  if (unreadState.isOnMessagesPage !== isOnMessagesPage) {
    setUnreadState({
      count: isOnMessagesPage ? 0 : unreadState.count,
      isOnMessagesPage,
      hasVisitedMessages: unreadState.hasVisitedMessages || isOnMessagesPage,
    })
  }

  useEffect(() => {
    let isCurrent = true
    void fetchActiveRooms().then((rooms) => {
      if (!isCurrent) return
      const nextCount = rooms.reduce((total, room) => total + room.unreadCount, 0)
      // Visiting Messages invalidates the bootstrap snapshot, including if its
      // response arrives after the user has already navigated away again.
      setUnreadState((current) => current.hasVisitedMessages ? current : ({
        ...current,
        // The summary can overlap socket events received while it was in flight.
        // Without a server snapshot boundary, adding counts could double-count;
        // preserve the larger known count instead of overwriting newer events.
        count: Math.max(current.count, nextCount),
      }))
    }).catch(() => {
      // Best-effort bootstrap for message alerts.
    })
    return () => { isCurrent = false }
  }, [])

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
        setUnreadState((current) => ({
          ...current,
          count: current.isOnMessagesPage ? 0 : current.count + 1,
        }))
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
    unreadMessagesCount: isOnMessagesPage ? 0 : unreadState.count,
  }
}
