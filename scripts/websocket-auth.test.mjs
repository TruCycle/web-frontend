import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import test from 'node:test'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ts = createRequire(path.join(root, 'package.json'))('typescript')
const { Emitter } = createRequire(path.join(root, 'package.json'))('@socket.io/component-emitter')
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done }); return { promise, resolve } }
const record = (id = 'owner-a', token = 'synthetic-access-a') => ({ user: { id }, tokens: { accessToken: token } })
function fixture() {
  let session = record(), storageBlocked = false, request = async () => ({})
  const sockets = [], requests = [], tasks = new Map()
  let timerId = 0
  class FakeSocket extends Emitter {
    connected = false; sent = []; connects = 0; credentials = []; onConnect = () => {}
    constructor(url, options) { super(); this.url = url; this.options = options }
    fire(name, ...args) { super.emit(name, ...args) }
    connect() { this.connects++; this.options.auth(value => this.credentials.push(value)); this.connected = true; this.onConnect(); return this }
    disconnect() { this.connected = false; this.fire('disconnect', 'io client disconnect'); return this }
    serverDrop() { this.connected = false; this.fire('disconnect', 'io server disconnect') }
    emit(...args) { this.sent.push(args) }
  }
  const exports = {}
  const source = fs.readFileSync(path.join(root, 'src/shared/lib/websocket/client.ts'), 'utf8')
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    exports, URL, setTimeout: (callback, delay) => { const id = ++timerId; tasks.set(id, { callback, delay }); return id }, clearTimeout: id => tasks.delete(id),
    require(name) {
      if (name === 'socket.io-client') return { io: (url, options) => { const socket = new FakeSocket(url, options); sockets.push(socket); return socket } }
      if (name === '@/shared/lib/auth/session') return { getStoredSession: () => { if (storageBlocked) throw Error('Synthetic blocked storage'); return session } }
      if (name === '@/shared/lib/config/env') return { env: { websocketUrl: '', apiBaseUrl: 'https://synthetic.invalid/api' } }
      if (name === '@/shared/lib/api/client') return { apiRequest: async (...args) => { requests.push(args); return request(...args) } }
      throw Error('Unexpected import: ' + name)
    },
  })
  const client = new exports.WebSocketClient({ namespace: '/messages', maxReconnectAttempts: 3, reconnectDelayMs: 10 })
  const flush = async () => { for (let index = 0; index < 15; index++) await Promise.resolve() }
  const tick = async () => { const next = tasks.entries().next().value; if (next) { tasks.delete(next[0]); next[1].callback() }; await flush() }
  return { client, sockets, requests, tasks, tick, flush, session: value => { session = value }, block: () => { storageBlocked = true }, request: value => { request = value } }
}

