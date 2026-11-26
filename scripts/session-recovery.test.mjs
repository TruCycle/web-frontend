import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import test from 'node:test'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(path.join(root, 'package.json'))
const ts = require('typescript')
class MemoryStorage {
  values = new Map()
  fault = () => false
  getItem(key) { if (this.fault('get', key)) throw Error('blocked'); return this.values.get(key) ?? null }
  setItem(key, value) { if (this.fault('set', key)) throw Error('quota'); this.values.set(key, value) }
  removeItem(key) { if (this.fault('remove', key)) throw Error('blocked'); this.values.delete(key) }
}
const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no }); return { promise, resolve, reject } }
const token = (id, seconds = 3600) => 'synthetic.' + Buffer.from(JSON.stringify({ sub: id, exp: Date.now() / 1000 + seconds })).toString('base64url') + '.unsigned'
const account = (id = 'owner-a', seconds = 3600) => ({ user: { id, email: id + '@example.test', firstName: 'Synthetic', lastName: 'Member' }, tokens: { accessToken: token(id, seconds), refreshToken: token(id, 86400) } })

function fixture(stores = { local: new MemoryStorage(), session: new MemoryStorage() }) {
  const cache = new Map()
  let transport = () => { throw Error('Unexpected network request: inject a synthetic transport') }
  const context = vm.createContext({ window: { localStorage: stores.local, sessionStorage: stores.session, atob },
    Error, TypeError, DOMException, AbortController, Date, Promise, URL, setTimeout, clearTimeout,
    fetch: (...args) => transport(...args) })
  function load(file) {
    file = path.resolve(file)
    if (cache.has(file)) return cache.get(file)
    const exports = {}; cache.set(file, exports)
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
    const importModule = (name) => {
      if (name === '@/shared/lib/config/env') return { env: { apiBaseUrl: 'https://synthetic.invalid' } }
      const resolved = name.startsWith('@/') ? path.join(root, 'src', name.slice(2)) : path.resolve(path.dirname(file), name)
      if (!resolved.startsWith(path.join(root, 'src') + path.sep)) throw Error('Unexpected import')
      return load(resolved + '.ts')
    }
    vm.runInContext('(function(exports, require) {' + code + '\n})', context, { filename: file })(exports, importModule)
    return exports
  }
  const session = load(path.join(root, 'src/shared/lib/auth/session.ts'))
  const recovery = load(path.join(root, 'src/shared/lib/auth/recovery.ts'))
  const client = load(path.join(root, 'src/shared/lib/api/client.ts'))
  const network = load(path.join(root, 'src/shared/types/network.ts'))
  const schedule = load(path.join(root, 'src/shared/lib/auth/schedule.ts'))
  const routing = load(path.join(root, 'src/shared/lib/auth/returnPath.ts'))
  const save = (value = account(), persistMode = 'session') => session.storeSession({ ...value, persistMode, keepRefreshToken: true })
  return { stores, session, recovery, client, network, schedule, routing, save, transport: (next) => { transport = next } }
}
const response = (status, data) => ({ ok: status >= 200 && status < 300, status, json: async () => data })

