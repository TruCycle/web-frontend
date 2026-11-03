import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
  fetchActiveRooms,
  fetchRoomMessages,
  sendDirectTextMessage,
} from '@/features/messaging/api/messagingApi'
import type { RoomMessage } from '@/features/messaging/types'
import { WebSocketClient } from '@/shared/lib/websocket/client'
import { captureStoredSession, isSameSessionIdentity } from '@/shared/lib/auth/session'
import { initialRoomState, roomReducer } from '@/features/messaging/lib/roomState'
import { recoverHistory } from '@/features/messaging/lib/historyRecovery'

interface MessagingServerEvents extends Record<string, (...args: never[]) => void> {
  'message:new': (message: RoomMessage) => void
  'room:activity': (payload: { roomId: string; updatedAt: string }) => void
  'room:cleared': (payload: { roomId: string }) => void
  'room:deleted': (payload: { roomId: string }) => void
  'presence:update': (payload: { userId: string; online: boolean }) => void
  'auth:ready': () => void
}
interface GapAnchor { ids: Set<string>; cursor?: string; scanToEnd?: boolean; head?: RoomMessage; epoch?: number }

function mergeMessageIntoRoom(messages: readonly RoomMessage[], next: RoomMessage): RoomMessage[] {
  if (messages.some((message) => message.id === next.id)) {
    return [...messages]
  }

  return [...messages, next].sort(
    (first, second) =>
      new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime() || first.id.localeCompare(second.id),
  )
}

