import { useMemo, useState } from 'react'
import { Search, Paperclip, Send } from 'lucide-react'
import { useMessages } from '@/features/messaging/hooks/useMessages'
import type { ActiveRoom, RoomMessage, RoomParticipant } from '@/features/messaging/types'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { Button } from '@/shared/ui/button/Button'
import { classNames } from '@/shared/utils/classNames'

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

function formatPreview(message: RoomMessage | null): string {
  if (!message) {
    return 'No messages yet'
  }
  if (message.imageUrl) {
    return message.caption ?? 'Image'
  }
  return message.text ?? 'Message'
}

function formatTimestamp(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function isSystemMessage(message: RoomMessage): boolean {
  return message.direction === 'general' || message.category === 'general'
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

  const filteredRooms = useMemo(() => {
    const query = searchValue.trim().toLowerCase()
    if (!query) {
      return rooms
    }

    return rooms.filter((room) =>
      getRoomDisplayName(room, user?.id).toLowerCase().includes(query),
    )
  }, [rooms, searchValue, user?.id])

  const handleSendMessage = async () => {
    const messageText = inputValue.trim()
    if (!messageText) {
      return
    }

    await sendMessage(messageText)
    setInputValue('')
  }

  const activeParticipant =
    activeRoom?.participants.find((participant) => participant.id !== user?.id) ??
    activeRoom?.participants[0]

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Messaging</h1>
        <p className="text-slate-500">Coordinate collections in real time.</p>
      </div>

      <div className="grid h-[calc(100vh-14rem)] min-h-[560px] flex-1 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm xl:grid-cols-[320px_1fr]">
        <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 p-3">
            <h2 className="text-lg font-semibold text-slate-900">Conversations</h2>
            <div className="relative mt-2">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
                placeholder="Search conversations"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
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

            {filteredRooms.map((room) => (
              <button
                key={room.id}
                className={classNames(
                  'mb-2 flex w-full items-start gap-3 rounded-xl p-3 text-left transition',
                  activeRoomId === room.id
                    ? 'bg-lime-50 ring-1 ring-lime-200'
                    : 'hover:bg-slate-50',
                )}
                onClick={() => setActiveRoomId(room.id)}
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                  {getRoomInitials(room, user?.id)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900">
                      {getRoomDisplayName(room, user?.id)}
                    </span>
                    <span className="text-xs text-slate-400">
                      {room.lastMessage ? formatTimestamp(room.lastMessage.createdAt) : ''}
                    </span>
                  </span>
                  <span className="mt-1 block truncate text-sm text-slate-500">
                    {formatPreview(room.lastMessage)}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex h-full min-h-0 flex-col rounded-xl border border-slate-200">
          <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
              {activeRoom ? getRoomInitials(activeRoom, user?.id) : '--'}
            </span>
            <div>
              <span className="font-semibold text-slate-900">
                {activeRoom ? getRoomDisplayName(activeRoom, user?.id) : 'Select a room'}
              </span>
              {activeParticipant ? (
                <p className="text-xs text-slate-500">
                  {activeParticipant.online ? 'Online' : 'Offline'}
                </p>
              ) : null}
            </div>
          </div>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
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

            {messages.map((message) => {
              if (isSystemMessage(message)) {
                return (
                  <div
                    key={message.id}
                    className="mx-auto max-w-[70ch] rounded-lg bg-slate-100 px-3 py-2 text-center text-xs text-slate-500"
                  >
                    {message.text ?? message.caption ?? 'System update'}
                  </div>
                )
              }

              const isOutgoing = message.direction === 'outgoing'
              return (
                <div
                  key={message.id}
                  className={classNames('flex', isOutgoing ? 'justify-end' : 'justify-start')}
                >
                  <div
                    className={classNames(
                      'max-w-[420px] rounded-xl px-3 py-2 text-sm',
                      isOutgoing
                        ? 'bg-lime-500 text-white'
                        : 'border border-slate-200 bg-white text-slate-800',
                    )}
                  >
                    {message.imageUrl ? (
                      <img
                        src={message.imageUrl}
                        alt={message.caption ?? 'Message attachment'}
                        className="mb-2 max-h-48 w-full rounded-lg object-cover"
                      />
                    ) : null}
                    {message.text ?? message.caption ?? ''}
                    <div
                      className={classNames(
                        'mt-1 text-right text-[11px]',
                        isOutgoing ? 'text-white/80' : 'text-slate-400',
                      )}
                    >
                      {formatTimestamp(message.createdAt)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center gap-2 border-t border-slate-200 bg-white p-3">
            <button
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              disabled
              title="Image upload endpoint is available; attachment UI will be wired next."
            >
              <Paperclip size={20} />
            </button>
            <div className="flex flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 px-3">
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
              className="h-11 w-11 rounded-xl p-0"
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

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  )
}
