import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'
import { createRequire } from 'node:module'
const ts = createRequire(import.meta.url)('typescript')
const exports = {}
const source = ts.transpileModule(fs.readFileSync(new URL('../src/features/messaging/lib/roomState.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
vm.runInNewContext(source, { exports })
const { roomReducer: reduce, initialRoomState: initial } = exports
const time = '2026-11-03T12:00:00Z'
const message = (text = 'New', id = 'message-b') => ({ id, roomId: 'room-a', text, createdAt: time })
const room = (lastMessage = null, id = 'room-a') => ({ id, lastMessage, updatedAt: time, createdAt: time, participants: [{ id: 'peer', online: false }], unreadCount: 0 })
function seed() { return reduce(reduce(initial, { type: 'start', id: 1 }), { type: 'snapshot', id: 1, rooms: [room(), room(null, 'room-b')] }) }
test('slow snapshot preserves a newer live preview and deterministic ordering', () => {
  let state = reduce(seed(), { type: 'start', id: 2 })
  state = reduce(state, { type: 'message', message: message() })
  state = reduce(state, { type: 'snapshot', id: 2, rooms: [room(), room(null, 'room-b')] })
  assert.equal(state.rooms[0].lastMessage.text, 'New')
})
for (const action of ['clear', 'delete']) test(`snapshot started before ${action} cannot undo it, including after room activity`, () => {
  let state = reduce(seed(), { type: 'start', id: 2 })
  state = reduce(state, { type: action, roomId: 'room-a' })
  state = reduce(state, { type: 'activity', roomId: 'room-a', updatedAt: '2026-11-03T12:00:01Z' })
  state = reduce(state, { type: 'snapshot', id: 2, rooms: [room(message('Old'))] })
  if (action === 'delete') assert.equal(state.rooms.some(value => value.id === 'room-a'), false)
  else assert.equal(state.rooms.find(value => value.id === 'room-a').lastMessage, null)
})
test('out-of-order request completion cannot undo the latest completed room list', () => {
  let state = reduce(seed(), { type: 'start', id: 2 })
  state = reduce(state, { type: 'start', id: 3 })
  state = reduce(state, { type: 'snapshot', id: 3, rooms: [room(message('Latest'))] })
  const next = reduce(state, { type: 'snapshot', id: 2, rooms: [room(message('Stale'))] })
  assert.equal(next, state); assert.equal(next.rooms[0].lastMessage.text, 'Latest')
})
test('a genuinely fresh authoritative snapshot can clear an older preview', () => {
  let state = reduce(seed(), { type: 'message', message: message() })
  state = reduce(state, { type: 'start', id: 2 })
  state = reduce(state, { type: 'snapshot', id: 2, rooms: [room()] })
  assert.equal(state.rooms[0].lastMessage, null)
})
test('live presence wins over an in-flight snapshot but the next fresh snapshot is authoritative', () => {
  let state = reduce(seed(), { type: 'start', id: 2 })
  state = reduce(state, { type: 'presence', userId: 'peer', online: true })
  state = reduce(state, { type: 'snapshot', id: 2, rooms: [room()] })
  assert.equal(state.rooms[0].participants[0].online, true)
  state = reduce(state, { type: 'start', id: 3 }); state = reduce(state, { type: 'snapshot', id: 3, rooms: [room()] })
  assert.equal(state.rooms[0].participants[0].online, false)
})
test('a changed known room missing from an older snapshot is retained', () => {
  let state = reduce(seed(), { type: 'start', id: 2 })
  state = reduce(state, { type: 'message', message: message() })
  state = reduce(state, { type: 'snapshot', id: 2, rooms: [] })
  assert.equal(state.rooms.length, 1); assert.equal(state.rooms[0].id, 'room-a')
})
test('a deleted room ignores delayed message events and cannot regain a preview', () => {
  const state = reduce(seed(), { type: 'delete', roomId: 'room-a' })
  assert.equal(reduce(state, { type: 'message', message: message() }), state)
})
test('a live unknown-room message does not invent participants and enriches its later snapshot', () => {
  let state = reduce(initial, { type: 'start', id: 1 })
  state = reduce(state, { type: 'message', message: message() }); assert.equal(state.rooms.length, 0)
  state = reduce(state, { type: 'snapshot', id: 1, rooms: [room()] }); assert.equal(state.rooms[0].lastMessage.text, 'New')
})
test('older room activity cannot move the timestamp backwards', () => {
  const state = reduce(seed(), { type: 'activity', roomId: 'room-a', updatedAt: '2020-01-01T00:00:00Z' })
  assert.equal(state.rooms.find(value => value.id === 'room-a').updatedAt, time)
})
test('a newer server message can improve an older live preview from the same fetch window', () => {
  let state = reduce(seed(), { type: 'start', id: 2 })
  state = reduce(state, { type: 'message', message: message('Live') })
  const newer = { ...message('Server newer'), createdAt: '2026-11-03T12:00:01Z' }
  state = reduce(state, { type: 'snapshot', id: 2, rooms: [room(newer)] })
  assert.equal(state.rooms[0].lastMessage.text, 'Server newer')
})
test('newer activity retains a known room missing from an in-flight list', () => {
  let state = reduce(seed(), { type: 'start', id: 2 })
  state = reduce(state, { type: 'activity', roomId: 'room-a', updatedAt: '2026-11-03T12:00:01Z' })
  state = reduce(state, { type: 'snapshot', id: 2, rooms: [] }); assert.equal(state.rooms.length, 1)
})
test('clear suppresses known and unseen delayed events until a fresh authoritative snapshot', () => {
  let state = reduce(seed(), { type: 'message', message: message('Old', 'old-id') })
  state = reduce(state, { type: 'clear', roomId: 'room-a' })
  assert.equal(reduce(state, { type: 'message', message: message('Old', 'old-id') }), state)
  assert.equal(reduce(state, { type: 'message', message: message('Unseen old', 'unseen-id') }), state)
  state = reduce(state, { type: 'start', id: 2 })
  state = reduce(state, { type: 'snapshot', id: 2, rooms: [room(message('Surviving new', 'new-id'))] })
  assert.equal(state.rooms[0].lastMessage.text, 'Surviving new')
  assert.equal(reduce(state, { type: 'message', message: message('Delayed old', 'delayed-id') }), state)
})

test('a delayed clear invalidates its preview and unread count but a fresh snapshot restores a surviving send', () => {
  let state = reduce(seed(), { type: 'start', id: 2 })
  state = reduce(state, { type: 'snapshot', id: 2, rooms: [{ ...room(message('Post-clear send')), unreadCount: 3 }] })
  state = reduce(state, { type: 'clear', roomId: 'room-a' })
  assert.equal(state.rooms[0].unreadCount, 0)
  assert.equal(state.rooms[0].lastMessage, null)
  state = reduce(state, { type: 'start', id: 3 })
  state = reduce(state, { type: 'snapshot', id: 3, rooms: [{ ...room(message('Post-clear send')), unreadCount: 1 }] })
  assert.equal(state.rooms[0].lastMessage.text, 'Post-clear send')
  assert.equal(state.rooms[0].unreadCount, 1)
})
test('unknown-room metadata loaded after its live event still receives the pending preview', () => {
  let state = reduce(initial, { type: 'message', message: message() })
  state = reduce(state, { type: 'start', id: 1 }); state = reduce(state, { type: 'snapshot', id: 1, rooms: [room()] })
  assert.equal(state.rooms[0].lastMessage.text, 'New')
})
