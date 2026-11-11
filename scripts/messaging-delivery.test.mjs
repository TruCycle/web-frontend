import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import test from 'node:test'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ts = createRequire(path.join(root, 'package.json'))('typescript')
let response, failure, requests = []
function load(relative) {
  const exports = {}
  const source = ts.transpileModule(fs.readFileSync(path.join(root, relative), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  vm.runInNewContext(source, { exports, Date, Error, require(name) {
    if (name === '@/shared/lib/api/client') return { apiRequest: async (...args) => { requests.push(args); if (failure) throw failure; return response } }
    if (name !== '@/shared/lib/api/envelope') throw Error('Unexpected import')
    return load('src/shared/lib/api/envelope.ts')
  } })
  return exports
}
const api = load('src/features/messaging/api/messagingApi.ts')
const id = '00000000-0000-4000-8000-000000000001'
const message = () => ({ id, roomId: 'room-a', text: 'Hello', category: 'direct', direction: 'outgoing', createdAt: '2026-11-03T12:00:00Z', sender: { id: 'sender' } })
test('direct send uses an HTTP confirmation and stable UUID without changing category', async () => {
  requests = []; failure = null; response = { data: message() }
  const saved = await api.sendDirectTextMessage('room-a', { clientMessageId: id, text: 'Hello' })
  assert.equal(saved.id, id); assert.equal(saved.category, 'direct')
  assert.equal(requests[0][0], '/messages/rooms/room-a/messages/text')
  assert.equal(requests[0][1].method, 'POST'); assert.equal(requests[0][1].body.clientMessageId, id)
})
for (const [field, value] of [['id', 'other'], ['roomId', 'other'], ['text', 'Different'], ['category', 'general'], ['direction', 'incoming'], ['createdAt', null], ['createdAt', 'invalid']]) {
  test(`rejects mismatched/malformed confirmation ${field}=${value}`, async () => {
    failure = null; response = { data: { ...message(), [field]: value } }
    await assert.rejects(api.sendDirectTextMessage('room-a', { clientMessageId: id, text: 'Hello' }))
  })
}
test('a rejected or uncertain HTTP send is surfaced once without retrying another transport', async () => {
  requests = []; failure = new Error('Synthetic timeout')
  await assert.rejects(api.sendDirectTextMessage('room-a', { clientMessageId: id, text: 'Hello' }))
  assert.equal(requests.length, 1); failure = null
})
test('history pagination encodes the server cursor and forwards cancellation', async () => {
  requests = []; failure = null; response = { data: { messages: [message()], nextCursor: id } }
  const controller = new AbortController(); const value = await api.fetchRoomMessages('room-a', id, controller.signal)
  assert.equal(requests[0][0], '/messages/rooms/room-a/messages?cursor=' + id)
  assert.equal(requests[0][1].signal, controller.signal); assert.equal(value.nextCursor, id)
})
test('malformed or cross-room history cannot masquerade as an empty or complete conversation', async () => {
  failure = null
  for (const data of [{}, { messages: null, nextCursor: null }, { messages: [{ ...message(), roomId: 'other' }], nextCursor: null },
    { messages: [{ ...message(), createdAt: null }], nextCursor: null }, { messages: [], nextCursor: 42 }, { messages: [] }]) {
    response = { data }; await assert.rejects(api.fetchRoomMessages('room-a'))
  }
})


test('read acknowledgement sends only explicit observed IDs and preserves authoritative remaining count', async () => {
  requests = []; failure = null; response = { data: { readMessageIds: [id], unreadCount: 2 } }
  const ack = await api.acknowledgeRoomMessages('room/a', [id])
  assert.equal(ack.unreadCount, 2)
  assert.equal(requests[0][0], '/messages/rooms/room%2Fa/read')
  assert.equal(requests[0][1].method, 'POST')
  assert.deepEqual(Array.from(requests[0][1].body.messageIds), [id])
})
test('read acknowledgement rejects unrelated IDs and malformed counts instead of clearing badges', async () => {
  failure = null
  for (const data of [{ readMessageIds: ['other'], unreadCount: 0 }, { unreadCount: 0 },
    { readMessageIds: [id], unreadCount: -1 }, { readMessageIds: [id], unreadCount: 1.5 },
    { readMessageIds: [id], unreadCount: '0' }]) {
    response = { data }; await assert.rejects(api.acknowledgeRoomMessages('room-a', [id]))
  }
})
test('failed read acknowledgement is surfaced without manufacturing a successful zero count', async () => {
  requests = []; failure = new Error('Synthetic read failure')
  await assert.rejects(api.acknowledgeRoomMessages('room-a', [id]))
  assert.equal(requests.length, 1); failure = null
})
const reads = load('src/features/messaging/lib/readEligibility.ts')
const incoming = (messageId, extra = {}) => ({ ...message(), id: messageId, direction: 'incoming', sender: { id: 'other' }, ...extra })
test('only observed incoming direct IDs in the active visible room are eligible', () => {
  const rows = [incoming('seen'), incoming('unseen'), incoming('own', { sender: { id: 'viewer' } }),
    incoming('general', { category: 'general' }), incoming('system', { sender: null }), incoming('foreign', { roomId: 'room-b' })]
  assert.deepEqual(Array.from(reads.eligibleReadIds(rows, ['seen', 'seen', 'own', 'general', 'system', 'foreign', 'not-loaded'], 'viewer', 'room-a', 'room-a', true, true)), ['seen'])
})
for (const [active, visible, loaded] of [['room-b', true, true], ['room-a', false, true], ['room-a', true, false]]) {
  test(`no read ack for inactive/hidden/failed history ${active}/${visible}/${loaded}`, () => {
    assert.equal(reads.eligibleReadIds([incoming(id)], [id], 'viewer', 'room-a', active, visible, loaded).length, 0)
  })
}
test('same-time and later unseen messages are not read through by ordering, and requests are bounded', () => {
  const rows = Array.from({ length: 130 }, (_, i) => incoming('id-' + i))
  const result = reads.eligibleReadIds(rows, rows.slice(0, 120).map(x => x.id), 'viewer', 'room-a', 'room-a', true, true)
  assert.equal(result.length, 100); assert.ok(!result.includes('id-129'))
})

test('mounted message alerts refresh from incoming, private read and reconnect events on the real socket wrapper', async () => {
  const effects = [], sockets = [], timers = new Map()
  let count = 0, serverCount = 0, timerId = 0, fetches = 0
  const session = { user: { id: 'viewer' }, tokens: { accessToken: 'synthetic-test-token' } }
  const domEvents = () => ({ addEventListener() {}, removeEventListener() {} })
  const imports = {
    react: {
      useEffect: callback => effects.push(callback), useMemo: callback => callback(),
      useRef: current => ({ current }), useState: () => [0, next => { count = next }],
    },
    'react-router-dom': { useLocation: () => ({ pathname: '/dashboard' }) },
    '@/features/messaging/api/messagingApi': { fetchActiveRooms: async () => { fetches++; return [{ unreadCount: serverCount }] } },
    '@/features/messaging/lib/playIncomingMessageTone': { playIncomingMessageTone() {} },
    '@/features/messaging/lib/unreadEvents': { unreadChangedEvent: 'unread-change' },
    '@/shared/ui/toast/useToast': { useToast: () => ({ info() {} }) },
    '@/shared/lib/auth/session': { getStoredSession: () => session, captureStoredSession: () => session, isSameSessionIdentity: capture => capture === session },
    '@/shared/lib/api/client': { apiRequest: async () => ({}) },
    '@/shared/lib/config/env': { env: { websocketUrl: 'https://synthetic.invalid', apiBaseUrl: '' } },
    'socket.io-client': { io() {
      const listeners = new Map()
      const socket = {
        connected: false,
        on(event, listener) { const set = listeners.get(event) ?? new Set(); set.add(listener); listeners.set(event, set) },
        off(event, listener) { listeners.get(event)?.delete(listener) },
        connect() { this.connected = true }, disconnect() { this.connected = false },
        deliver(event, value) { for (const listener of [...(listeners.get(event) ?? [])]) listener(value) },
      }
      sockets.push(socket); return socket
    } },
  }
  const browserWindow = new EventTarget()
  function module(relative) {
    const exports = {}
    const source = ts.transpileModule(fs.readFileSync(path.join(root, relative), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
    vm.runInNewContext(source, {
      exports, window: browserWindow, document: { ...domEvents(), visibilityState: 'visible' },
      setTimeout(callback) { const key = ++timerId; timers.set(key, callback); return key }, clearTimeout: key => timers.delete(key),
      require(name) { if (!(name in imports)) throw Error('Unexpected hook import: ' + name); return imports[name] },
    })
    return exports
  }
  imports['@/shared/lib/websocket/client'] = module('src/shared/lib/websocket/client.ts')
  module('src/features/messaging/hooks/useMessageAlerts.ts').useMessageAlerts()
  let cleanups = effects.map(effect => effect())
  async function flush() { const pending = [...timers.values()]; timers.clear(); pending.forEach(callback => callback()); await Promise.resolve(); await Promise.resolve() }
  await flush(); assert.equal(count, 0)
  const incomingMessage = { id: 'new', direction: 'incoming', sender: { firstName: 'Synthetic' }, text: 'Test' }
  serverCount = 2; sockets.at(-1).deliver('message:new', incomingMessage); await flush()
  assert.equal(count, 2, 'incoming delivery must refresh the authoritative unread count without reload')
  serverCount = 0; sockets.at(-1).deliver('messages:read'); await flush()
  assert.equal(count, 0, 'another tab read must refresh this tab')
  serverCount = 3; sockets.at(-1).deliver('auth:ready'); await flush()
  assert.equal(count, 3, 'transport authentication/reconnect must reconcile unread count')
  serverCount = 0; sockets.at(-1).deliver('room:cleared', { roomId: 'room-a' }); await flush()
  assert.equal(count, 0, 'clearing a room must refresh dashboard unread state')
  serverCount = 1; sockets.at(-1).deliver('room:deleted', { roomId: 'room-a' }); await flush()
  assert.equal(count, 1, 'deleting a room must preserve other rooms unread state')
  serverCount = 2; browserWindow.dispatchEvent(new Event('online')); await flush()
  assert.equal(count, 2, 'browser online must reconcile unread without a socket handshake')
  // React StrictMode replays effect setup after cleanup using the same hook instance.
  cleanups.forEach(cleanup => cleanup?.()); cleanups = effects.map(effect => effect()); await flush()
  serverCount = 4; sockets.at(-1).deliver('message:new', incomingMessage); await flush(); assert.equal(count, 4)
  cleanups.forEach(cleanup => cleanup?.())
  const completedFetches = fetches
  sockets.at(-1).deliver('message:new', incomingMessage); await flush()
  assert.equal(fetches, completedFetches, 'unmounted alerts must not keep fetching')
})

test('mounted messaging reconciles reordered clear/send history and coalesces delayed echoes against authoritative storage', async () => {
  const effects = [], sockets = [], timers = new Map(), states = []
  const browserWindow = new EventTarget()
  let timerId = 0, reducerState, historyCalls = 0
  const session = { session: { user: { id: 'viewer' } }, user: { id: 'viewer' }, tokens: { accessToken: 'synthetic-test-token' } }
  const record = (id, text = id) => ({ id, roomId: 'room-a', text, category: 'direct', direction: 'incoming', sender: { id: 'peer' }, createdAt: '2026-11-10T12:00:00.000Z' })
  let storedHistory = [], storedRooms = [{ id: 'room-a', participants: [], unreadCount: 2, lastMessage: record('old'), updatedAt: '2026-11-10T12:00:00.000Z' }]
  let fetchHistory = async () => ({ messages: storedHistory, nextCursor: null })
  let confirmSend
  const imports = {
    react: {
      useEffect: callback => effects.push(callback), useMemo: callback => callback(), useCallback: callback => callback,
      useRef: current => ({ current }),
      useState(initial) { const position = states.length; states.push(initial); return [initial, next => { states[position] = typeof next === 'function' ? next(states[position]) : next }] },
      useReducer(reducer, initial) { reducerState = initial; return [initial, action => { reducerState = reducer(reducerState, action) }] },
    },
    '@/features/messaging/api/messagingApi': {
      fetchActiveRooms: async () => storedRooms,
      fetchRoomMessages: async () => { historyCalls++; return fetchHistory() },
      sendDirectTextMessage: () => new Promise(resolve => { confirmSend = resolve }), acknowledgeRoomMessages: async () => { throw Error('Unused read') },
    },
    '@/shared/lib/auth/session': { getStoredSession: () => session, captureStoredSession: () => session, isSameSessionIdentity: capture => capture === session },
    '@/shared/lib/api/client': { apiRequest: async () => ({}) },
    '@/shared/lib/config/env': { env: { websocketUrl: 'https://synthetic.invalid', apiBaseUrl: '' } },
    'socket.io-client': { io() {
      const listeners = new Map()
      const socket = { connected: false, on(event, callback) { const callbacks = listeners.get(event) ?? new Set(); callbacks.add(callback); listeners.set(event, callbacks) }, off(event, callback) { listeners.get(event)?.delete(callback) }, connect() { this.connected = true }, disconnect() { this.connected = false }, deliver(event, value) { for (const callback of [...(listeners.get(event) ?? [])]) callback(value) } }
      sockets.push(socket); return socket
    } },
  }
  function module(relative) {
    const exports = {}
    const source = ts.transpileModule(fs.readFileSync(path.join(root, relative), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
    vm.runInNewContext(source, { exports, AbortController, crypto: { randomUUID: () => id }, window: browserWindow, document: { visibilityState: 'visible', addEventListener() {}, removeEventListener() {} }, setTimeout(callback, delay) { const key = ++timerId; timers.set(key, { callback, delay }); return key }, clearTimeout: key => timers.delete(key), require(name) { if (!(name in imports)) throw Error('Unexpected hook import: ' + name); return imports[name] } })
    return exports
  }
  for (const relative of ['shared/lib/websocket/client', 'features/messaging/lib/roomState', 'features/messaging/lib/unreadEvents', 'features/messaging/lib/historyRecovery', 'features/messaging/lib/readEligibility']) imports['@/' + relative] = module('src/' + relative + '.ts')
  const hook = module('src/features/messaging/hooks/useMessages.ts').useMessages()
  const cleanups = effects.map(effect => effect())
  const settle = async () => { for (let turn = 0; turn < 12; turn++) await Promise.resolve() }
  const flushReconciliation = async () => { const pending = [...timers].filter(([, value]) => value.delay === 100); for (const [key, value] of pending) { timers.delete(key); value.callback() } await settle() }
  await settle(); hook.setActiveRoomId('room-a')
  const socket = sockets[0]
  storedHistory = [record('old')]
  socket.deliver('auth:ready'); await settle()
  assert.equal(states[1]['room-a'][0].id, 'old')
  storedHistory = [record('after-offline-clear')]
  storedRooms = [{ ...storedRooms[0], lastMessage: storedHistory[0], unreadCount: 1 }]
  socket.deliver('auth:ready'); await settle()
  assert.equal(states[1]['room-a'].length, 1)
  assert.equal(states[1]['room-a'][0].id, 'after-offline-clear', 'reconnect must replace history after a missed clear')
  storedHistory = [record('post-clear')]; storedRooms = [{ ...storedRooms[0], lastMessage: storedHistory[0], unreadCount: 1 }]
  socket.deliver('room:cleared', { roomId: 'room-a' })
  assert.equal(states[1]['room-a'].length, 0)
  await flushReconciliation()
  assert.equal(states[1]['room-a'][0].id, 'post-clear', 'a delayed clear must recover the surviving committed message')
  assert.equal(reducerState.rooms[0].lastMessage.id, 'post-clear')
  const beforeBurst = historyCalls
  for (let index = 0; index < 20; index++) socket.deliver('message:new', record('unseen-cleared-' + index))
  assert.equal(states[1]['room-a'].length, 1, 'unseen delayed payloads must not be merged into cleared history')
  await flushReconciliation()
  assert.equal(historyCalls, beforeBurst + 1, 'a burst coalesces into one authoritative request')
  assert.equal(states[1]['room-a'][0].id, 'post-clear')
  fetchHistory = async () => { throw Error('Offline') }
  socket.deliver('room:cleared', { roomId: 'room-a' }); await flushReconciliation()
  assert.equal(states[1]['room-a'].length, 0)
  fetchHistory = async () => ({ messages: storedHistory, nextCursor: null })
  browserWindow.dispatchEvent(new Event('online')); await settle()
  assert.equal(states[1]['room-a'][0].id, 'post-clear', 'browser online must retry failed history without a socket handshake')
  let resolveOld
  fetchHistory = () => new Promise(resolve => { resolveOld = resolve })
  socket.deliver('message:new', record('stale-echo')); await flushReconciliation()
  storedHistory = [record('latest-survivor')]; storedRooms = [{ ...storedRooms[0], lastMessage: storedHistory[0] }]
  fetchHistory = async () => ({ messages: storedHistory, nextCursor: null })
  socket.deliver('room:cleared', { roomId: 'room-a' }); await flushReconciliation()
  resolveOld({ messages: [record('deleted-before-clear')], nextCursor: null }); await settle()
  assert.equal(states[1]['room-a'][0].id, 'latest-survivor', 'an older in-flight history response cannot undo the later clear')
  const pendingSend = hook.sendMessage('Confirmed before clear')
  socket.deliver('room:cleared', { roomId: 'room-a' })
  confirmSend({ ...record('already-cleared', 'Confirmed before clear'), direction: 'outgoing' })
  assert.equal(await pendingSend, true, 'a successful send clears its draft even if clear invalidates its response')
  assert.equal(states[1]['room-a'].length, 0, 'a stale send confirmation cannot resurrect cleared history')
  await flushReconciliation()
  storedRooms = []
  socket.deliver('room:deleted', { roomId: 'room-a' })
  const beforeDeletedEcho = historyCalls
  socket.deliver('message:new', record('deleted-room-echo')); await flushReconciliation()
  assert.equal(historyCalls, beforeDeletedEcho)
  assert.equal(states[1]['room-a'], undefined)
  assert.equal(reducerState.rooms.length, 0)
  cleanups.forEach(cleanup => cleanup?.())
})
