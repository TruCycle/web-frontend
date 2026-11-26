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
      if (!name.startsWith('@/shared/')) throw Error('Unexpected import: ' + name)
      return load('src/' + name.slice(2) + '.ts')
    },
  })
  return exports
}
const api = load('src/features/partner-shops/api/shopsApi.ts')
const { normalizeFullUkPostcode } = load('src/shared/utils/fullUkPostcode.ts')
const shop = fields => ({ id: 'shop-a', name: 'Reuse Hub', address_line: '1 High & Main Street', postcode: 'sw1a1aa', latitude: 51.51, longitude: -0.13, ...fields })

test('same full-postcode formatting covers canonical and compact input without interpreting an area as a venue', () => {
  assert.equal(normalizeFullUkPostcode(' sw1a1aa '), 'SW1A 1AA')
  assert.equal(normalizeFullUkPostcode('gir0aa'), 'GIR 0AA')
  for (const value of ['SW1A', '', '1 High St SW1A1AA', 'SW1A1AA London', null]) assert.equal(normalizeFullUkPostcode(value), null)
})
test('nearby request keeps the explicit origin and metre radius with no invented fallback', async () => {
  response = { data: [] }; requests = []
  await api.fetchNearbyShops({ postcode: 'SW1A 1AA' })
  const query = new URLSearchParams(requests[0][0].split('?')[1])
  assert.equal(query.get('postcode'), 'SW1A 1AA'); assert.equal(query.get('radius_m'), '5000')
})
test('decoder keeps invalid/missing-coordinate shops in list without a zero pin or fake distance', async () => {
  response = { data: [shop({ latitude: null, longitude: null, distanceMeters: null }), shop({ id: 'out-of-range', latitude: 91, longitude: 0, distanceMeters: -1 })] }
  const values = await api.fetchNearbyShops({ postcode: 'SW1A' })
  assert.equal(values.length, 2)
  for (const value of values) { assert.equal(value.latitude, null); assert.equal(value.longitude, null); assert.equal(value.distance, 'Distance unavailable') }
})
test('decoder removes duplicate IDs but preserves same-named distinct branches', async () => {
  response = { data: [shop({}), shop({}), shop({ id: 'shop-b', address_line: '2 High Street' })] }
  const values = await api.fetchNearbyShops({ postcode: 'SW1A' })
  assert.equal(values.length, 2); assert.equal(values[0].name, values[1].name); assert.notEqual(values[0].address, values[1].address)
})
test('directions use encoded published destination, no origin or tracking parameters', async () => {
  response = { data: [shop({})] }; const [value] = await api.fetchNearbyShops({ postcode: 'SW1A' })
  const url = new URL(value.directionsUrl)
  assert.equal(url.origin + url.pathname, 'https://www.google.com/maps/dir/')
  assert.equal(url.searchParams.get('api'), '1'); assert.equal(url.searchParams.get('destination'), '1 High & Main Street, SW1A 1AA')
  assert.equal(url.searchParams.has('origin'), false); assert.equal([...url.searchParams.keys()].length, 2)
})
test('unknown venue facts are explicit and never fabricate recycling facilities or hours', async () => {
  response = { data: [shop({ name: ' ', postcode: 'invalid', address_line: ' ', latitude: null, longitude: null, opening_hours: { days: ['Mon'], open_time: '99:00', close_time: '17:00' } })] }
  const [value] = await api.fetchNearbyShops({ postcode: 'SW1A' })
  assert.equal(value.name, 'Partner shop'); assert.equal(value.postcode, 'Postcode unavailable'); assert.equal(value.address, 'Address unavailable')
  assert.equal(value.openingHours, 'Opening hours unavailable'); assert.equal(value.amenities.length, 0); assert.equal(value.directionsUrl, null)
})
