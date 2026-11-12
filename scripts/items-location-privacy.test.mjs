import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import test from 'node:test'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ts = createRequire(path.join(root, 'package.json'))('typescript')
let response, requests = []
function load(relative) {
  const file = path.join(root, relative), exports = {}
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    exports, URLSearchParams, require(name) {
      if (name === '@/shared/lib/api/client') return { apiRequest: async (...args) => { requests.push(args); return response } }
      if (!name.startsWith('@/shared/')) throw Error('Unexpected test import: ' + name)
      return load('src/' + name.slice(2) + '.ts')
    },
  })
  return exports
}
const api = load('src/features/items/api/itemsApi.ts')
const notifications = load('src/features/notifications/api/notificationsApi.ts')
const item = (fields = {}) => ({ id: 'chair', title: 'Chair', distance_km: 0.1,
  location: { precision: 'approximate', postcode: 'E16 2RD', address_line: 'PRIVATE_STREET' }, ...fields })
const itemId = '00000000-0000-4000-8000-000000000001'
test('manual collection sends one authenticated mutation and requires a complete result', async () => {
  requests = []
  response = { data: { status: 'complete' } }
  await api.collectItem(itemId)
  assert.equal(requests.length, 1)
  assert.equal(requests[0][0], '/items/' + itemId + '/collect')
  assert.equal(requests[0][1].method, 'POST')
  assert.equal(Object.keys(requests[0][1].body).length, 0)
})
test('uncertain or incomplete collection responses never report success', async () => {
  for (const data of [null, {}, { status: 'pending_approval' }, { status: 'approved' }, { status: 'success' }]) {
    requests = []
    response = { data }
    await assert.rejects(api.collectItem(itemId), /Collection could not be confirmed/)
    assert.equal(requests.length, 1)
  }
})
test('public item deep link requests only the guest projection and retains outward-only fields', async () => {
  requests = []; response = { data: item({ id: itemId }) }
  const result = await api.fetchPublicItem(itemId)
  assert.equal(requests[0][0], '/items/' + itemId)
  assert.equal(requests[0][1].includeAuth, false); assert.equal(requests[0][1].skipSessionRecovery, true)
  assert.equal(result.id, itemId); assert.doesNotMatch(JSON.stringify(result), /PRIVATE_STREET|2RD/)
})
test('malformed deep-link IDs never reach the API', async () => {
  requests = []
  for (const id of ['../me', 'not-a-uuid', itemId + '?private=1', '']) await assert.rejects(api.fetchPublicItem(id), { statusCode: 404 })
  assert.equal(requests.length, 0)
})
test('UUID deep links accept case variation and request the canonical identifier', async () => {
  const id = 'abcdefab-0000-4000-8000-000000000001'
  response = { data: item({ id }) }; requests = []
  assert.equal((await api.fetchPublicItem(id.toUpperCase())).id, id)
  assert.equal(requests[0][0], '/items/' + id)
})
test('missing, malformed and mismatched item responses fail closed', async () => {
  for (const data of [null, {}, item({ id: 'another-item' })]) {
    response = { data }; await assert.rejects(api.fetchPublicItem(itemId), { statusCode: 404 })
  }
})
test('actual browse API omits missing/blank origin and preserves an explicit origin', async () => {
  response = { data: { search_origin: null, items: [item({ distance_km: null })] } }; requests = []
  const values = await api.fetchBrowseItems()
  assert.equal(new URLSearchParams(requests[0][0].split('?')[1]).has('postcode'), false)
  assert.equal(values[0].distanceKm, null); assert.equal(values[0].locationLabel, 'Area E16')
  await api.fetchBrowseItems({ postcode: '  ' })
  assert.equal(new URLSearchParams(requests[1][0].split('?')[1]).has('postcode'), false)
  await api.fetchBrowseItems({ postcode: ' SW1A 1AA ' })
  assert.equal(new URLSearchParams(requests[2][0].split('?')[1]).get('postcode'), 'SW1A 1AA')
})
test('actual decoder labels approximate distance and strips legacy exact address/full postcode', async () => {
  response = { data: { items: [item(), item({ id: 'legacy', location: { postcode: 'SW1A1AA', address_line: 'PRIVATE_STREET' } }),
    item({ id: 'unavailable', distance_km: null, location: { precision: 'unavailable', postcode: null } })] } }
  const values = await api.fetchBrowseItems()
  assert.equal(values.length, 3)
  assert.equal(values[0].locationLabel, 'Area E16 - Less than 1 km away (approx.)')
  assert.equal(values[1].locationLabel, 'Area SW1A'); assert.equal(values[1].distanceKm, null)
  assert.equal(values[2].locationLabel, 'Location unavailable'); assert.equal(values[2].distanceKm, null)
  assert.doesNotMatch(JSON.stringify(values), /PRIVATE_STREET|2RD|1AA|\uFFFD/)
})
test('collected claim decoder uses outward-only public label without removing claim/reward fields', async () => {
  response = { data: { items: [{ claim_id: 'claim', claim_status: 'pending_approval', reward: 5, item: item() }] } }
  const value = await api.fetchCollectedItems()
  assert.equal(value.items[0].claimStatus, 'pending_approval'); assert.equal(value.items[0].reward, 5)
  assert.equal(value.items[0].item.locationLabel, 'Area E16 - Less than 1 km away (approx.)')
})
test('new nearby notification type and unmarked legacy notification cards survive the actual decoder', async () => {
  response = { data: [{ id: 'new', type: 'item.nearby', title: 'New item available nearby', body: 'Approximate area: E16.', data: { source: 'nearby-item-v1', itemId: 'chair', itemPostcode: 'E16' } },
    { id: 'old', type: 'general', title: 'Older notification', body: 'Unmarked history' }] }
  const values = await notifications.fetchNotifications()
  assert.equal(values.length, 2); assert.equal(values[0].type, 'item.nearby'); assert.equal(values[0].data.itemPostcode, 'E16')
  assert.equal(values[1].body, 'Unmarked history')
})
