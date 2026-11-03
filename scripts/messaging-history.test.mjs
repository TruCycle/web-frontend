import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'
import { createRequire } from 'node:module'
const ts = createRequire(import.meta.url)('typescript'), exports = {}
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../src/features/messaging/lib/historyRecovery.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, Error })
const { recoverHistory } = exports
const page = (ids, nextCursor) => ({ messages: ids.map(id => ({ id })), nextCursor })
test('initial loading takes one page and exposes the older cursor', async () => {
  let calls = 0; const result = await recoverHistory(async () => { calls++; return page(['recent'], 'older') }, new Set())
  assert.equal(calls, 1); assert.equal(result.nextCursor, 'older'); assert.equal(result.status, 'complete')
})
test('catch-up crosses multiple pages until a retained known anchor is reached', async () => {
  const calls = []; const pages = [page(['new3', 'new2'], 'c1'), page(['new1', 'known'], 'c2')]
  const result = await recoverHistory(async cursor => { calls.push(cursor); return pages.shift() }, new Set(['known']))
  assert.deepEqual(calls, [undefined, 'c1']); assert.equal(result.messages.length, 4); assert.equal(result.status, 'complete')
})
test('bounded partial recovery returns a continuation rather than claiming completion', async () => {
  let count = 0; const fetch = async () => { count++; return page(['new' + count], 'cursor' + count) }
  const result = await recoverHistory(fetch, new Set(['known']), undefined, 2)
  assert.equal(count, 2); assert.equal(result.status, 'partial'); assert.equal(result.nextCursor, 'cursor2')
  const resumed = await recoverHistory(async cursor => { assert.equal(cursor, 'cursor2'); return page(['known'], null) }, new Set(['known']), result.nextCursor)
  assert.equal(resumed.status, 'complete')
})
test('missing retained anchor reports changed history instead of silently filling a false gap', async () => {
  assert.equal((await recoverHistory(async () => page(['new'], null), new Set(['deleted-old']))).status, 'changed')
})
test('duplicate rows across pages are merged by stable message identifier', async () => {
  const pages = [page(['new'], 'next'), page(['new', 'known'], null)]
  assert.equal((await recoverHistory(async () => pages.shift(), new Set(['known']))).messages.length, 2)
})
test('repeated cursor is rejected for catch-up and manual older-page loading', async () => {
  for (const known of [new Set(), new Set(['known'])]) await assert.rejects(recoverHistory(async () => page(['new'], 'same'), known, 'same'), /did not advance/)
})
test('multi-page cursor cycles fail rather than triggering another automatic request', async () => {
  const pages = [page(['a'], 'b'), page(['b'], 'a')]; let calls = 0
  await assert.rejects(recoverHistory(async () => { calls++; return pages.shift() }, new Set(['known']), 'a'), /did not advance/); assert.equal(calls, 2)
})
test('network cancellation or failure propagates without a second transport', async () => {
  let calls = 0; await assert.rejects(recoverHistory(async () => { calls++; throw Error('Synthetic abort') }, new Set(['known']))); assert.equal(calls, 1)
})
test('invalid recovery budgets cannot create an unbounded or empty loop', async () => {
  for (const budget of [0, -1, 21, Infinity, 1.5]) await assert.rejects(recoverHistory(async () => page([], null), new Set(), undefined, budget), /budget/)
})
test('previously confirmed empty history scans to the end rather than stopping after its first page', async () => {
  const pages = [page(['new2'], 'next'), page(['new1'], null)]; let calls = 0
  const result = await recoverHistory(async () => { calls++; return pages.shift() }, new Set(), undefined, 5, true)
  assert.equal(calls, 2); assert.equal(result.messages.length, 2); assert.equal(result.status, 'complete')
})
test('a new live event is not the retained history anchor for closing an older gap', async () => {
  const pages = [page(['new-live', 'missed-new'], 'next'), page(['missed-old', 'confirmed-old'], null)]; let calls = 0
  const result = await recoverHistory(async () => { calls++; return pages.shift() }, new Set(['confirmed-old']))
  assert.equal(calls, 2); assert.equal(result.status, 'complete'); assert.equal(result.messages.length, 4)
})