export function useMessages() {
  const [roomState, dispatchRoom] = useReducer(roomReducer, initialRoomState)
  const rooms = roomState.rooms
  const [activeRoomId, setActiveRoomIdState] = useState<string | null>(null)
  const [roomMessages, setRoomMessages] = useState<Record<string, RoomMessage[]>>({})
  const [unreadCountByRoom, setUnreadCountByRoom] = useState<Record<string, number>>({})
  const [isLoadingRooms, setIsLoadingRooms] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState<Record<string, boolean>>({})
  const isLoadingMessages = activeRoomId ? Boolean(loadingHistory[activeRoomId]) : false
  const [olderCursors, setOlderCursors] = useState<Record<string, string | null>>({})
  const [historyGaps, setHistoryGaps] = useState<Record<string, 'partial' | 'changed' | null>>({})
  const [historyFailures, setHistoryFailures] = useState<Record<string, boolean>>({})
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const activeRoomIdRef = useRef<string | null>(null)
  const isPageVisibleRef = useRef<boolean>(true)
  const sendingRef = useRef(false)
  const pendingSends = useRef(new Map<string, { text: string; id: string; userId: string }>())
  const seenMessageIds = useRef(new Set<string>())
  const roomRevisions = useRef(new Map<string, number>())
  const roomListRequest = useRef(0)
  const messageCache = useRef<Record<string, RoomMessage[]>>({})
  const historyOperations = useRef(new Map<string, AbortController>())
  const historyLoadedRooms = useRef(new Set<string>())
  const gapAnchors = useRef(new Map<string, GapAnchor>())
  const confirmedAnchors = useRef(new Map<string, Set<string>>())
  const historyEpoch = useRef(0)
  const attemptedHistoryEpoch = useRef(new Map<string, number>())
  const knownRoomIds = useRef(new Set<string>())
  const deletedRoomIds = useRef(new Set<string>())
  const clearedMessageIds = useRef(new Set<string>())
  const unknownRoomTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => { knownRoomIds.current = new Set(rooms.map(room => room.id)) }, [rooms])
  const cacheMessages = useCallback((roomId: string, update: (messages: RoomMessage[]) => RoomMessage[]) => {
    const next = { ...messageCache.current, [roomId]: update(messageCache.current[roomId] ?? []) }
    messageCache.current = next; setRoomMessages(next)
  }, [])

  const websocketClient = useMemo(
    () =>
      new WebSocketClient<MessagingServerEvents>({
        namespace: '/messages',
      }),
    [],
  )

  const loadRooms = useCallback(async () => {
    const request = ++roomListRequest.current
    dispatchRoom({ type: 'start', id: request })
    try {
      setIsLoadingRooms(true)
      setError(null)
      const nextRooms = await fetchActiveRooms()
      if (request !== roomListRequest.current) return
      dispatchRoom({ type: 'snapshot', id: request, rooms: nextRooms })
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
    } catch {
      if (request === roomListRequest.current) setError('Unable to load conversations right now.')
    } finally {
      if (request === roomListRequest.current) setIsLoadingRooms(false)
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

  const loadMessagesForRoom = useCallback(async (roomId: string, mode: 'recent' | 'older' | 'reset' = 'recent', olderCursor?: string) => {
    const revision = roomRevisions.current.get(roomId) ?? 0
    const hadHistory = historyLoadedRooms.current.has(roomId)
    const epoch = historyEpoch.current
    if (mode !== 'older') attemptedHistoryEpoch.current.set(roomId, epoch)
    historyOperations.current.get(roomId)?.abort()
    const controller = new AbortController(); historyOperations.current.set(roomId, controller)
    const timer = setTimeout(() => controller.abort(), 15_000)
    const current = () => historyOperations.current.get(roomId) === controller && (roomRevisions.current.get(roomId) ?? 0) === revision
    if (mode === 'reset') { gapAnchors.current.delete(roomId); confirmedAnchors.current.delete(roomId); cacheMessages(roomId, () => []) }
    try {
      setLoadingHistory(values => ({ ...values, [roomId]: true }))
      setHistoryFailures(values => ({ ...values, [roomId]: false }))
      setError(null)
      let anchor: GapAnchor | undefined = mode === 'older' ? { ids: new Set<string>(), cursor: olderCursor } : gapAnchors.current.get(roomId)
      if (!anchor) {
        const ids = new Set(confirmedAnchors.current.get(roomId) ?? [])
        anchor = { ids, scanToEnd: mode !== 'reset' && hadHistory && !ids.size }
      }
      if (mode === 'recent' && anchor.epoch !== epoch) {
        // Another disconnect may have added messages above the saved cursor.
        anchor = { ids: anchor.ids, scanToEnd: anchor.scanToEnd, epoch }
      }
      if (mode !== 'older' && (anchor.ids.size || anchor.scanToEnd)) gapAnchors.current.set(roomId, anchor)
      const response = await recoverHistory(cursor => fetchRoomMessages(roomId, cursor, controller.signal), anchor.ids, anchor.cursor, 5, anchor.scanToEnd)
      if (!current() || controller.signal.aborted) return
      historyLoadedRooms.current.add(roomId)
      cacheMessages(roomId, previous => response.messages.reduce((merged, message) => mergeMessageIntoRoom(merged, message), previous))
      if (mode !== 'older') {
        let head = anchor.head
        for (const message of response.messages) if (!head || Date.parse(message.createdAt) > Date.parse(head.createdAt) ||
            (message.createdAt === head.createdAt && message.id.localeCompare(head.id) > 0)) head = message
        setHistoryGaps(values => ({ ...values, [roomId]: response.status === 'complete' ? null : response.status }))
        if (response.status === 'partial') gapAnchors.current.set(roomId, { ...anchor, head, cursor: response.nextCursor ?? undefined })
        else {
          gapAnchors.current.delete(roomId)
          if (response.status === 'complete') confirmedAnchors.current.set(roomId, new Set(head ? [head.id] : []))
        }
      }
      if (mode === 'older' || !hadHistory || !anchor.ids.size) setOlderCursors(values => ({ ...values, [roomId]: response.nextCursor }))
    } catch {
      if (current()) {
        setError('Unable to load room history right now. Try refreshing the conversation.')
        setHistoryFailures(values => ({ ...values, [roomId]: true }))
        const anchor = gapAnchors.current.get(roomId)
        if (anchor?.ids.size || anchor?.scanToEnd) setHistoryGaps(values => ({ ...values, [roomId]: 'partial' }))
      }
    } finally {
      clearTimeout(timer)
      if (historyOperations.current.get(roomId) === controller) {
        historyOperations.current.delete(roomId)
        setLoadingHistory(values => ({ ...values, [roomId]: false }))
      }
    }
  }, [cacheMessages])
  useEffect(() => {
    const operations = historyOperations.current
    return () => { for (const controller of operations.values()) controller.abort(); operations.clear() }
  }, [])

  useEffect(() => {
    void loadRooms()
  }, [loadRooms])
  useEffect(() => {
    setActiveRoomIdState(current => current && rooms.some(room => room.id === current) ? current : rooms[0]?.id ?? null)
  }, [rooms])

  useEffect(() => {
    if (!activeRoomId || attemptedHistoryEpoch.current.get(activeRoomId) === historyEpoch.current || historyOperations.current.has(activeRoomId)) {
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
      if (deletedRoomIds.current.has(message.roomId) || clearedMessageIds.current.has(message.id)) return
      if (seenMessageIds.current.has(message.id)) return
      seenMessageIds.current.add(message.id)
      if (seenMessageIds.current.size > 2000) seenMessageIds.current.delete(seenMessageIds.current.values().next().value!)
      const isIncomingMessage = message.direction === 'incoming'
      const isActiveRoomVisible =
        activeRoomIdRef.current === message.roomId && isPageVisibleRef.current

      cacheMessages(message.roomId, messages => mergeMessageIntoRoom(messages, message))
      dispatchRoom({ type: 'message', message })
      if (!knownRoomIds.current.has(message.roomId) && unknownRoomTimer.current === null) unknownRoomTimer.current = setTimeout(() => {
        unknownRoomTimer.current = null; void loadRooms()
      }, 100)

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
      dispatchRoom({ type: 'activity', ...payload })
    }

    const handleRoomCleared = (payload: { roomId: string }) => {
      for (const message of messageCache.current[payload.roomId] ?? []) clearedMessageIds.current.add(message.id)
      historyLoadedRooms.current.add(payload.roomId)
      confirmedAnchors.current.set(payload.roomId, new Set()); attemptedHistoryEpoch.current.set(payload.roomId, historyEpoch.current)
      roomRevisions.current.set(payload.roomId, (roomRevisions.current.get(payload.roomId) ?? 0) + 1)
      historyOperations.current.get(payload.roomId)?.abort(); gapAnchors.current.delete(payload.roomId)
      setHistoryGaps(values => ({ ...values, [payload.roomId]: null })); setOlderCursors(values => ({ ...values, [payload.roomId]: null }))
      pendingSends.current.delete(payload.roomId)
      cacheMessages(payload.roomId, () => [])
      dispatchRoom({ type: 'clear', roomId: payload.roomId })
    }

    const handleRoomDeleted = (payload: { roomId: string }) => {
      deletedRoomIds.current.add(payload.roomId)
      historyLoadedRooms.current.delete(payload.roomId)
      confirmedAnchors.current.delete(payload.roomId); attemptedHistoryEpoch.current.delete(payload.roomId)
      roomRevisions.current.set(payload.roomId, (roomRevisions.current.get(payload.roomId) ?? 0) + 1)
      pendingSends.current.delete(payload.roomId)
      historyOperations.current.get(payload.roomId)?.abort(); gapAnchors.current.delete(payload.roomId)
      const remaining = { ...messageCache.current }; delete remaining[payload.roomId]
      messageCache.current = remaining; setRoomMessages(remaining)
      setUnreadCountByRoom((currentCounts) => {
        if (!(payload.roomId in currentCounts)) {
          return currentCounts
        }
        const nextCounts = { ...currentCounts }
        delete nextCounts[payload.roomId]
        return nextCounts
      })
      dispatchRoom({ type: 'delete', roomId: payload.roomId })
      setActiveRoomIdState((currentId) => (currentId === payload.roomId ? null : currentId))
    }

    const handlePresenceUpdate = (payload: { userId: string; online: boolean }) => {
      dispatchRoom({ type: 'presence', ...payload })
    }

    const handleReady = () => {
      historyEpoch.current++
      void loadRooms()
      if (activeRoomIdRef.current) void loadMessagesForRoom(activeRoomIdRef.current)
    }
    websocketClient.connect()
    websocketClient.on('auth:ready', handleReady)
    websocketClient.on('message:new', handleNewMessage)
    websocketClient.on('room:activity', handleRoomActivity)
    websocketClient.on('room:cleared', handleRoomCleared)
    websocketClient.on('room:deleted', handleRoomDeleted)
    websocketClient.on('presence:update', handlePresenceUpdate)

    return () => {
      if (unknownRoomTimer.current !== null) clearTimeout(unknownRoomTimer.current)
      unknownRoomTimer.current = null
      websocketClient.off('auth:ready', handleReady)
      websocketClient.off('message:new', handleNewMessage)
      websocketClient.off('room:activity', handleRoomActivity)
      websocketClient.off('room:cleared', handleRoomCleared)
      websocketClient.off('room:deleted', handleRoomDeleted)
      websocketClient.off('presence:update', handlePresenceUpdate)
      websocketClient.disconnect()
    }
  }, [websocketClient, loadRooms, loadMessagesForRoom, cacheMessages])

  const sendMessage = useCallback(
    async (text: string) => {
      const roomId = activeRoomId
      const message = text.trim()
      if (!roomId || !message || message.length > 4000 || sendingRef.current) return false
      const revision = roomRevisions.current.get(roomId) ?? 0
      sendingRef.current = true
      setIsSending(true)
      setSendError(null)

      try {
        const capture = captureStoredSession()
        if (!capture) throw new Error('Sign in is required')
        let pending = pendingSends.current.get(roomId)
        if (!pending || pending.text !== message || pending.userId !== capture.session.user.id) {
          pending = { text: message, id: crypto.randomUUID(), userId: capture.session.user.id }
          pendingSends.current.set(roomId, pending)
        }
        const saved = await sendDirectTextMessage(roomId, { clientMessageId: pending.id, text: message })
        if (!isSameSessionIdentity(capture) || (roomRevisions.current.get(roomId) ?? 0) !== revision) return false
        pendingSends.current.delete(roomId)
        cacheMessages(roomId, messages => mergeMessageIntoRoom(messages, saved))
        dispatchRoom({ type: 'message', message: saved })
        return true
      } catch {
        setSendError('The message could not be confirmed. Your draft is kept. Check the conversation before retrying.')
        return false
      } finally {
        sendingRef.current = false
        setIsSending(false)
      }
    },
    [activeRoomId, cacheMessages],
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
    error: sendError ?? error,
    unreadCountByRoom,
    setActiveRoomId,
    sendMessage,
    reloadRooms: loadRooms,
    historyGap: activeRoomId ? historyGaps[activeRoomId] ?? null : null,
    hasHistoryFailure: Boolean(activeRoomId && historyFailures[activeRoomId]),
    hasOlderMessages: Boolean(activeRoomId && olderCursors[activeRoomId]),
    loadOlderMessages: () => activeRoomId ? loadMessagesForRoom(activeRoomId, 'older', olderCursors[activeRoomId] ?? undefined) : Promise.resolve(),
    resetHistory: () => activeRoomId ? loadMessagesForRoom(activeRoomId, 'reset') : Promise.resolve(),
    reloadMessages: () => (activeRoomId ? loadMessagesForRoom(activeRoomId) : Promise.resolve()),
  }
}
