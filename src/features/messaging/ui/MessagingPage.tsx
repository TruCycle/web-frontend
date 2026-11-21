import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, Paperclip, Send, X } from 'lucide-react'
import { useMessages } from '@/features/messaging/hooks/useMessages'
import type { ActiveRoom, RoomMessage, RoomParticipant } from '@/features/messaging/types'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { Button } from '@/shared/ui/button/Button'
import { classNames } from '@/shared/utils/classNames'
import { MessageImageComposer } from './MessageImageComposer'
import { PrivateMessageImage } from './PrivateMessageImage'

const IMAGE_GROUP_WINDOW_MS = 30_000

type MessageRow =
  | { readonly type: 'divider'; readonly key: string; readonly label: string }
  | { readonly type: 'system'; readonly key: string; readonly message: RoomMessage }
  | { readonly type: 'message'; readonly key: string; readonly message: RoomMessage }
  | { readonly type: 'image-group'; readonly key: string; readonly messages: readonly RoomMessage[] }

function formatParticipantName(participant: RoomParticipant): string {
  const fullName = `${participant.firstName ?? ''} ${participant.lastName ?? ''}`.trim()
  return fullName || 'Unknown user'
}

function getRoomDisplayName(room: ActiveRoom, currentUserId?: string): string {
  const otherParticipant =
    room.participants.find((participant) => participant.id !== currentUserId) ??
    room.participants[0]
  return otherParticipant ? formatParticipantName(otherParticipant) : 'Conversation'
}

function getRoomInitials(room: ActiveRoom, currentUserId?: string): string {
  const displayName = getRoomDisplayName(room, currentUserId)
  return displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase()
}

function getMessageSenderInitials(
  message: RoomMessage,
  activeRoom: ActiveRoom | null,
  currentUserId?: string,
): string {
  if (message.sender) {
    const fullName = `${message.sender.firstName ?? ''} ${message.sender.lastName ?? ''}`.trim()
    if (fullName) {
      return fullName
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0] ?? '')
        .join('')
        .toUpperCase()
    }
  }

  if (activeRoom) {
    return getRoomInitials(activeRoom, currentUserId)
  }

  return '--'
}

function formatPreview(message: RoomMessage | null): string {
  if (!message) {
    return 'No messages yet'
  }
  if (message.imageUrl || message.hasAttachment) {
    return message.caption ?? 'Image'
  }
  return message.text ?? 'Message'
}

function parseTimestamp(value: string): Date | null {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date
}

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  )
}

function formatTime(value: string): string {
  const date = parseTimestamp(value)
  if (!date) {
    return ''
  }

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function formatConversationTimestamp(value: string): string {
  const date = parseTimestamp(value)
  if (!date) {
    return ''
  }

  const now = new Date()
  if (isSameDay(date, now)) {
    return formatTime(value)
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (isSameDay(date, yesterday)) {
    return `Yesterday, ${formatTime(value)}`
  }

  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit',
  })
}