test('one storage envelope keeps session-only tokens together across reload', () => {
  const f = fixture(); f.save()
  assert.equal(f.stores.local.values.size, 0)
  const reloaded = fixture(f.stores)
  assert.equal(reloaded.session.getStoredPersistMode(), 'session')
  assert.equal(reloaded.session.getStoredUser().id, 'owner-a')
  assert.ok(reloaded.session.getStoredRefreshToken())
})
test('legacy fields cannot be mixed across local and session stores', () => {
  const f = fixture(); f.stores.local.setItem('auth_token', token('owner-a'))
  f.stores.session.setItem('auth_user', JSON.stringify(account().user))
  assert.throws(() => f.session.getStoredSession(), { name: 'SessionStorageError' })
})
test('a complete envelope wins over incomplete legacy keys without mixing profiles', () => {
  const f = fixture(); f.save(account('owner-b')); f.stores.local.setItem('auth_token', token('owner-a'))
  assert.equal(f.session.getStoredUser().id, 'owner-b')
})
test('blocked reads fail closed rather than returning another store identity', () => {
  const f = fixture(); f.save(); f.stores.local.fault = () => true
  assert.throws(() => f.session.getStoredSession(), { name: 'SessionStorageError' })
})
test('mismatched token subject cannot be committed as another user', () => {
  const f = fixture(); const next = account(); next.tokens.accessToken = token('owner-b')
  assert.throws(() => f.save(next), { name: 'SessionStorageError' })
  assert.equal(f.session.getStoredSession(), null)
})
test('failed cleanup restores both storage modes instead of losing the prior record', () => {
  const f = fixture(); f.save(account('owner-a'), 'local'); let once = true
  f.stores.session.fault = (op, key) => op === 'remove' && key === 'auth_user' && once && (once = false, true)
  assert.throws(() => f.save(account('owner-b')), { name: 'SessionStorageError' })
  assert.equal(f.session.getStoredUser().id, 'owner-a')
  assert.equal(f.stores.session.getItem(f.session.sessionStorageKey), null)
})
test('logout suppresses credentials on this page even when deletion is blocked', () => {
  const f = fixture(); f.save(); f.stores.session.fault = (op) => op === 'remove'
  f.session.invalidateSessionOperations()
  assert.throws(() => f.session.clearSession(), { name: 'SessionStorageError' })
  assert.equal(f.session.getStoredAccessToken(), null)
})
test('successful logout still allows a later explicit sign-in from another tab', () => {
  const f = fixture(); f.save(); f.session.invalidateSessionOperations(); f.session.clearSession()
  f.stores.local.setItem(f.session.sessionStorageKey, JSON.stringify({ version: 1, ...account('owner-b'), persistMode: 'local' }))
  assert.equal(f.session.getStoredUser().id, 'owner-b')
})
test('concurrent same-session refresh callers share the actual completion', async () => {
  const f = fixture(); f.save(); const held = deferred(); let calls = 0
  const coordinator = f.recovery.createSessionRecovery(() => { calls++; return held.promise })
  const first = coordinator.recover(); const second = coordinator.recover()
  assert.equal(first, second); assert.equal(calls, 1)
  held.resolve(account()); assert.equal((await first).kind, 'refreshed'); assert.equal((await second).kind, 'refreshed')
})
test('transient refresh has one bounded retry sequence and preserves credentials', async () => {
  const f = fixture(); f.save(); let calls = 0; const delays = []
  const coordinator = f.recovery.createSessionRecovery(async () => { calls++; throw new TypeError('synthetic offline') }, async (ms) => { delays.push(ms) })
  assert.equal((await coordinator.recover()).kind, 'unavailable')
  assert.equal(calls, 3); assert.deepEqual(delays, [1000, 3000]); assert.equal(f.session.getStoredUser().id, 'owner-a')
})
test('server refresh 401 invalidates only the current saved session', async () => {
  const f = fixture(); f.save()
  const coordinator = f.recovery.createSessionRecovery(async () => { throw new f.network.ApiError('synthetic invalid', 401) })
  assert.equal((await coordinator.recover()).kind, 'terminal'); assert.equal(f.session.getStoredSession(), null)
})
test('terminal clear failure reports current unavailable generation for a retryable sign-out', async () => {
  const f = fixture(); f.save(); f.stores.session.fault = (op) => op === 'remove'
  const coordinator = f.recovery.createSessionRecovery(async () => { throw new f.network.ApiError('synthetic invalid', 401) })
  const result = await coordinator.recover()
  assert.equal(result.kind, 'unavailable'); assert.equal(result.generation, f.session.getSessionGeneration())
  assert.equal(result.needsSignOut, true); assert.equal(result.capture, null)
  assert.equal(f.session.getStoredAccessToken(), null)
})
test('late successful refresh cannot resurrect logout even if transport ignores abort', async () => {
  const f = fixture(); f.save(); const held = deferred()
  const coordinator = f.recovery.createSessionRecovery(() => held.promise); const pending = coordinator.recover()
  f.session.invalidateSessionOperations(); f.session.clearSession(); held.resolve(account())
  assert.equal((await pending).kind, 'superseded'); assert.equal(f.session.getStoredSession(), null)
})
test('old-account refresh 401 cannot clear a newer login', async () => {
  const f = fixture(); f.save(); const held = deferred()
  const coordinator = f.recovery.createSessionRecovery(() => held.promise); const pending = coordinator.recover()
  f.session.invalidateSessionOperations(); f.save(account('owner-b')); held.reject(new f.network.ApiError('synthetic invalid', 401))
  assert.equal((await pending).kind, 'superseded'); assert.equal(f.session.getStoredUser().id, 'owner-b')
})
test('a mismatched refresh identity is unavailable without replacing credentials', async () => {
  const f = fixture(); f.save(); const coordinator = f.recovery.createSessionRecovery(async () => account('owner-b'))
  assert.equal((await coordinator.recover()).kind, 'unavailable'); assert.equal(f.session.getStoredUser().id, 'owner-a')
})
test('cached refresh expiry within five minutes does not cause an early logout', async () => {
  const f = fixture(); const next = account(); next.tokens.refreshTokenExpiry = new Date(Date.now() + 1000).toISOString(); f.save(next)
  let calls = 0; const coordinator = f.recovery.createSessionRecovery(async () => { calls++; return account() })
  assert.equal((await coordinator.recover()).kind, 'refreshed'); assert.equal(calls, 1)
})
test('expired access token in a refresh response is rejected without overwriting', async () => {
  const f = fixture(); f.save(); const before = f.session.getStoredAccessToken()
  const coordinator = f.recovery.createSessionRecovery(async () => account('owner-a', -10))
  assert.equal((await coordinator.recover()).kind, 'unavailable'); assert.equal(f.session.getStoredAccessToken(), before)
})
test('quota error on refresh preserves the old session and does not report success', async () => {
  const f = fixture(); f.save(); f.stores.session.fault = (op) => op === 'set'
  const coordinator = f.recovery.createSessionRecovery(async () => account())
  assert.equal((await coordinator.recover()).kind, 'unavailable'); assert.equal(f.session.getStoredUser().id, 'owner-a')
})
test('GET 401 recovers once and retries with the new token', async () => {
  const f = fixture(); f.save(); let calls = 0; let recoveries = 0
  f.transport(async () => response(++calls === 1 ? 401 : 200, { ok: true }))
  f.client.registerSessionRecovery(async () => { recoveries++; f.save(); return { kind: 'refreshed', capture: f.session.captureStoredSession() } })
  assert.deepEqual(await f.client.apiRequest('/synthetic'), { ok: true }); assert.equal(calls, 2); assert.equal(recoveries, 1)
})
test('a second GET 401 is not replayed indefinitely', async () => {
  const f = fixture(); f.save(); let calls = 0
  f.transport(async () => { calls++; return response(401, {}) })
  f.client.registerSessionRecovery(async () => ({ kind: 'refreshed', capture: f.session.captureStoredSession() }))
  await assert.rejects(f.client.apiRequest('/synthetic'), { statusCode: 401 }); assert.equal(calls, 2)
})
test('mutating 401 refreshes credentials without replay, and requires deliberate retry', async () => {
  const f = fixture(); f.save(); let calls = 0; let recoveries = 0
  f.transport(async () => { calls++; return response(401, {}) })
  f.client.registerSessionRecovery(async () => { recoveries++; return { kind: 'refreshed', capture: f.session.captureStoredSession() } })
  await assert.rejects(f.client.apiRequest('/synthetic', { method: 'POST', body: { value: 1 } }), { name: 'ActionRetryRequiredError' })
  assert.equal(calls, 1); assert.equal(recoveries, 1)
})
test('expired credentials refresh before an unsent mutation, then send once', async () => {
  const f = fixture(); f.save(account('owner-a', -10)); let calls = 0; const events = []
  f.transport(async () => { calls++; events.push('send'); return response(200, {}) })
  f.client.registerSessionRecovery(async () => { events.push('refresh'); f.save(); return { kind: 'refreshed', capture: f.session.captureStoredSession() } })
  await f.client.apiRequest('/synthetic', { method: 'POST', body: {} }); assert.equal(calls, 1); assert.deepEqual(events, ['refresh', 'send'])
})
test('late response from a previous account is discarded after an account switch', async () => {
  const f = fixture(); f.save(); const held = deferred(); f.transport(() => held.promise)
  const pending = f.client.apiRequest('/synthetic'); f.session.invalidateSessionOperations(); f.save(account('owner-b'))
  held.resolve(response(200, { private: 'old-account' })); await assert.rejects(pending, { name: 'AbortError' })
})
test('request timeout rejects a transport that ignores abort', async () => {
  const f = fixture(); f.transport(() => new Promise(() => {}))
  await assert.rejects(f.client.apiRequest('/synthetic', { includeAuth: false, timeoutMs: 5 }), { name: 'RequestTimeoutError' })
})
test('timeout also bounds response body parsing', async () => {
  const f = fixture(); f.transport(async () => ({ ok: true, status: 200, json: () => new Promise(() => {}) }))
  await assert.rejects(f.client.apiRequest('/synthetic', { includeAuth: false, timeoutMs: 5 }), { name: 'RequestTimeoutError' })
})
test('public authentication transport does not read blocked credential storage', async () => {
  const f = fixture(); f.stores.local.fault = () => true; let auth
  f.transport(async (_url, init) => { auth = init.headers.Authorization; return response(200, {}) })
  await f.client.apiRequest('/synthetic-auth', { includeAuth: false }); assert.equal(auth, undefined)
})
test('already aborted requests do not send or refresh', async () => {
  const f = fixture(); const controller = new AbortController(); controller.abort(); let calls = 0
  f.transport(async () => { calls++; return response(200, {}) })
  await assert.rejects(f.client.apiRequest('/synthetic', { signal: controller.signal }), { name: 'AbortError' }); assert.equal(calls, 0)
})
test('caller abort rejects without replaying a request', async () => {
  const f = fixture(); f.transport(() => new Promise(() => {})); const controller = new AbortController()
  const pending = f.client.apiRequest('/synthetic', { includeAuth: false, signal: controller.signal }); controller.abort()
  await assert.rejects(pending, { name: 'AbortError' })
})
test('expected validation message arrays remain useful to callers', async () => {
  const f = fixture(); f.transport(async () => response(400, { message: ['postcode must be a string', 'latitude must be a latitude string or number'] }))
  await assert.rejects(f.client.apiRequest('/synthetic', { includeAuth: false }), { statusCode: 400, message: 'postcode must be a string; latitude must be a latitude string or number' })
})
test('access-only schedules actual expiry, refreshable sessions schedule an earlier bounded lead', () => {
  const { schedule } = fixture()
  assert.equal(schedule.sessionRefreshAt(30_000, 0, false), 30_000)
  assert.equal(schedule.sessionRefreshAt(30_000, 0, true), 15_000)
  assert.equal(schedule.sessionRefreshAt(3_600_000, 0, true), 3_300_000)
})
test('sub-second and already-expired sessions are not delayed by a one-second floor', () => {
  const { schedule } = fixture()
  assert.equal(schedule.sessionWakeDelay(schedule.sessionRefreshAt(500, 0, false), 0), 500)
  assert.equal(schedule.sessionWakeDelay(schedule.sessionRefreshAt(500, 0, true), 0), 250)
  assert.equal(schedule.sessionWakeDelay(-100, 0), 0)
})
test('large expiry delays are clamped and intermediate wakes do not imply expiration', () => {
  const { schedule } = fixture(); const at = 90 * 86400_000; const maximum = 2 ** 31 - 1
  assert.equal(schedule.sessionWakeDelay(at, 0), maximum)
  assert.ok(at > maximum)
  assert.equal(schedule.sessionWakeDelay(at, maximum), maximum)
})
test('internal intended deep links preserve their query and fragment', () => {
  const { routing } = fixture()
  assert.equal(routing.authReturnPath({ from: { pathname: '/messages', search: '?room=synthetic', hash: '#latest' } }), '/messages?room=synthetic#latest')
  assert.equal(routing.authReturnPath({ from: { pathname: '/profile' } }), '/profile')
})
test('untrusted return targets cannot escape the app or loop through authentication', () => {
  const { routing } = fixture()
  for (const pathname of ['https://evil.invalid', '//evil.invalid', '/\\evil.invalid', '/%2f%2fevil.invalid', '/%5cevil.invalid', '/%6cogin', '/%252f%252fevil.invalid', '/login', '/signup', '/auth/verify-email', '/reset-password', '/bad\npath', '/bad?path']) {
    assert.equal(routing.authReturnPath({ from: { pathname } }), '/dashboard')
  }
  for (const state of [null, undefined, {}, { from: 'https://evil.invalid' }, { from: { pathname: '/messages', search: 'https://evil.invalid' } }]) {
    assert.equal(routing.authReturnPath(state), '/dashboard')
  }
})
