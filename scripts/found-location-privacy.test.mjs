import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import test from 'node:test'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(path.join(root, 'package.json'))
const ts = require('typescript')
function load(relative) {
  const file = path.join(root, relative)
  const exports = {}
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText, { exports, require(name) {
    const resolved = name.startsWith('@/') ? path.join(root, 'src', name.slice(2)) : path.resolve(path.dirname(file), name)
    if (resolved !== path.join(root, 'src/shared/utils/outwardPostcode')) throw Error('Unexpected location-test import')
    return load('src/shared/utils/outwardPostcode.ts')
  } })
  return exports
}
const exports = load('src/features/found-items/lib/foundItemLocation.ts')
const { decodeFoundItemLocation, foundItemMapPoint, outwardPostcode, formatApproximateDistance } = exports
const json = (value) => JSON.parse(JSON.stringify(value))
const check = (name, operation) => test(name, operation)
const raw = { latitude: 51.5077, longitude: 0.068, address: 'PRIVATE_STREET', neighborhood: 'PRIVATE_AREA', postcode: 'e162rd', approximateDistance: 0.4 }
check('legacy server response cannot be labelled approximate or mapped at an exact pin', () => {
  assert.deepEqual(json(decodeFoundItemLocation(raw)), { latitude: null, longitude: null, address: null, neighborhood: null,
    postcode: 'E16', approximateDistance: null, precision: 'unavailable' })
})
check('approximate response strips exact address/neighborhood/full postcode', () => {
  const value = decodeFoundItemLocation({ ...raw, latitude: 51.51, longitude: 0.07, precision: 'approximate' })
  assert.equal(value.address, null); assert.equal(value.neighborhood, null); assert.equal(value.postcode, 'E16')
  assert.deepEqual(json(foundItemMapPoint(value)), { latitude: 51.51, longitude: 0.07 })
})
check('explicit exact owner response retains permitted structured fields', () => {
  const value = decodeFoundItemLocation({ ...raw, precision: 'exact' })
  assert.equal(value.latitude, raw.latitude); assert.equal(value.postcode, raw.postcode); assert.equal(value.address, raw.address)
})
for (const [name, fields] of Object.entries({ missingLatitude: { latitude: null }, missingLongitude: { longitude: undefined },
  stringLatitude: { latitude: '51.51' }, infiniteLongitude: { longitude: Infinity }, outOfBoundsLatitude: { latitude: 91 }, outOfBoundsLongitude: { longitude: -181 } })) {
  check(name + ' never creates an invented zero/map point', () => {
    const value = decodeFoundItemLocation({ ...raw, ...fields, precision: 'approximate' })
    assert.equal(value.latitude, null); assert.equal(value.longitude, null); assert.equal(value.precision, 'unavailable')
    assert.equal(value.approximateDistance, null)
  })
}
check('explicit unavailable coordinates cannot create a pin', () => {
  const value = decodeFoundItemLocation({ ...raw, precision: 'unavailable' })
  assert.equal(foundItemMapPoint(value), null)
})
check('malformed input is unavailable without throwing', () => {
  for (const input of [null, undefined, false, 'address', 0]) assert.equal(decodeFoundItemLocation(input).precision, 'unavailable')
})
check('invalid approximate distance remains unavailable', () => {
  for (const distance of [-1, NaN, Infinity, null]) assert.equal(decodeFoundItemLocation({ ...raw, precision: 'approximate', approximateDistance: distance }).approximateDistance, null)
})
check('zero is a valid reported approximate distance, not absence', () => {
  assert.equal(decodeFoundItemLocation({ ...raw, precision: 'approximate', approximateDistance: 0 }).approximateDistance, 0)
})
for (const [input, expected] of [['SW1A1AA', 'SW1A'], [' ec1a   1hq ', 'EC1A'], ['E16', 'E16'], ['GIR0AA', 'GIR'], ['PRIVATE_STREET E162RD', '']]) {
  check('automatic sharing postcode ' + JSON.stringify(input) + ' is outward-only', () => assert.equal(outwardPostcode(input), expected))
}
check('distance display does not suggest 50m or metre-level precision', () => {
  assert.equal(formatApproximateDistance(0.05), 'Less than 1 km away (approx.)')
  assert.equal(formatApproximateDistance(3.2), 'About 3 km away')
  assert.equal(formatApproximateDistance(null), 'Distance unavailable')
})