test('auth callback reads rotated same-account access token and never puts it in the URL', () => {
  const f = fixture(); f.client.connect(); const socket = f.sockets[0]
  assert.equal(socket.url, 'https://synthetic.invalid/messages')
  assert.equal(socket.options.autoConnect, false)
  f.session(record('owner-a', 'synthetic-access-new')); socket.connect()
  assert.equal(socket.credentials.at(-1).token, 'synthetic-access-new')
})
test('absent or blocked storage does not create an unauthenticated connection', () => {
  for (const mode of ['absent', 'blocked']) {
    const f = fixture(); if (mode === 'absent') f.session(null); else f.block()
    assert.doesNotThrow(() => f.client.connect()); assert.equal(f.sockets.length, 0)
  }
})
test('server expiry checks current session through GET then reconnects with renewed credentials', async () => {
  const f = fixture(); f.client.connect(); const socket = f.sockets[0]
  f.request(async () => { f.session(record('owner-a', 'synthetic-renewed')); return {} })
  socket.serverDrop(); await f.tick()
  assert.deepEqual(f.requests, [['/auth/me']]); assert.equal(socket.connects, 2)
  assert.equal(socket.credentials.at(-1).token, 'synthetic-renewed')
  assert.deepEqual(socket.sent, [])
})
test('late reconnect validation cannot cross an account switch', async () => {
  const f = fixture(), pending = deferred(); f.request(() => pending.promise)
  f.client.connect(); const socket = f.sockets[0]; socket.serverDrop(); await f.tick()
  f.session(record('owner-b', 'synthetic-other')); pending.resolve({}); await f.flush()
  assert.equal(socket.connects, 1); assert.equal(f.client.isConnected, false)
  socket.connect(); assert.equal(socket.credentials.at(-1).token, '')
})
test('logout or explicit teardown retires pending reconnect work', async () => {
  const f = fixture(), pending = deferred(); f.request(() => pending.promise)
  f.client.connect(); const socket = f.sockets[0]; socket.serverDrop(); await f.tick()
  f.client.disconnect(); pending.resolve({}); await f.flush()
  assert.equal(socket.connects, 1); assert.equal(f.tasks.size, 0)
})
test('unavailable session validation has a bounded retry budget', async () => {
  const f = fixture(); f.request(async () => { throw Error('Synthetic unavailable') })
  f.client.connect(); const socket = f.sockets[0]; socket.serverDrop()
  for (let index = 0; index < 8; index++) await f.tick()
  assert.equal(f.requests.length, 3); assert.equal(socket.connects, 1); assert.equal(f.tasks.size, 0)
})
test('repeated server rejection without auth-ready cannot reset the retry budget', async () => {
  const f = fixture(); f.client.connect(); const socket = f.sockets[0]
  socket.onConnect = () => socket.serverDrop(); socket.serverDrop()
  for (let index = 0; index < 8; index++) await f.tick()
  assert.equal(f.requests.length, 3); assert.equal(socket.connects, 4); assert.equal(f.tasks.size, 0)
})
test('confirmed auth-ready permits a later independent expiry recovery', async () => {
  const f = fixture(); f.client.connect(); const socket = f.sockets[0]
  socket.onConnect = () => socket.fire('auth:ready')
  for (let index = 0; index < 5; index++) { socket.serverDrop(); await f.tick() }
  assert.equal(socket.connects, 6); assert.equal(f.requests.length, 5)
})
test('same-user listeners work but old-account payloads are suppressed immediately', () => {
  const f = fixture(), seen = []; f.client.connect(); const socket = f.sockets[0]
  f.client.on('message:new', value => seen.push(value)); socket.fire('message:new', 'same owner')
  f.session(record('owner-b')); socket.fire('message:new', 'private old owner')
  assert.deepEqual(seen, ['same owner']); assert.equal(f.client.isConnected, false)
})
test('wrapped off and once preserve listener semantics without removing lifecycle handlers', () => {
  const f = fixture(), seen = []; f.client.connect(); const socket = f.sockets[0]
  const removed = value => seen.push(value)
  f.client.on('message:new', removed); f.client.off('message:new', removed); socket.fire('message:new', 'removed')
  f.client.once('message:new', value => seen.push(value)); socket.fire('message:new', 'once'); socket.fire('message:new', 'twice')
  assert.deepEqual(seen, ['once']); assert.equal(socket.listeners('disconnect').length, 1)
})
test('disconnected mutations are not buffered for automatic replay', () => {
  const f = fixture(); f.client.connect(); const socket = f.sockets[0]; socket.serverDrop()
  assert.equal(f.client.emit('message:send', { text: 'synthetic private action' }), false)
  assert.deepEqual(socket.sent, [])
})
test('transport connection alone cannot send before the server confirms authentication', () => {
  const f = fixture(); f.client.connect(); const socket = f.sockets[0]
  assert.equal(f.client.isConnected, false)
  assert.equal(f.client.emit('message:send', { text: 'not yet authorized' }), false)
  assert.deepEqual(socket.sent, [])
  socket.fire('auth:ready')
  assert.equal(f.client.isConnected, true)
  assert.equal(f.client.emit('message:send', { text: 'authorized action' }), true)
  assert.equal(socket.sent.length, 1)
})
test('a later storage denial cannot leak a stale token or crash a reconnect', () => {
  const f = fixture(); f.client.connect(); const socket = f.sockets[0]; f.block()
  assert.doesNotThrow(() => socket.connect()); assert.equal(socket.credentials.at(-1).token, '')
  assert.equal(f.client.isConnected, false)
})
test('late lifecycle and once events from a retired socket cannot change the new connection', () => {
  const f = fixture(), seen = []; const listener = value => seen.push(value)
  f.client.connect(); const old = f.sockets[0]; f.client.once('message:new', listener)
  f.client.disconnect(); f.session(record('owner-b')); f.client.connect()
  const current = f.sockets[1]; current.fire('auth:ready'); f.client.once('message:new', listener)
  old.fire('disconnect', 'io server disconnect'); old.fire('message:new', 'private old owner')
  assert.equal(f.client.isConnected, true); assert.equal(f.tasks.size, 0)
  f.client.off('message:new', listener); current.fire('message:new', 'removed new listener')
  assert.deepEqual(seen, [])
})
