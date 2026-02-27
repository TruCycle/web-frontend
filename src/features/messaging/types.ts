export type MessageDirection = 'incoming' | 'outgoing' | 'general'

export interface RoomParticipant {
  readonly id: string
  readonly firstName: string | null
  readonly lastName: string | null
  readonly profileImageUrl: string | null
  readonly online: boolean
}

export interface RoomMessage {
  readonly id: string
  readonly roomId: string
  readonly direction: MessageDirection
  readonly category: 'direct' | 'general'
  readonly imageUrl: string | null
  readonly caption: string | null
  readonly text: string | null
  readonly createdAt: string
  readonly sender: {
    readonly id: string
    readonly firstName: string | null
    readonly lastName: string | null
    readonly profileImageUrl: string | null
  } | null
}

export interface ActiveRoom {
  readonly id: string
  readonly participants: readonly RoomParticipant[]
  readonly lastMessage: RoomMessage | null
  readonly createdAt: string
  readonly updatedAt: string
}
