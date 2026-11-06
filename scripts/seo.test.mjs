import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import paths from '../workers/staging-web/routes.generated.js'
import worker from '../workers/staging-web/index.js'
import { canonicalHostRedirect, isSpaPath } from '../workers/staging-web/route-policy.js'
import { extractSpaRoutes } from './spa-routes.mjs'
import { startStaticServer } from './prerender.mjs'
import os from 'node:os'
import path from 'node:path'

const origin = 'https://web-staging.example.test'
function fixture({ fail = false, redirect = false } = {}) {
  const requests = []
  return { requests, ASSETS: { async fetch(request) {
    requests.push(request)
    if (fail) throw Error('PRIVATE_RUNTIME_DIAGNOSTIC')
    const pathname = new URL(request.url).pathname
    if (pathname === '/index.html') return new Response('<html><div id="root">Shell</div></html>', { headers: { 'Content-Type': 'text/html' } })
    if (pathname === '/assets/app.js') return redirect ? Response.redirect('https://production.example.test', 302) : new Response('console.log("synthetic")', { headers: { 'Content-Type': 'text/javascript' } })
    return new Response('Asset not found', { status: 404, headers: { 'Content-Type': 'text/plain' } })
  } } }
}
test('Worker route inventory covers every current React Router path, including auth/private aliases', () => {
  const source = fs.readFileSync(new URL('../src/app/routes/AppRoutes.tsx', import.meta.url), 'utf8')
  assert.deepEqual(paths, extractSpaRoutes(source))
  for (const path of ['/auth/verify-email', '/profile', '/partner-shops', '/support/collector']) assert.equal(isSpaPath(path, paths), true)
  for (const path of ['/missing', '/missing.js', '/support/a/b', '/%2fprofile']) assert.equal(isSpaPath(path, paths), false)
})
test('known SPA routes return shell200 with permanent staging headers and no token forwarded into the asset fetch', async () => {
  const env = fixture()
  const response = await worker.fetch(new Request(origin + '/auth/verify-email?token=SYNTHETIC_PRIVATE_TOKEN'), env)
  assert.equal(response.status, 200); assert.match(response.headers.get('X-Robots-Tag'), /noindex/)
  assert.equal(response.headers.get('Cache-Control'), 'no-store')
  assert.equal(new URL(env.requests[0].url).search, '')
  assert.equal(env.requests[0].redirect, 'manual')
})
test('unknown navigation returns a genuine404 with a usable app shell', async () => {
  const response = await worker.fetch(new Request(origin + '/not-a-route', { headers: { Accept: 'text/html' } }), fixture())
  assert.equal(response.status, 404); assert.match(await response.text(), /id="root"/)
  assert.match(response.headers.get('X-Robots-Tag'), /noindex/)
})
test('missing asset never receives the SPA HTML fallback, even with an HTML accept header', async () => {
  const response = await worker.fetch(new Request(origin + '/missing.js', { headers: { Accept: 'text/html' } }), fixture())
  assert.equal(response.status, 404); assert.equal(response.headers.get('Content-Type'), 'text/plain')
  assert.doesNotMatch(await response.text(), /id="root"/)
})
test('assets also carry noindex and no-store', async () => {
  const response = await worker.fetch(new Request(origin + '/assets/app.js'), fixture())
  assert.equal(response.status, 200); assert.match(response.headers.get('X-Robots-Tag'), /noindex/)
  assert.equal(response.headers.get('Cache-Control'), 'no-store')
})
test('HEAD keeps the correct route status without a response body', async () => {
  const response = await worker.fetch(new Request(origin + '/profile', { method: 'HEAD' }), fixture())
  assert.equal(response.status, 200); assert.equal(await response.text(), '')
})
test('frontend Worker never forwards API mutations', async () => {
  const env = fixture(); const response = await worker.fetch(new Request(origin + '/auth/logout', { method: 'POST', body: 'SYNTHETIC_TOKEN' }), env)
  assert.equal(response.status, 405); assert.equal(env.requests.length, 0)
  assert.match(response.headers.get('X-Robots-Tag'), /noindex/)
})
test('asset outage and unexpected redirect fail closed without diagnostics/location leakage', async () => {
  for (const options of [{ fail: true }, { redirect: true }]) {
    const response = await worker.fetch(new Request(origin + '/assets/app.js'), fixture(options))
    assert.equal(response.status, 503); assert.match(response.headers.get('X-Robots-Tag'), /noindex/)
    assert.equal(response.headers.has('Location'), false); assert.doesNotMatch(await response.text(), /PRIVATE_RUNTIME/)
  }
})
test('index.html alias redirect stays on staging and preserves the browser query', async () => {
  const response = await worker.fetch(new Request(origin + '/index.html?intent=donor'), fixture())
  assert.equal(response.status, 308); assert.equal(response.headers.get('Location'), origin + '/?intent=donor')
})
test('canonical host policy does nothing without an explicitly verified alias inventory', () => {
  const request = new Request('https://www.trucycle.co.uk/login?intent=collector')
  assert.equal(canonicalHostRedirect(request), null)
  const config = { verified: true, canonicalOrigin: 'https://trucycle.co.uk', aliases: ['www.trucycle.co.uk', 'trucycle.co.uk'] }
  const response = canonicalHostRedirect(request, config)
  assert.equal(response.status, 308); assert.equal(response.headers.get('Location'), 'https://trucycle.co.uk/login?intent=collector')
  assert.equal(canonicalHostRedirect(new Request(origin + '/login'), config), null)
  assert.throws(() => canonicalHostRedirect(request, { ...config, canonicalOrigin: 'http://trucycle.co.uk' }), /HTTPS/)
})
test('the same-origin manifest can be fetched with the Cloudflare Access session', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8')
  const manifestLink = html.match(/<link\b[^>]*\brel="manifest"[^>]*>/i)?.[0] ?? ''
  assert.match(manifestLink, /\bhref="\/manifest\.json"/)
  assert.match(manifestLink, /\bcrossorigin="use-credentials"/)
})
test('declared icon formats/dimensions match real application assets, separate from social image', () => {
  const publicRoot = new URL('../public/', import.meta.url)
  const dimensions = file => { const bytes = fs.readFileSync(new URL(file, publicRoot)); assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a'); return `${bytes.readUInt32BE(16)}x${bytes.readUInt32BE(20)}` }
  const manifest = JSON.parse(fs.readFileSync(new URL('manifest.json', publicRoot), 'utf8'))
  for (const icon of manifest.icons) { assert.equal(dimensions(icon.src.slice(1)), icon.sizes); assert.notEqual(icon.src, '/og-image.png') }
  assert.equal(dimensions('apple-touch-icon.png'), '180x180')
  assert.equal(dimensions('favicon-32.png'), '32x32')
  const ico = fs.readFileSync(new URL('favicon.ico', publicRoot)); assert.equal(ico.readUInt16LE(2), 1); assert.equal(ico[6], 32); assert.equal(ico[7], 32)
})
test('prerender server binds loopback and refuses unknown files, traversal and mutation', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'trucycle-prerender-'))
  fs.writeFileSync(path.join(directory, 'index.html'), '<html><h1>Static shell</h1></html>')
  const server = await startStaticServer({ directory })
  const address = server.address(), base = `http://127.0.0.1:${address.port}`
  try {
    assert.equal(address.address, '127.0.0.1')
    assert.equal((await fetch(base + '/privacy')).status, 200)
    assert.equal((await fetch(base + '/missing.js')).status, 404)
    assert.equal((await fetch(base + '/unknown')).status, 404)
    assert.equal((await fetch(base + '/..%2f..%2fprivate.txt')).status, 404)
    assert.equal((await fetch(base, { method: 'POST', body: 'SYNTHETIC' })).status, 405)
  } finally {
    await new Promise(done => server.close(done))
    // Exact known files only; no recursive removal or computed directory deletion.
    fs.unlinkSync(path.join(directory, 'index.html')); fs.rmdirSync(directory)
  }
})
