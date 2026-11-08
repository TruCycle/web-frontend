import type { RoomMessage } from '@/features/messaging/types'

/** Receipt requests name observed rows, never a timestamp/UUID high watermark. */
export function eligibleReadIds(messages: readonly RoomMessage[], observedIds: readonly string[], viewerId: string,
  roomId: string, activeRoomId: string | null, visible: boolean, historyLoaded: boolean): string[] {
  if (!visible || !historyLoaded || activeRoomId !== roomId) return []
  const incoming = new Set(messages.filter(message => message.roomId === roomId && message.category === 'direct' &&
    message.sender && message.sender.id !== viewerId).map(message => message.id))
  return [...new Set(observedIds)].filter(id => incoming.has(id)).slice(0, 100)
}
