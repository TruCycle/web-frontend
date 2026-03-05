import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchActiveRooms,
  fetchRoomMessages,
  sendGeneralMessage,
} from '@/features/messaging/api/messagingApi'
import type { ActiveRoom, RoomMessage } from '@/features/messaging/types'
import { WebSocketClient } from '@/shared/lib/websocket/client'

interface MessagingServerEvents extends Record<string, (...args: never[]) => void> {
  'message:new': (message: RoomMessage) => void
  'room:activity': (payload: { roomId: string; updatedAt: string }) => void
  'room:cleared': (payload: { roomId: string }) => void
  'room:deleted': (payload: { roomId: string }) => void
  'presence:update': (payload: { userId: string; online: boolean }) => void
}

interface MessagingClientEvents extends Record<string, (...args: never[]) => void> {
  'message:send': (payload: { roomId: string; text: string }) => void
}

function sortRoomsByRecentActivity(rooms: readonly ActiveRoom[]): ActiveRoom[] {
  return [...rooms].sort((a, b) => {
    const aTime = new Date(a.updatedAt).getTime()
    const bTime = new Date(b.updatedAt).getTime()
    return bTime - aTime
  })
}

function mergeMessageIntoRoom(messages: readonly RoomMessage[], next: RoomMessage): RoomMessage[] {
  if (messages.some((message) => message.id === next.id)) {
    return [...messages]
  }

  return [...messages, next].sort(
    (first, second) =>
      new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime(),
  )
}