function formatDayDivider(value: string): string {
  const date = parseTimestamp(value)
  if (!date) {
    return ''
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function isSystemMessage(message: RoomMessage): boolean {
  return message.direction === 'general' || message.category === 'general'
}

function canGroupImages(previousMessage: RoomMessage, nextMessage: RoomMessage): boolean {
  if (!previousMessage.imageUrl || !nextMessage.imageUrl) {
    return false
  }

  if (previousMessage.direction !== nextMessage.direction) {
    return false
  }

  const previousSenderId = previousMessage.sender?.id ?? null
  const nextSenderId = nextMessage.sender?.id ?? null
  if (previousSenderId !== nextSenderId) {
    return false
  }

  const previousDate = parseTimestamp(previousMessage.createdAt)
  const nextDate = parseTimestamp(nextMessage.createdAt)
  if (!previousDate || !nextDate || !isSameDay(previousDate, nextDate)) {
    return false
  }

  return Math.abs(nextDate.getTime() - previousDate.getTime()) <= IMAGE_GROUP_WINDOW_MS
}

export default function MessagingPage() {
  const { user } = useAuthSession()
  const [searchParams, setSearchParams] = useSearchParams()
  const {
    rooms,
    activeRoom,
    activeRoomId,
    messages,
    isLoadingRooms,
    isLoadingMessages,
    isSending,
    error,
    setActiveRoomId,
    sendMessage,
    sendImage,
    historyGap,
    hasHistoryFailure,
    hasOlderMessages,
    loadOlderMessages,
    resetHistory,
    reloadMessages,
    acknowledgeVisibleMessages,
    hasReadFailure,
    readRetryVersion,
    retryReadStatus,
  } = useMessages()
  const consumedRoomIdRef = useRef<string | null>(null)
  const lastScrolledRoomIdRef = useRef<string | null>(null)
  const messageListRef = useRef<HTMLDivElement | null>(null)
  const nearBottomRef = useRef(true)
  const olderScrollRef = useRef<{ roomId: string; height: number; top: number } | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const inputValue = activeRoomId ? drafts[activeRoomId] ?? '' : ''
  const [previewImage, setPreviewImage] = useState<{ readonly src: string; readonly alt: string } | null>(null)
  const requestedRoomId = searchParams.get('roomId')

  useEffect(() => {
    if (!requestedRoomId) {
      return
    }

    if (consumedRoomIdRef.current === requestedRoomId) {
      return
    }

    const requestedRoom = rooms.find((room) => room.id === requestedRoomId)
    if (!requestedRoom) {
      return
    }

    setActiveRoomId(requestedRoom.id)
    consumedRoomIdRef.current = requestedRoom.id
    setSearchParams((currentParams) => {
      const nextParams = new URLSearchParams(currentParams)
      nextParams.delete('roomId')
      return nextParams
    }, { replace: true })
  }, [requestedRoomId, rooms, setActiveRoomId, setSearchParams])

  useEffect(() => {
    if (!activeRoomId || isLoadingMessages) {
      return
    }

    const messageList = messageListRef.current
    if (!messageList) {
      return
    }

    const roomChanged = lastScrolledRoomIdRef.current !== activeRoomId
    lastScrolledRoomIdRef.current = activeRoomId
    const olderScroll = olderScrollRef.current
    if (olderScroll?.roomId === activeRoomId && !roomChanged) {
      messageList.scrollTop = olderScroll.top + messageList.scrollHeight - olderScroll.height
      olderScrollRef.current = null
      return
    }
    olderScrollRef.current = null
    if (!roomChanged && !nearBottomRef.current) return
    nearBottomRef.current = true
    const behavior: ScrollBehavior = roomChanged ? 'auto' : 'smooth'
    const animationFrameId = window.requestAnimationFrame(() => {
      messageList.scrollTo({
        top: messageList.scrollHeight,
        behavior,
      })
    })

    return () => {
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [activeRoomId, isLoadingMessages, messages.length])

  useEffect(() => {
    const root = messageListRef.current
    if (!root || !activeRoomId || isLoadingMessages || hasHistoryFailure) return
    // The implicit viewport root also clips scrolling ancestors. An explicit
    // list root could count rows while the whole panel is offscreen on mobile.
    const visible = new Set<string>()
    let timer: ReturnType<typeof setTimeout> | undefined
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).dataset.readMessageId
        if (!id) continue
        if (entry.isIntersecting && entry.intersectionRatio > 0) visible.add(id)
        else visible.delete(id)
      }
      clearTimeout(timer)
      if (document.visibilityState === 'visible' && visible.size) timer = setTimeout(() => {
        if (document.visibilityState === 'visible') void acknowledgeVisibleMessages(activeRoomId, [...visible])
      }, 100)
    }, { threshold: [0, 0.5] })
    const observe = () => {
      observer.disconnect(); visible.clear(); clearTimeout(timer)
      if (document.visibilityState === 'visible') root.querySelectorAll('[data-read-message-id]').forEach(node => observer.observe(node))
    }
    observe()
    document.addEventListener('visibilitychange', observe)
    return () => { observer.disconnect(); clearTimeout(timer); document.removeEventListener('visibilitychange', observe) }
  }, [activeRoomId, messages, isLoadingMessages, hasHistoryFailure, acknowledgeVisibleMessages, readRetryVersion])

  const filteredRooms = useMemo(() => {
    const query = searchValue.trim().toLowerCase()
    if (!query) {
      return rooms
    }

    return rooms.filter((room) =>
      getRoomDisplayName(room, user?.id).toLowerCase().includes(query),
    )
  }, [rooms, searchValue, user?.id])
  const messageRows = useMemo(() => {
    const rows: MessageRow[] = []
    let previousDate: Date | null = null
    let index = 0

    while (index < messages.length) {
      const currentMessage = messages[index]
      const currentDate = parseTimestamp(currentMessage.createdAt)
      if (currentDate && (!previousDate || !isSameDay(currentDate, previousDate))) {
        rows.push({
          type: 'divider',
          key: `divider-${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`,
          label: formatDayDivider(currentMessage.createdAt),
        })
      }

      if (isSystemMessage(currentMessage)) {
        rows.push({
          type: 'system',
          key: currentMessage.id,
          message: currentMessage,
        })
        if (currentDate) {
          previousDate = currentDate
        }
        index += 1
        continue
      }

      if (currentMessage.imageUrl) {
        const groupedImages: RoomMessage[] = [currentMessage]
        let scanIndex = index + 1
        let lastGroupedMessage = currentMessage

        while (scanIndex < messages.length) {
          const nextMessage = messages[scanIndex]
          if (isSystemMessage(nextMessage) || !nextMessage.imageUrl) {
            break
          }

          if (!canGroupImages(lastGroupedMessage, nextMessage)) {
            break
          }

          groupedImages.push(nextMessage)
          lastGroupedMessage = nextMessage
          scanIndex += 1
        }

        if (groupedImages.length > 1) {
          rows.push({
            type: 'image-group',
            key: `image-group-${groupedImages[0].id}`,
            messages: groupedImages,
          })
          const lastGroupDate = parseTimestamp(groupedImages[groupedImages.length - 1].createdAt)
          if (lastGroupDate) {
            previousDate = lastGroupDate
          }
          index = scanIndex
          continue
        }
      }

      rows.push({
        type: 'message',
        key: currentMessage.id,
        message: currentMessage,
      })
      if (currentDate) {
        previousDate = currentDate
      }
      index += 1
    }

    return rows
  }, [messages])

  const handleSendMessage = async () => {
    const messageText = inputValue.trim()
    if (!messageText) {
      return
    }

    const roomId = activeRoomId
    const draft = inputValue
    if (await sendMessage(messageText)) {
      if (roomId) setDrafts(current => current[roomId] === draft ? { ...current, [roomId]: '' } : current)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-6">
      <div>
        <h1 className="text-[30px] font-semibold leading-9 tracking-[-0.02em] text-tc-brand-ink">Messaging</h1>
        <p className="mt-1 text-base leading-6 text-tc-brand-body">Coordinate collections in real time.</p>
      </div>

      <div className="grid h-[calc(100vh-10rem)] min-h-[700px] flex-1 gap-4 md:h-[calc(100vh-14rem)] md:min-h-[560px] xl:grid-cols-[320px_1fr]">
        <div className="flex h-full min-h-0 flex-col rounded-tc-lg border border-tc-brand-line bg-white p-5">
          <div className="pb-4">
            <h2 className="text-lg font-semibold leading-6 text-tc-brand-ink">Conversations</h2>
            <div className="relative mt-4">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-tc-brand-muted"
                size={18}
              />
              <input
                type="text"
                className="h-11 w-full rounded-full border border-tc-brand-control bg-white pl-11 pr-4 text-sm text-tc-brand-ink outline-none placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:ring-2 focus:ring-tc-brand-mint"
                placeholder="Search conversations"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoadingRooms ? (
              <p className="rounded-tc-md border border-tc-brand-line px-4 py-3.5 text-sm text-tc-brand-body">
                Loading conversations...
              </p>
            ) : null}

            {!isLoadingRooms && filteredRooms.length === 0 ? (
              <p className="rounded-tc-md border border-dashed border-tc-brand-control px-4 py-3.5 text-sm text-tc-brand-body">
                No conversations found.
              </p>
            ) : null}

            {!isLoadingRooms &&
              filteredRooms.map((room) => {
                const unreadCount = room.unreadCount
                const isActiveRoom = activeRoomId === room.id
                const isUnread = unreadCount > 0

                return (
                  <button
                    key={room.id}
                    className={classNames(
                      'mb-1.5 flex w-full items-start gap-3 rounded-tc-md border p-3 text-left transition',
                      isActiveRoom
                        ? 'border-tc-brand-mintLine bg-tc-brand-mintSoft'
                        : isUnread
                          ? 'border-tc-brand-line bg-tc-brand-haze hover:bg-tc-brand-soft'
                          : 'border-transparent hover:bg-tc-brand-soft',
                    )}
                    onClick={() => setActiveRoomId(room.id)}
                  >
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tc-brand-deep text-xs font-semibold text-white">
                      {getRoomInitials(room, user?.id)}
                    </span>
                    <span className="flex min-w-0 flex-1 items-start justify-between gap-2">
                      <span className="flex min-w-0 flex-col items-start justify-between gap-1">
                        <span
                          className={classNames(
                            'max-w-full truncate text-sm text-tc-brand-ink',
                            isUnread ? 'font-semibold' : 'font-medium',
                          )}
                        >
                          {getRoomDisplayName(room, user?.id)}
                        </span>
                        <span
                          className={classNames(
                            'block max-w-full truncate text-[13px] leading-5',
                            isUnread ? 'font-medium text-tc-brand-ink' : 'text-tc-brand-body',
                          )}
                        >
                          {formatPreview(room.lastMessage)}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <span className="text-xs text-tc-brand-muted">
                          {room.lastMessage
                            ? formatConversationTimestamp(room.lastMessage.createdAt)
                            : ''}
                        </span>
                        {isUnread ? (
                          <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-tc-brand-mint px-1.5 text-xs font-semibold leading-none text-tc-brand-onMint">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </button>
                )
              })}
          </div>
        </div>

        <div className="flex h-full min-h-0 flex-col rounded-tc-lg border border-tc-brand-line bg-white">
          <div className="flex items-center gap-3 border-b border-tc-brand-line px-5 py-4">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-tc-brand-deep text-xs font-semibold text-white">
              {activeRoom ? getRoomInitials(activeRoom, user?.id) : '--'}
            </span>
            <div>
              <span className="text-sm font-semibold text-tc-brand-ink">
                {activeRoom ? getRoomDisplayName(activeRoom, user?.id) : 'Select a room'}
              </span>
            </div>
          </div>

          <div
            ref={messageListRef}
            onScroll={(event) => {
              const list = event.currentTarget
              nearBottomRef.current = list.scrollHeight - list.scrollTop - list.clientHeight < 80
            }}
            className="min-h-[520px] flex-1 space-y-3 overflow-y-auto p-4 md:min-h-0 md:p-5"
          >
            {historyGap && <div role="status" className="space-y-2 rounded-tc-md border border-tc-brand-control bg-tc-brand-soft p-3 text-sm text-tc-brand-ink">
              <p>{historyGap === 'changed' ? 'The saved conversation has changed. Reload it to check the current history.' : 'Some missed messages have not loaded yet. Continue to check the gap.'}</p>
              <button className="min-h-11 font-semibold text-tc-brand-deep underline underline-offset-4 hover:text-black disabled:cursor-not-allowed disabled:opacity-50" disabled={isLoadingMessages} onClick={() => void (historyGap === 'changed' ? resetHistory() : reloadMessages())}>{historyGap === 'changed' ? 'Reload conversation' : 'Continue loading missed messages'}</button>
            </div>}
            {hasHistoryFailure && !historyGap && <p role="status">Conversation history is unavailable. <button className="min-h-11 font-semibold text-tc-brand-deep underline underline-offset-4 hover:text-black disabled:cursor-not-allowed disabled:opacity-50" disabled={isLoadingMessages} onClick={() => void reloadMessages()}>Refresh conversation</button></p>}
            {hasReadFailure ? (
              <p role="status">
                Read status could not be saved.{' '}
                <button type="button" className="min-h-11 font-semibold text-tc-brand-deep underline underline-offset-4 hover:text-black disabled:cursor-not-allowed disabled:opacity-50" disabled={isLoadingMessages} onClick={retryReadStatus}>
                  Retry read status
                </button>
              </p>
            ) : null}
            {hasOlderMessages && !historyGap ? (
              <button type="button" className="mx-auto flex min-h-11 w-fit items-center rounded-full border border-tc-brand-line bg-white px-4 text-[13px] font-semibold text-tc-brand-ink transition hover:bg-tc-brand-soft disabled:cursor-not-allowed disabled:opacity-50" disabled={isLoadingMessages} onClick={() => {
                const list = messageListRef.current
                if (list && activeRoomId) {
                  olderScrollRef.current = { roomId: activeRoomId, height: list.scrollHeight, top: list.scrollTop }
                }
                void loadOlderMessages()
              }}>Load older messages</button>
            ) : null}
            {isLoadingMessages ? (
              <p className="rounded-tc-md border border-tc-brand-line px-4 py-3.5 text-sm text-tc-brand-body">
                Loading messages...
              </p>
            ) : null}

            {!isLoadingMessages && !hasHistoryFailure && messages.length === 0 ? (
              <p className="rounded-tc-md border border-dashed border-tc-brand-control px-4 py-3.5 text-sm text-tc-brand-body">
                No messages yet in this room.
              </p>
            ) : null}

            {messageRows.map((row) => {
              if (row.type === 'divider') {
                return (
                  <div key={row.key} className="my-1 flex items-center gap-3 text-xs text-tc-brand-muted">
                    <span className="whitespace-nowrap">{row.label}</span>
                    <span className="h-px flex-1 bg-tc-brand-line" />
                  </div>
                )
              }

              if (row.type === 'system') {
                return (
                  <div
                    key={row.key}
                    className="mx-auto w-fit rounded-full bg-tc-brand-soft px-4 py-2 text-center text-[13px] leading-5 text-tc-brand-body"
                  >
                    {row.message.text ?? row.message.caption ?? 'System update'}
                  </div>
                )
              }

              if (row.type === 'image-group') {
                const firstMessage = row.messages[0]
                const lastMessage = row.messages[row.messages.length - 1]
                const isOutgoing = firstMessage.direction === 'outgoing'
                const incomingSenderInitials = getMessageSenderInitials(
                  firstMessage,
                  activeRoom ?? null,
                  user?.id,
                )
                const imageGridClassName =
                  row.messages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                const groupedCaption =
                  row.messages
                    .map((message) => (message.text ?? message.caption ?? '').trim())
                    .filter((text) => text.length > 0)
                    .at(-1) ?? ''

                return (
                  <div
                    key={row.key}
                    className={classNames('flex', isOutgoing ? 'justify-end' : 'justify-start')}
                  >
                    <div className={classNames('flex items-start', isOutgoing ? '' : 'gap-2')}>
                      {!isOutgoing ? (
                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tc-brand-deep text-xs font-semibold text-white">
                          {incomingSenderInitials}
                        </span>
                      ) : null}

                      <div className="flex max-w-[420px] flex-col items-start">
                        <div
                          className={classNames(
                            'grid gap-2 rounded-tc-lg p-2',
                            imageGridClassName,
                            isOutgoing ? 'bg-tc-brand-deep' : 'bg-tc-brand-mintSoft',
                          )}
                        >
                          {row.messages.map((message) => (
                            <div key={message.id} data-read-message-id={message.category === 'direct' && message.sender && message.sender.id !== user?.id ? message.id : undefined} className="rounded-tc-md bg-white p-1">
                              <button
                                type="button"
                                className="block w-full overflow-hidden rounded-tc-sm"
                                onClick={() =>
                                  setPreviewImage({
                                    src: message.imageUrl ?? '',
                                    alt: message.caption ?? 'Message attachment',
                                  })
                                }
                              >
                                <img
                                  src={message.imageUrl ?? ''}
                                  alt={message.caption ?? 'Message attachment'}
                                  className="h-28 w-full rounded-tc-sm object-cover sm:h-36"
                                />
                              </button>
                            </div>
                          ))}
                        </div>
                        {groupedCaption ? (
                          <div
                            className={classNames(
                              'mt-1 max-w-full rounded-tc-lg px-4 py-3 text-sm leading-5 [overflow-wrap:anywhere]',
                              isOutgoing ? 'self-end bg-tc-brand-deep text-right text-white' : 'self-start bg-tc-brand-mintSoft text-left text-tc-brand-ink',
                            )}
                          >
                            {groupedCaption}
                          </div>
                        ) : null}
                        <div className="mt-1 px-1.5 text-left text-xs text-tc-brand-muted">
                          {formatTime(lastMessage.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }

              const { message } = row
              const isOutgoing = message.direction === 'outgoing'
              const incomingSenderInitials = getMessageSenderInitials(
                message,
                activeRoom ?? null,
                user?.id,
              )

              return (
                <div
                  key={row.key}
                  data-read-message-id={message.category === 'direct' && message.sender && message.sender.id !== user?.id ? message.id : undefined}
                  className={classNames('flex', isOutgoing ? 'justify-end' : 'justify-start')}
                >
                  <div className={classNames('flex items-start', isOutgoing ? '' : 'gap-2')}>
                    {!isOutgoing ? (
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tc-brand-deep text-xs font-semibold text-white">
                        {incomingSenderInitials}
                      </span>
                    ) : null}

                    <div className="flex max-w-[420px] flex-col items-start">
                      <div
                        className={classNames(
                          'rounded-tc-lg px-4 py-3 text-sm leading-5 [overflow-wrap:anywhere]',
                          isOutgoing ? 'bg-tc-brand-deep text-white' : 'bg-tc-brand-mintSoft text-tc-brand-ink',
                        )}
                      >
                        {message.hasAttachment && user ? (
                          <PrivateMessageImage
                            key={`${user.id}:${message.roomId}:${message.id}`}
                            roomId={message.roomId}
                            messageId={message.id}
                            alt={message.caption ?? 'Message attachment'}
                          />
                        ) : message.imageUrl ? (
                          <button
                            type="button"
                            className="mb-2 block w-full overflow-hidden rounded-tc-sm"
                            onClick={() =>
                              setPreviewImage({
                                src: message.imageUrl ?? '',
                                alt: message.caption ?? 'Message attachment',
                              })
                            }
                          >
                            <img
                              src={message.imageUrl}
                              alt={message.caption ?? 'Message attachment'}
                              className="max-h-48 w-full rounded-tc-sm object-cover"
                            />
                          </button>
                        ) : null}
                        {message.text ?? message.caption ?? ''}
                      </div>
                      <div className="mt-1 px-1.5 text-left text-xs text-tc-brand-muted">
                        {formatTime(message.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-2.5 rounded-b-tc-lg border-t border-tc-brand-line bg-white px-4 py-3 md:px-5 md:py-4">
            {import.meta.env.VITE_MESSAGE_ATTACHMENTS_ENABLED === 'true' && activeRoomId && user ? (
              <MessageImageComposer key={`${user.id}:${activeRoomId}`} disabled={isSending} send={sendImage} />
            ) : (
              <button type="button" aria-label="Attach image" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-tc-brand-control bg-white text-tc-brand-deep transition hover:bg-tc-brand-soft disabled:cursor-not-allowed disabled:opacity-50" disabled title="Image attachments are unavailable">
                <Paperclip size={20} />
              </button>
            )}
            <div className="flex min-w-0 flex-1 items-center rounded-full border border-tc-brand-control bg-white px-4 focus-within:border-tc-brand-deep focus-within:ring-2 focus-within:ring-tc-brand-mint">
              <input
                type="text"
                className="h-[42px] w-full bg-transparent text-sm text-tc-brand-ink outline-none placeholder:text-tc-brand-muted"
                placeholder="Type your message..."
                aria-label="Message"
                maxLength={4000}
                value={inputValue}
                disabled={!activeRoomId || isSending}
                onChange={(event) => { const value = event.target.value; if (activeRoomId) setDrafts(current => ({ ...current, [activeRoomId]: value })) }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void handleSendMessage()
                  }
                }}
              />
            </div>
            <Button
              aria-label="Send message"
              className="h-11 w-11 shrink-0 !rounded-full p-0 !bg-tc-brand-deep hover:!bg-tc-brand-hover"
              onClick={() => {
                void handleSendMessage()
              }}
              disabled={!activeRoomId || isSending || !inputValue.trim()}
            >
              <Send className="text-white" size={18} />
            </Button>
          </div>
        </div>
      </div>

      {previewImage ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-tc-brand-ink/55 p-4 backdrop-blur-[16px]"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative w-full max-w-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-2 top-2 inline-flex h-11 w-11 items-center justify-center rounded-full bg-tc-brand-deep text-white transition hover:bg-tc-brand-hover"
              onClick={() => setPreviewImage(null)}
            >
              <X size={18} />
            </button>
            <img
              src={previewImage.src}
              alt={previewImage.alt}
              className="max-h-[85vh] w-full rounded-tc-xl object-contain"
            />
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-tc-brand-danger">{error}</p> : null}
    </div>
  )
}
