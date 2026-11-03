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
