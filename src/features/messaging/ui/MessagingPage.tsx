import { useMemo, useState } from 'react'
import { Search, Paperclip, Send, X } from 'lucide-react'
import { useMessages } from '@/features/messaging/hooks/useMessages'
import type { ActiveRoom, RoomMessage, RoomParticipant } from '@/features/messaging/types'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { Button } from '@/shared/ui/button/Button'
import { classNames } from '@/shared/utils/classNames'

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
  if (message.imageUrl) {
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
  } = useMessages()
  const [searchValue, setSearchValue] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [previewImage, setPreviewImage] = useState<{ readonly src: string; readonly alt: string } | null>(null)

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

    await sendMessage(messageText)
    setInputValue('')
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Messaging</h1>
        <p className="text-slate-500">Coordinate collections in real time.</p>
      </div>

      <div className="grid h-[calc(100vh-10rem)] min-h-[700px] flex-1 gap-4 rounded-2xl p-4 md:h-[calc(100vh-14rem)] md:min-h-[560px] xl:grid-cols-[400px_1fr]">
        <div className="flex h-full min-h-0 flex-col rounded-xl bg-white p-7">
          <div className="pb-5">
            <h2 className="text-lg text-black">Conversations</h2>
            <div className="relative mt-5">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B99]"
                size={18}
              />
              <input
                type="text"
                className="h-10 w-full rounded-xl border border-[#E2E8F0] pl-10 pr-3 text-sm outline-none focus:border-lime-400 focus:ring-4 focus:ring-[#A4F5A61A] focus:ring-offset-[-1px]"
                placeholder="Search conversations"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoadingRooms ? (
              <p className="rounded-xl border border-slate-200 p-3 text-sm text-slate-500">
                Loading conversations...
              </p>
            ) : null}

            {!isLoadingRooms && filteredRooms.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-500">
                No conversations found.
              </p>
            ) : null}

            {!isLoadingRooms && filteredRooms.map((room) => (
              <button
                key={room.id}
                className={classNames(
                  'mb-2 flex w-full items-start gap-3 rounded-lg p-3 text-left transition',
                  activeRoomId === room.id
                    ? 'bg-[#A4F5A61A] border border-[#15A119]'
                    : 'hover:bg-slate-50',
                )}
                onClick={() => setActiveRoomId(room.id)}
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#15A1191A] text-xs font-semibold text-slate-700">
                  {getRoomInitials(room, user?.id)}
                </span>
                <span className="flex flex-col items-start justify-between gap-1">
                  <span className="truncate text-sm font-semibold text-slate-900">
                    {getRoomDisplayName(room, user?.id)}
                  </span>
                  <span className="block truncate text-sm text-slate-500">
                    {formatPreview(room.lastMessage)}
                  </span>
                  <span className="text-xs text-slate-400">
                    {room.lastMessage
                      ? formatConversationTimestamp(room.lastMessage.createdAt)
                      : ''}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex h-full min-h-0 flex-col rounded-xl bg-white">
          <div className="flex items-center gap-3 border-b border-slate-200 p-5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#15A1191A] text-xs font-semibold text-slate-700">
              {activeRoom ? getRoomInitials(activeRoom, user?.id) : '--'}
            </span>
            <div>
              <span className="font-semibold text-slate-900">
                {activeRoom ? getRoomDisplayName(activeRoom, user?.id) : 'Select a room'}
              </span>
            </div>
          </div>

          <div className="min-h-[520px] flex-1 space-y-3 overflow-y-auto p-4 md:min-h-0 md:p-7">
            {isLoadingMessages ? (
              <p className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-500">
                Loading messages...
              </p>
            ) : null}

            {!isLoadingMessages && messages.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white p-3 text-sm text-slate-500">
                No messages yet in this room.
              </p>
            ) : null}

            {messageRows.map((row) => {
              if (row.type === 'divider') {
                return (
                  <div key={row.key} className="my-1 flex items-center gap-3 text-xs text-slate-400">
                    <span className="whitespace-nowrap">{row.label}</span>
                    <span className="h-px flex-1 bg-slate-200" />
                  </div>
                )
              }

              if (row.type === 'system') {
                return (
                  <div
                    key={row.key}
                    className="mx-auto w-fit rounded-full bg-[#F8FAFC] px-5 py-2 text-center text-sm text-[#15A119]"
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

                return (
                  <div
                    key={row.key}
                    className={classNames('flex', isOutgoing ? 'justify-end' : 'justify-start')}
                  >
                    <div className={classNames('flex items-start', isOutgoing ? '' : 'gap-2')}>
                      {!isOutgoing ? (
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#15A1191A] text-xs font-semibold text-slate-700">
                          {incomingSenderInitials}
                        </span>
                      ) : null}

                      <div className="flex max-w-[420px] flex-col items-start">
                        <div
                          className={classNames(
                            'grid gap-2 rounded-2xl p-2',
                            imageGridClassName,
                            isOutgoing ? 'bg-[#A4F5A6]' : 'bg-[#F8FAFC]',
                          )}
                        >
                          {row.messages.map((message) => (
                            <div key={message.id} className="rounded-xl bg-white/80 p-1">
                              <button
                                type="button"
                                className="block w-full overflow-hidden rounded-lg"
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
                                  className="h-28 w-full rounded-lg object-cover sm:h-36"
                                />
                              </button>
                              {message.text ?? message.caption ? (
                                <p className="mt-1 px-1 text-xs text-[#222222]">
                                  {message.text ?? message.caption}
                                </p>
                              ) : null}
                            </div>
                          ))}
                        </div>
                        <div className="mt-1.5 pl-1 text-left text-xs text-[#222222BF]">
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
                  className={classNames('flex', isOutgoing ? 'justify-end' : 'justify-start')}
                >
                  <div className={classNames('flex items-start', isOutgoing ? '' : 'gap-2')}>
                    {!isOutgoing ? (
                      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#15A1191A] text-xs font-semibold text-slate-700">
                        {incomingSenderInitials}
                      </span>
                    ) : null}

                    <div className="flex max-w-[420px] flex-col items-start">
                      <div
                        className={classNames(
                          'rounded-2xl px-5 py-1.5 text-sm text-[#222222]',
                          isOutgoing ? 'bg-[#A4F5A6]' : 'bg-[#F8FAFC]',
                        )}
                      >
                        {message.imageUrl ? (
                          <button
                            type="button"
                            className="mb-2 block w-full overflow-hidden rounded-lg"
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
                              className="max-h-48 w-full rounded-lg object-cover"
                            />
                          </button>
                        ) : null}
                        {message.text ?? message.caption ?? ''}
                      </div>
                      <div className="mt-1.5 pl-1 text-left text-xs text-[#222222BF]">
                        {formatTime(message.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-2 border-t border-[#F8FAFC] bg-white p-3">
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#121212] hover:bg-slate-100"
              disabled
              title="Image upload endpoint is available; attachment UI will be wired next."
            >
              <Paperclip size={20} />
            </button>
            <div className="flex flex-1 items-center rounded-xl border border-[#E2E8F0] px-3">
              <input
                type="text"
                className="h-11 w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                placeholder="Type your message..."
                value={inputValue}
                disabled={!activeRoomId || isSending}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    void handleSendMessage()
                  }
                }}
              />
            </div>
            <Button
              className="h-11 w-11 rounded-xl p-0 bg-[#15A119] hover:bg-[#15A119E0]"
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
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#22222299] p-4 backdrop-blur-[16px]"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative w-full max-w-3xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
              onClick={() => setPreviewImage(null)}
            >
              <X size={18} />
            </button>
            <img
              src={previewImage.src}
              alt={previewImage.alt}
              className="max-h-[85vh] w-full rounded-2xl object-contain"
            />
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  )
}
