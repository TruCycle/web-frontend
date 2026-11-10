import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import {
  acknowledgeRoomMessages,
  fetchActiveRooms,
  fetchRoomMessages,
  sendDirectTextMessage,
} from '@/features/messaging/api/messagingApi'
import type { RoomMessage } from '@/features/messaging/types'
import { WebSocketClient } from '@/shared/lib/websocket/client'
import { captureStoredSession, isSameSessionIdentity } from '@/shared/lib/auth/session'
import { initialRoomState, roomReducer } from '@/features/messaging/lib/roomState'
import { notifyUnreadChanged, unreadChangedEvent } from '@/features/messaging/lib/unreadEvents'
import { recoverHistory } from '@/features/messaging/lib/historyRecovery'
import { eligibleReadIds } from '@/features/messaging/lib/readEligibility'

interface MessagingServerEvents extends Record<string, (...args: never[]) => void> {
  'message:new': (message: RoomMessage) => void
  'room:activity': (payload: { roomId: string; updatedAt: string }) => void
  'room:cleared': (payload: { roomId: string }) => void
  'room:deleted': (payload: { roomId: string }) => void
  'presence:update': (payload: { userId: string; online: boolean }) => void
  'auth:ready': () => void
  'messages:read': () => void
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
  const deletedRoomIds = useRef(new Set<string>())
  const clearedRoomIds = useRef(new Set<string>())
  const pendingHistoryResets = useRef(new Set<string>())
  const unknownRoomTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
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
    let capture: ReturnType<typeof captureStoredSession>
    try { capture = captureStoredSession() } catch { return }
    if (!capture) return
    dispatchRoom({ type: 'start', id: request })
    try {
      setIsLoadingRooms(true)
      setError(null)
      const nextRooms = await fetchActiveRooms()
      if (request !== roomListRequest.current || !isSameSessionIdentity(capture)) return
      dispatchRoom({ type: 'snapshot', id: request, rooms: nextRooms })
      setUnreadCountByRoom(Object.fromEntries(nextRooms.map(room => [room.id, room.unreadCount])))
    } catch {
      if (request === roomListRequest.current) setError('Unable to load conversations right now.')
    } finally {
      if (request === roomListRequest.current) setIsLoadingRooms(false)
    }
  }, [])

  const setActiveRoomId = useCallback((roomId: string | null) => {
    activeRoomIdRef.current = roomId
    setActiveRoomIdState(roomId)
  }, [])
  const readConfirmed = useRef(new Set<string>())
  const readInFlight = useRef(new Set<string>())
  const acknowledgeVisibleMessages = useCallback(async (roomId: string, ids: readonly string[]) => {
    if (activeRoomIdRef.current !== roomId || document.visibilityState !== 'visible' ||
        !historyLoadedRooms.current.has(roomId)) return
    let capture: ReturnType<typeof captureStoredSession>
    try { capture = captureStoredSession() } catch { return }
    if (!capture) return
    const eligible = eligibleReadIds(messageCache.current[roomId] ?? [], ids, capture.session.user.id,
      roomId, activeRoomIdRef.current, document.visibilityState === 'visible', historyLoadedRooms.current.has(roomId))
      .filter(id => !readConfirmed.current.has(id) && !readInFlight.current.has(id)).slice(0, 100)
    if (!eligible.length) return
    eligible.forEach(id => readInFlight.current.add(id))
    try {
      const result = await acknowledgeRoomMessages(roomId, eligible)
      if (!isSameSessionIdentity(capture)) return
      result.readMessageIds.forEach(id => readConfirmed.current.add(id))
      notifyUnreadChanged()
      await loadRooms()
    } catch {
      if (isSameSessionIdentity(capture)) setError('Read status could not be saved. Reopen the conversation to retry.')
    } finally { eligible.forEach(id => readInFlight.current.delete(id)) }
  }, [loadRooms])

  const loadMessagesForRoom = useCallback(async (roomId: string, mode: 'recent' | 'older' | 'reset' = 'recent', olderCursor?: string) => {
    const revision = roomRevisions.current.get(roomId) ?? 0
    const hadHistory = historyLoadedRooms.current.has(roomId)
    const epoch = historyEpoch.current
    if (mode !== 'older') attemptedHistoryEpoch.current.set(roomId, epoch)
    historyOperations.current.get(roomId)?.abort()
    const controller = new AbortController(); historyOperations.current.set(roomId, controller)
    const timer = setTimeout(() => controller.abort(), 15_000)
    const current = () => historyOperations.current.get(roomId) === controller && (roomRevisions.current.get(roomId) ?? 0) === revision
    if (mode === 'reset') {
      gapAnchors.current.delete(roomId)
      confirmedAnchors.current.delete(roomId)
      historyLoadedRooms.current.delete(roomId)
    }
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
      const fetchPage = (cursor?: string) => fetchRoomMessages(roomId, cursor, controller.signal)
      let response = await recoverHistory(fetchPage, anchor.ids, anchor.cursor, 5, anchor.scanToEnd)
      if (!current() || controller.signal.aborted) return
      const historyWasCleared = mode === 'recent' && response.status === 'changed'
      if (historyWasCleared) {
        // A clear can happen while this socket is offline. A missing retained
        // anchor means the previous cache cannot be merged into current history.
        response = await recoverHistory(fetchPage, new Set())
        if (!current() || controller.signal.aborted) return
        anchor = { ids: new Set() }
        clearedRoomIds.current.add(roomId)
        dispatchRoom({ type: 'clear', roomId })
        void loadRooms()
      }
      historyLoadedRooms.current.add(roomId)
      const replaceHistory = historyWasCleared || mode === 'reset'
      cacheMessages(roomId, previous => response.messages.reduce((merged, message) => mergeMessageIntoRoom(merged, message), replaceHistory ? [] : previous))
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
  }, [cacheMessages, loadRooms])
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

    void loadMessagesForRoom(activeRoomId, clearedRoomIds.current.has(activeRoomId) ? 'reset' : 'recent')
  }, [activeRoomId, loadMessagesForRoom, roomMessages])

  useEffect(() => {
    activeRoomIdRef.current = activeRoomId
  }, [activeRoomId])

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') void loadRooms()
    }
    window.addEventListener(unreadChangedEvent, refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.removeEventListener(unreadChangedEvent, refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [loadRooms])

  useEffect(() => {
    const historyResets = pendingHistoryResets.current
    const reconcile = (roomId?: string) => {
      roomListRequest.current++
      if (roomId) {
        // Invalidate in-flight history before a delayed payload can merge it.
        historyOperations.current.get(roomId)?.abort()
        historyLoadedRooms.current.delete(roomId)
        historyResets.add(roomId)
        attemptedHistoryEpoch.current.delete(roomId)
      }
      if (unknownRoomTimer.current === null) unknownRoomTimer.current = setTimeout(() => {
        unknownRoomTimer.current = null
        void loadRooms()
        const pending = [...historyResets]
        historyResets.clear()
        for (const id of pending) if (id === activeRoomIdRef.current && !deletedRoomIds.current.has(id)) {
          void loadMessagesForRoom(id, 'reset')
        }
      }, 100)
    }
    const handleNewMessage = (message: RoomMessage) => {
      if (deletedRoomIds.current.has(message.roomId)) return
      // Post-commit clear/send broadcasts can be reordered, including an old
      // message that this client never saw. Reconcile against stored history.
      if (clearedRoomIds.current.has(message.roomId)) { reconcile(message.roomId); return }
      if (seenMessageIds.current.has(message.id)) return
      seenMessageIds.current.add(message.id)
      if (seenMessageIds.current.size > 2000) seenMessageIds.current.delete(seenMessageIds.current.values().next().value!)

      cacheMessages(message.roomId, messages => mergeMessageIntoRoom(messages, message))
      dispatchRoom({ type: 'message', message })
      reconcile()


    }

    const handleRoomActivity = (payload: { roomId: string; updatedAt: string }) => {
      dispatchRoom({ type: 'activity', ...payload })
    }

    const handleRoomCleared = (payload: { roomId: string }) => {
      if (deletedRoomIds.current.has(payload.roomId)) return
      clearedRoomIds.current.add(payload.roomId)
      roomRevisions.current.set(payload.roomId, (roomRevisions.current.get(payload.roomId) ?? 0) + 1)
      // Do not tombstone cached IDs: a delayed clear event may arrive after a
      // genuinely newer send. Stored history decides which messages survived.
      confirmedAnchors.current.set(payload.roomId, new Set()); attemptedHistoryEpoch.current.set(payload.roomId, historyEpoch.current)
      gapAnchors.current.delete(payload.roomId)
      setHistoryGaps(values => ({ ...values, [payload.roomId]: null })); setOlderCursors(values => ({ ...values, [payload.roomId]: null }))
      cacheMessages(payload.roomId, () => [])
      dispatchRoom({ type: 'clear', roomId: payload.roomId })
      setUnreadCountByRoom(values => ({ ...values, [payload.roomId]: 0 }))
      reconcile(payload.roomId)
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
      reconcile()
    }

    const handlePresenceUpdate = (payload: { userId: string; online: boolean }) => {
      dispatchRoom({ type: 'presence', ...payload })
    }

    const handleReady = () => {
      historyEpoch.current++
      void loadRooms()
      const roomId = activeRoomIdRef.current
      if (roomId) void loadMessagesForRoom(roomId, clearedRoomIds.current.has(roomId) ? 'reset' : 'recent')
    }
    websocketClient.connect()
    websocketClient.on('auth:ready', handleReady)
    websocketClient.on('messages:read', loadRooms)
    websocketClient.on('message:new', handleNewMessage)
    websocketClient.on('room:activity', handleRoomActivity)
    websocketClient.on('room:cleared', handleRoomCleared)
    websocketClient.on('room:deleted', handleRoomDeleted)
    websocketClient.on('presence:update', handlePresenceUpdate)

    return () => {
      if (unknownRoomTimer.current !== null) clearTimeout(unknownRoomTimer.current)
      unknownRoomTimer.current = null
      historyResets.clear()
      websocketClient.off('auth:ready', handleReady)
      websocketClient.off('messages:read', loadRooms)
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
      const roomId = activeRoomIdRef.current
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
        if (!isSameSessionIdentity(capture)) return false
        pendingSends.current.delete(roomId)
        // An accepted send clears its draft even when a concurrent clear or
        // delete invalidated the local cache. Never merge that stale response.
        if ((roomRevisions.current.get(roomId) ?? 0) !== revision) return true
        cacheMessages(roomId, messages => mergeMessageIntoRoom(messages, saved))
        dispatchRoom({ type: 'message', message: saved })
        if (clearedRoomIds.current.has(roomId)) {
          void loadRooms()
          void loadMessagesForRoom(roomId, 'reset')
        }
        return true
      } catch {
        setSendError('The message could not be confirmed. Your draft is kept. Check the conversation before retrying.')
        return false
      } finally {
        sendingRef.current = false
        setIsSending(false)
      }
    },
    [cacheMessages, loadRooms, loadMessagesForRoom],
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
    acknowledgeVisibleMessages,
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