export function useMessages() {
  const [rooms, setRooms] = useState<ActiveRoom[]>([])
  const [activeRoomId, setActiveRoomIdState] = useState<string | null>(null)
  const [roomMessages, setRoomMessages] = useState<Record<string, RoomMessage[]>>({})
  const [unreadCountByRoom, setUnreadCountByRoom] = useState<Record<string, number>>({})
  const [isLoadingRooms, setIsLoadingRooms] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const activeRoomIdRef = useRef<string | null>(null)
  const isPageVisibleRef = useRef<boolean>(true)

  const websocketClient = useMemo(
    () =>
      new WebSocketClient<MessagingServerEvents, MessagingClientEvents>({
        namespace: '/messages',
      }),
    [],
  )

  const loadRooms = useCallback(async () => {
    try {
      setIsLoadingRooms(true)
      setError(null)
      const nextRooms = sortRoomsByRecentActivity(await fetchActiveRooms())
      setRooms(nextRooms)
      setUnreadCountByRoom((currentCounts) => {
        const nextCounts = { ...currentCounts }
        nextRooms.forEach((room) => {
          const existingCount = currentCounts[room.id] ?? 0
          nextCounts[room.id] = Math.max(existingCount, room.unreadCount)
        })
        Object.keys(nextCounts).forEach((roomId) => {
          if (!nextRooms.some((room) => room.id === roomId)) {
            delete nextCounts[roomId]
          }
        })
        return nextCounts
      })
      setActiveRoomIdState((current) => current ?? nextRooms[0]?.id ?? null)
    } catch {
      setError('Unable to load conversations right now.')
    } finally {
      setIsLoadingRooms(false)
    }
  }, [])

  const clearUnreadForRoom = useCallback((roomId: string | null) => {
    if (!roomId) {
      return
    }

    setUnreadCountByRoom((currentCounts) => {
      if (!currentCounts[roomId]) {
        return currentCounts
      }

      return {
        ...currentCounts,
        [roomId]: 0,
      }
    })
  }, [])

  const setActiveRoomId = useCallback(
    (roomId: string | null) => {
      setActiveRoomIdState(roomId)
      if (roomId && document.visibilityState === 'visible') {
        clearUnreadForRoom(roomId)
      }
    },
    [clearUnreadForRoom],
  )

  const loadMessagesForRoom = useCallback(async (roomId: string) => {
    try {
      setIsLoadingMessages(true)
      setError(null)
      const response = await fetchRoomMessages(roomId)
      setRoomMessages((currentMessages) => ({
        ...currentMessages,
        [roomId]: response.messages,
      }))
    } catch {
      setError('Unable to load room history right now.')
    } finally {
      setIsLoadingMessages(false)
    }
  }, [])

  useEffect(() => {
    void loadRooms()
  }, [loadRooms])

  useEffect(() => {
    if (!activeRoomId || roomMessages[activeRoomId]) {
      return
    }

    void loadMessagesForRoom(activeRoomId)
  }, [activeRoomId, loadMessagesForRoom, roomMessages])

  useEffect(() => {
    activeRoomIdRef.current = activeRoomId
  }, [activeRoomId])

  useEffect(() => {
    if (!activeRoomId || document.visibilityState !== 'visible') {
      return
    }

    clearUnreadForRoom(activeRoomId)
  }, [activeRoomId, clearUnreadForRoom])

  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible'
      isPageVisibleRef.current = isVisible
      if (isVisible) {
        clearUnreadForRoom(activeRoomIdRef.current)
      }
    }

    handleVisibilityChange()
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [clearUnreadForRoom])

  useEffect(() => {
    const handleNewMessage = (message: RoomMessage) => {
      const isIncomingMessage = message.direction === 'incoming'
      const isActiveRoomVisible =
        activeRoomIdRef.current === message.roomId && isPageVisibleRef.current

      setRoomMessages((currentMessages) => ({
        ...currentMessages,
        [message.roomId]: mergeMessageIntoRoom(
          currentMessages[message.roomId] ?? [],
          message,
        ),
      }))
      setRooms((currentRooms) =>
        sortRoomsByRecentActivity(
          currentRooms.map((room) =>
            room.id === message.roomId
              ? { ...room, lastMessage: message, updatedAt: message.createdAt }
              : room,
          ),
        ),
      )

      if (!isIncomingMessage) {
        return
      }

      setUnreadCountByRoom((currentCounts) => {
        if (isActiveRoomVisible) {
          if (!currentCounts[message.roomId]) {
            return currentCounts
          }

          return {
            ...currentCounts,
            [message.roomId]: 0,
          }
        }

        return {
          ...currentCounts,
          [message.roomId]: (currentCounts[message.roomId] ?? 0) + 1,
        }
      })

    }

    const handleRoomActivity = (payload: { roomId: string; updatedAt: string }) => {
      setRooms((currentRooms) =>
        sortRoomsByRecentActivity(
          currentRooms.map((room) =>
            room.id === payload.roomId ? { ...room, updatedAt: payload.updatedAt } : room,
          ),
        ),
      )
    }

    const handleRoomCleared = (payload: { roomId: string }) => {
      setRoomMessages((currentMessages) => ({
        ...currentMessages,
        [payload.roomId]: [],
      }))
      setRooms((currentRooms) =>
        currentRooms.map((room) =>
          room.id === payload.roomId ? { ...room, lastMessage: null } : room,
        ),
      )
    }

    const handleRoomDeleted = (payload: { roomId: string }) => {
      setRoomMessages((currentMessages) => {
        const remaining = { ...currentMessages }
        delete remaining[payload.roomId]
        return remaining
      })
      setUnreadCountByRoom((currentCounts) => {
        if (!(payload.roomId in currentCounts)) {
          return currentCounts
        }
        const nextCounts = { ...currentCounts }
        delete nextCounts[payload.roomId]
        return nextCounts
      })
      setRooms((currentRooms) =>
        currentRooms.filter((room) => room.id !== payload.roomId),
      )
      setActiveRoomIdState((currentId) => (currentId === payload.roomId ? null : currentId))
    }

    const handlePresenceUpdate = (payload: { userId: string; online: boolean }) => {
      setRooms((currentRooms) =>
        currentRooms.map((room) => ({
          ...room,
          participants: room.participants.map((participant) =>
            participant.id === payload.userId
              ? { ...participant, online: payload.online }
              : participant,
          ),
        })),
      )
    }

    websocketClient.connect()
    websocketClient.on('message:new', handleNewMessage)
    websocketClient.on('room:activity', handleRoomActivity)
    websocketClient.on('room:cleared', handleRoomCleared)
    websocketClient.on('room:deleted', handleRoomDeleted)
    websocketClient.on('presence:update', handlePresenceUpdate)

    return () => {
      websocketClient.off('message:new', handleNewMessage)
      websocketClient.off('room:activity', handleRoomActivity)
      websocketClient.off('room:cleared', handleRoomCleared)
      websocketClient.off('room:deleted', handleRoomDeleted)
      websocketClient.off('presence:update', handlePresenceUpdate)
      websocketClient.disconnect()
    }
  }, [websocketClient])

  const sendMessage = useCallback(
    async (text: string) => {
      const roomId = activeRoomId
      const message = text.trim()
      if (!roomId || !message) {
        return
      }

      setIsSending(true)
      setError(null)

      try {
        if (websocketClient.isConnected) {
          websocketClient.emit('message:send', { roomId, text: message })
        } else {
          const fallbackMessage = await sendGeneralMessage(roomId, { text: message })
          setRoomMessages((currentMessages) => ({
            ...currentMessages,
            [roomId]: mergeMessageIntoRoom(
              currentMessages[roomId] ?? [],
              fallbackMessage,
            ),
          }))
          setRooms((currentRooms) =>
            sortRoomsByRecentActivity(
              currentRooms.map((room) =>
                room.id === roomId
                  ? {
                      ...room,
                      lastMessage: fallbackMessage,
                      updatedAt: fallbackMessage.createdAt,
                    }
                  : room,
              ),
            ),
          )
        }
      } catch {
        setError('Unable to send the message right now.')
      } finally {
        setIsSending(false)
      }
    },
    [activeRoomId, websocketClient],
  )

  const activeRoom = rooms.find((room) => room.id === activeRoomId) ?? null
  const messages = activeRoomId ? roomMessages[activeRoomId] ?? [] : []

  return {
    rooms,
    activeRoom,
    activeRoomId,
    messages,
    isLoadingRooms,
    isLoadingMessages,
    isSending,
    error,
    unreadCountByRoom,
    setActiveRoomId,
    sendMessage,
    reloadRooms: loadRooms,
    reloadMessages: () => (activeRoomId ? loadMessagesForRoom(activeRoomId) : Promise.resolve()),
  }
}
