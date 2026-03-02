import { apiRequest } from '@/shared/lib/api/client'
import { unwrapApiData } from '@/shared/lib/api/envelope'
import type { ActiveRoom, RoomMessage, RoomParticipant } from '@/features/messaging/types'

interface RoomMessagesResponse {
  readonly messages: RoomMessage[]
  readonly nextCursor: string | null
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function mapParticipant(value: unknown): RoomParticipant | null {
  const participant = asRecord(value)
  const id = readString(participant?.id)
  if (!participant || !id) {
    return null
  }

  return {
    id,
    firstName: readString(participant.firstName),
    lastName: readString(participant.lastName),
    profileImageUrl: readString(participant.profileImageUrl),
    online: Boolean(participant.online),
  }
}

function mapMessage(value: unknown): RoomMessage | null {
  const message = asRecord(value)
  const id = readString(message?.id)
  const roomId = readString(message?.roomId)
  if (!message || !id || !roomId) {
    return null
  }

  const sender = asRecord(message.sender)

  return {
    id,
    roomId,
    direction: (readString(message.direction) ?? 'incoming') as RoomMessage['direction'],
    category: (readString(message.category) ?? 'direct') as RoomMessage['category'],
    imageUrl: readString(message.imageUrl),
    caption: readString(message.caption),
    text: readString(message.text),
    createdAt: readString(message.createdAt) ?? new Date().toISOString(),
    sender: sender
      ? {
          id: readString(sender.id) ?? 'system',
          firstName: readString(sender.firstName),
          lastName: readString(sender.lastName),
          profileImageUrl: readString(sender.profileImageUrl),
        }
      : null,
  }
}

function mapRoom(value: unknown): ActiveRoom | null {
  const room = asRecord(value)
  const id = readString(room?.id)
  if (!room || !id) {
    return null
  }

  const participants = Array.isArray(room.participants)
    ? room.participants
        .map((entry) => mapParticipant(entry))
        .filter((entry): entry is RoomParticipant => entry !== null)
    : []
  const lastMessage = mapMessage(room.lastMessage)

  return {
    id,
    participants,
    lastMessage,
    createdAt: readString(room.createdAt) ?? new Date().toISOString(),
    updatedAt: readString(room.updatedAt) ?? new Date().toISOString(),
  }
}

export async function fetchActiveRooms(): Promise<ActiveRoom[]> {
  const response = await apiRequest<unknown>('/messages/rooms/active')
  const data = unwrapApiData<unknown>(response)
  if (!Array.isArray(data)) {
    return []
  }

  return data.map((entry) => mapRoom(entry)).filter((entry): entry is ActiveRoom => entry !== null)
}

export async function fetchRoomMessages(roomId: string): Promise<RoomMessagesResponse> {
  const response = await apiRequest<unknown>(`/messages/rooms/${roomId}/messages`)
  const data = asRecord(unwrapApiData<unknown>(response))
  const messages = Array.isArray(data?.messages)
    ? data.messages
        .map((entry) => mapMessage(entry))
        .filter((entry): entry is RoomMessage => entry !== null)
    : []

  return {
    messages,
    nextCursor: readString(data?.nextCursor),
  }
}

export async function createOrFindRoom(otherUserId: string): Promise<ActiveRoom> {
  const response = await apiRequest<unknown, { otherUserId: string }>('/messages/rooms', {
    method: 'POST',
    body: { otherUserId },
  })
  const data = unwrapApiData<unknown>(response)
  const room = mapRoom(data)
  if (!room) {
    throw new Error('Unexpected room response from server.')
  }

  return room
}

export async function sendGeneralMessage(
  roomId: string,
  payload: { readonly title?: string; readonly text: string },
): Promise<RoomMessage> {
  const response = await apiRequest<unknown, { title?: string; text: string }>(
    `/messages/rooms/${roomId}/messages/general`,
    {
      method: 'POST',
      body: {
        ...(payload.title ? { title: payload.title } : {}),
        text: payload.text,
      },
    },
  )

  const data = unwrapApiData<unknown>(response)
  const message = mapMessage(data)
  if (!message) {
    throw new Error('Unexpected message response from server.')
  }

  return message
}
