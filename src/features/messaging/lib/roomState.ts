import type { ActiveRoom, RoomMessage } from '@/features/messaging/types'

export interface RoomState {
  readonly rooms: ActiveRoom[]
  readonly versions: ReadonlyMap<string, number>
  readonly deleted: ReadonlySet<string>
  readonly latest: ReadonlyMap<string, RoomMessage>
  readonly clearedVersions: ReadonlyMap<string, number>
  readonly clearedMessageIds: ReadonlySet<string>
  readonly presenceVersions: ReadonlyMap<string, number>
  readonly online: ReadonlyMap<string, boolean>
  readonly snapshot: { id: number; versions: ReadonlyMap<string, number>; presenceVersions: ReadonlyMap<string, number> } | null
}
export type RoomAction =
  | { type: 'start'; id: number }
  | { type: 'snapshot'; id: number; rooms: ActiveRoom[] }
  | { type: 'message'; message: RoomMessage }
  | { type: 'activity'; roomId: string; updatedAt: string }
  | { type: 'clear'; roomId: string }
  | { type: 'delete'; roomId: string }
  | { type: 'presence'; userId: string; online: boolean }
export const initialRoomState: RoomState = { rooms: [], versions: new Map(), deleted: new Set(), latest: new Map(), clearedVersions: new Map(), clearedMessageIds: new Set(), presenceVersions: new Map(), online: new Map(), snapshot: null }
const version = (values: ReadonlyMap<string, number>, id: string) => values.get(id) ?? 0
const newerTime = (a: string, b: string) => Date.parse(a) > Date.parse(b) ? a : b
function sort(rooms: ActiveRoom[]) { return rooms.sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt) || a.id.localeCompare(b.id)) }
function preview(room: ActiveRoom, message: RoomMessage): ActiveRoom {
  const old = room.lastMessage
  if (old && (Date.parse(old.createdAt) > Date.parse(message.createdAt) ||
      (old.createdAt === message.createdAt && old.id.localeCompare(message.id) >= 0))) return room
  return { ...room, lastMessage: message, updatedAt: newerTime(room.updatedAt, message.createdAt) }
}

/** Pure transitions keep fetch-start watermarks in the same ordered state as events. */
export function roomReducer(state: RoomState, action: RoomAction): RoomState {
  if (action.type === 'start') return { ...state, snapshot: { id: action.id, versions: new Map(state.versions), presenceVersions: new Map(state.presenceVersions) } }
  if (action.type === 'snapshot') {
    const snapshot = state.snapshot
    if (!snapshot || snapshot.id !== action.id) return state
    const current = new Map(state.rooms.map(room => [room.id, room]))
    const returned = new Set(action.rooms.map(room => room.id))
    const rooms = action.rooms.flatMap(server => {
      const changed = version(state.versions, server.id) !== version(snapshot.versions, server.id)
      // A fetch started before deletion cannot recreate the removed conversation.
      if (state.deleted.has(server.id)) return []
      const local = current.get(server.id)
      let next = server
      if (changed && local) {
        const cleared = version(state.clearedVersions, server.id) > version(snapshot.versions, server.id)
        next = cleared && !local.lastMessage ? { ...server, lastMessage: null } : local.lastMessage ? preview(server, local.lastMessage) : server
        next = { ...next, updatedAt: newerTime(next.updatedAt, local.updatedAt) }
      }
      else if (!local && state.latest.has(server.id)) next = preview(server, state.latest.get(server.id)!)
      else if (local) next = { ...server, updatedAt: newerTime(server.updatedAt, local.updatedAt) }
      next = { ...next, participants: next.participants.map(person => version(state.presenceVersions, person.id) !== version(snapshot.presenceVersions, person.id)
        ? { ...person, online: state.online.get(person.id) ?? person.online } : person) }
      return [next]
    })
    // A newly updated known room can be absent from an older list snapshot.
    for (const room of state.rooms) if (!returned.has(room.id) && !state.deleted.has(room.id) && version(state.versions, room.id) !== version(snapshot.versions, room.id)) rooms.push(room)
    return { ...state, rooms: sort(rooms), snapshot: null }
  }
  if (action.type === 'presence') {
    const presenceVersions = new Map(state.presenceVersions).set(action.userId, version(state.presenceVersions, action.userId) + 1)
    const online = new Map(state.online).set(action.userId, action.online)
    return { ...state, presenceVersions, online, rooms: state.rooms.map(room => ({ ...room, participants: room.participants.map(person => person.id === action.userId ? { ...person, online: action.online } : person) })) }
  }
  const roomId = action.type === 'message' ? action.message.roomId : action.roomId
  if (action.type === 'activity') {
    if (state.deleted.has(roomId) || !state.rooms.some(room => room.id === roomId && Date.parse(action.updatedAt) > Date.parse(room.updatedAt))) return state
    return { ...state, versions: new Map(state.versions).set(roomId, version(state.versions, roomId) + 1), rooms: sort(state.rooms.map(room => room.id === roomId ? { ...room, updatedAt: newerTime(room.updatedAt, action.updatedAt) } : room)) }
  }
  if (state.deleted.has(roomId) && action.type !== 'delete') return state
  const versions = new Map(state.versions).set(roomId, version(state.versions, roomId) + 1)
  const latest = new Map(state.latest)
  if (action.type === 'delete') {
    const deleted = new Set(state.deleted).add(roomId); latest.delete(roomId)
    return { ...state, versions, latest, deleted, rooms: state.rooms.filter(room => room.id !== roomId) }
  }
  if (action.type === 'clear') {
    const clearedMessageIds = new Set(state.clearedMessageIds)
    const old = latest.get(roomId); const shown = state.rooms.find(room => room.id === roomId)?.lastMessage
    if (old) clearedMessageIds.add(old.id)
    if (shown) clearedMessageIds.add(shown.id)
    latest.delete(roomId)
    return { ...state, versions, latest, clearedMessageIds, clearedVersions: new Map(state.clearedVersions).set(roomId, version(versions, roomId)), rooms: state.rooms.map(room => room.id === roomId ? { ...room, lastMessage: null, unreadCount: 0 } : room) }
  }
  // A clear and a send can commit in order but arrive in either order. Once
  // cleared, only an authoritative snapshot may restore this room's preview.
  if (state.clearedVersions.has(roomId)) return state
  if (state.clearedMessageIds.has(action.message.id)) return state
  const previous = latest.get(roomId)
  if (!previous || Date.parse(previous.createdAt) < Date.parse(action.message.createdAt) || (previous.createdAt === action.message.createdAt && previous.id.localeCompare(action.message.id) < 0)) latest.set(roomId, action.message)
  return { ...state, versions, latest, rooms: sort(state.rooms.map(room => room.id === roomId ? preview(room, action.message) : room)) }
}
