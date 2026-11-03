import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import ts from 'typescript'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const key = 'tc-tracking-consent'
const syntheticEnv = {
  VITE_POSTHOG_PROJECT_TOKEN: 'synthetic-project',
  VITE_POSTHOG_HOST: 'http://localhost/synthetic-posthog',
}

function fixture() {
  const storage = { values: new Map(), readError: false, writeError: false, cookieError: false }
  const localStorage = {
    getItem(name) { if (storage.readError) throw Error('blocked'); return storage.values.get(name) ?? null },
    setItem(name, value) { if (storage.writeError) throw Error('blocked'); storage.values.set(name, value) },
    removeItem(name) { if (storage.writeError) throw Error('blocked'); storage.values.delete(name) },
  }
  const window = Object.assign(new EventTarget(), {
    localStorage,
    sessionStorage: localStorage,
    location: { hostname: 'localhost', origin: 'http://localhost', pathname: '/signup' },
  })
  const cookies = new Map([['auth_session', 'preserve'], ['_ga', 'optional'], ['_fbp', 'optional']])
  const scripts = []
  const document = {
    get cookie() {
      if (storage.cookieError) throw Error('blocked')
      return [...cookies].map(([name, value]) => `${name}=${value}`).join('; ')
    },
    set cookie(value) {
      if (storage.cookieError) throw Error('blocked')
      cookies.delete(value.split('=')[0])
    },
    createElement() {
      const script = { dataset: {}, remove() { const index = scripts.indexOf(script); if (index >= 0) scripts.splice(index, 1) } }
      return script
    },
    head: { appendChild(script) { scripts.push(script) } },
    querySelector(selector) { return document.querySelectorAll(selector)[0] ?? null },
    querySelectorAll(selector) {
      return scripts.filter((script) => selector.includes(`"${script.dataset.analytics}"`))
    },
  }
  const calls = { imports: 0, inits: 0, optins: 0, optouts: 0, stopped: 0, events: [] }
  let options
  const sdk = {
    init(_token, value) { calls.inits += 1; options = value },
    opt_in_capturing() { calls.optins += 1 },
    opt_out_capturing() { calls.optouts += 1 },
    stopSessionRecording() { calls.stopped += 1 },
    capture(name, properties) { calls.events.push({ name, properties }) },
  }
  const cache = new Map()
  function load(name, from = path.join(root, 'src/shared/lib/analytics')) {
    if (name === 'posthog-js') { calls.imports += 1; return { __esModule: true, default: sdk } }
    if (name === '@/shared/lib/config/env') return { env: { googleAnalyticsMeasurementId: 'G-SYNTHETIC', metaPixelId: 'synthetic-pixel' } }
    let filename = name.startsWith('@/') ? path.join(root, 'src', name.slice(2)) : path.resolve(from, name)
    if (!filename.endsWith('.ts')) filename += '.ts'
    assert.ok(filename.startsWith(path.join(root, 'src')), 'Test loader cannot load external SDK code')
    if (cache.has(filename)) return cache.get(filename).exports
    const module = { exports: {} }
    cache.set(filename, module)
    const source = fs.readFileSync(filename, 'utf8').replaceAll('import.meta.env', '__testEnv')
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    })
    vm.runInNewContext(outputText, {
      module, exports: module.exports, require: (request) => load(request, path.dirname(filename)),
      window, document, Event, Date, console, __testEnv: syntheticEnv,
      fetch() { throw Error('External requests are prohibited in consent unit tests') },
    }, { filename })
    return module.exports
  }
  const consent = load('./trackingConsent')
  const posthog = load('./posthogAnalytics')
  const google = load('./googleAnalytics')
  const meta = load('./metaPixel')
  const sync = () => {
    posthog.syncPostHogConsent()
    google.syncGoogleAnalyticsConsent()
    meta.syncMetaPixelConsent()
  }
  function storageEvent(value) {
    if (value === null) storage.values.delete(key)
    else storage.values.set(key, value)
    const event = new Event('storage')
    Object.assign(event, { key, newValue: value })
    window.dispatchEvent(event)
  }
  return { storage, window, scripts, cookies, calls, consent, posthog, google, meta, sync, storageEvent, options: () => options }
}

const flushImports = () => new Promise((resolve) => setImmediate(resolve))

test('unknown and rejected choices never import/init optional SDKs or inject scripts', async () => {
  const f = fixture()
  for (const status of ['unknown', 'rejected']) {
    if (status === 'rejected') f.consent.setTrackingConsentStatus(status)
    f.sync()
    f.google.initGoogleAnalytics(); f.meta.initMetaPixel()
    f.google.trackPageView('/'); f.google.trackGoogleAnalyticsEvent('test')
    f.meta.trackMetaPageView(); f.meta.trackMetaEvent('test')
    f.posthog.trackPostHogPageview('/')
  }
  await flushImports()
  assert.equal(f.scripts.length, 0)
  assert.equal(f.calls.imports, 0)
  assert.equal(f.calls.events.length, 0)
  assert.equal(f.cookies.get('auth_session'), 'preserve')
})

test('late PostHog module completion after rejection cannot initialise', async () => {
  const f = fixture()
  f.consent.setTrackingConsentStatus('accepted')
  f.posthog.trackPostHogPageview('/signup')
  f.consent.setTrackingConsentStatus('rejected')
  f.sync()
  await flushImports()
  assert.equal(f.calls.inits, 0)
  assert.equal(f.calls.events.length, 0)
})

test('PostHog initialises once, deduplicates StrictMode pageviews and supports reaccept', async () => {
  const f = fixture()
  f.consent.setTrackingConsentStatus('accepted')
  f.posthog.trackPostHogPageview('/signup?token=private#secret')
  f.posthog.trackPostHogPageview('/signup?token=private#secret')
  await flushImports()
  assert.equal(f.calls.inits, 1)
  assert.equal(f.calls.events.length, 1)
  assert.equal(f.calls.events[0].properties.page_path, '/signup')
  assert.equal(f.options().advanced_disable_flags, true)
  assert.equal(f.options().disable_session_recording, true)
  assert.equal(f.options().opt_out_persistence_by_default, true)
  assert.equal(f.options().capture_pageview, false)
  f.consent.setTrackingConsentStatus('rejected'); f.sync()
  f.posthog.trackPostHogPageview('/blocked')
  assert.equal(f.calls.optouts, 1)
  assert.equal(f.calls.stopped, 1)
  assert.equal(f.calls.events.length, 1)
  f.consent.setTrackingConsentStatus('accepted')
  f.posthog.trackPostHogPageview('/dashboard')
  assert.equal(f.calls.inits, 1)
  assert.equal(f.calls.optins, 2)
  assert.equal(f.calls.events.length, 2)
})

test('PostHog send-time guard strips nested URL properties and rejects after withdrawal', async () => {
  const f = fixture()
  f.consent.setTrackingConsentStatus('accepted'); f.posthog.trackPostHogPageview('/')
  await flushImports()
  const event = { event: '$pageview', properties: { page_path: '/', $current_url: 'private', $set: { $initial_current_url: 'private', safe: true } }, $set_once: { $session_entry_url: 'private' } }
  const clean = f.options().before_send(event)
  assert.equal(JSON.stringify(clean).includes('private'), false)
  assert.equal(clean.properties.$set.safe, true)
  f.consent.setTrackingConsentStatus('rejected')
  assert.equal(f.options().before_send(event), null)
})

test('withdrawal discards allowed GA/Meta queues before a delayed loader can drain them', () => {
  const f = fixture()
  f.consent.setTrackingConsentStatus('accepted')
  f.google.initGoogleAnalytics(); f.google.trackPageView('/auth/verify-email?token=private')
  f.meta.initMetaPixel(); f.meta.trackMetaPageView()
  assert.equal(f.scripts.length, 2)
  assert.ok(f.window.dataLayer.length > 1)
  f.consent.setTrackingConsentStatus('rejected'); f.sync()
  assert.equal(f.window['ga-disable-G-SYNTHETIC'], true)
  assert.equal(f.scripts.length, 0)
  const drainedGoogle = f.window.dataLayer.map((command) => Array.from(command))
  const drainedMeta = f.window.fbq.queue.map((command) => Array.from(command))
  assert.equal(drainedGoogle.length, 1)
  assert.equal(drainedGoogle[0][0], 'consent')
  assert.equal(drainedGoogle[0][2].analytics_storage, 'denied')
  assert.equal(JSON.stringify(drainedMeta), JSON.stringify([['consent', 'revoke']]))
  f.google.trackGoogleAnalyticsEvent('blocked'); f.meta.trackMetaEvent('blocked')
  assert.equal(f.window.dataLayer.length, 1)
  assert.equal(f.window.fbq.queue.length, 1)
  assert.equal(f.cookies.get('auth_session'), 'preserve')
})

test('GA explicit pageview fields contain pathname only', () => {
  const f = fixture()
  f.consent.setTrackingConsentStatus('accepted'); f.google.initGoogleAnalytics()
  f.google.trackPageView('/auth/verify-email?token=private#secret')
  const commands = f.window.dataLayer.map((command) => Array.from(command))
  assert.equal(JSON.stringify(commands).includes('private'), false)
  assert.equal(commands.at(-1)[2].page_path, '/auth/verify-email')
})

test('failed storage writes cannot lose acceptance or retain a stale accepted withdrawal', () => {
  const f = fixture()
  f.storage.writeError = true
  f.consent.setTrackingConsentStatus('accepted')
  assert.equal(f.consent.getTrackingConsentStatus(), 'accepted')
  f.storage.values.set(key, JSON.stringify({ status: 'accepted', updatedAt: Date.now() }))
  f.consent.setTrackingConsentStatus('rejected')
  assert.equal(f.consent.getTrackingConsentStatus(), 'rejected')
  f.storage.readError = true
  assert.equal(f.consent.getTrackingConsentStatus(), 'rejected')
})

test('cross-tab withdrawal and storage clearing notify synchronously; unsubscribe cleans up', async () => {
  const f = fixture()
  f.consent.setTrackingConsentStatus('accepted'); f.posthog.trackPostHogPageview('/')
  await flushImports()
  let notifications = 0
  const unsubscribe = f.consent.subscribeTrackingConsent(() => { notifications += 1; f.sync() })
  f.storageEvent(JSON.stringify({ status: 'rejected', updatedAt: Date.now() }))
  assert.equal(f.consent.getTrackingConsentStatus(), 'rejected')
  assert.equal(f.calls.optouts, 1)
  assert.equal(notifications, 1)
  f.storageEvent(null)
  assert.equal(f.consent.getTrackingConsentStatus(), 'unknown')
  assert.equal(notifications, 2)
  unsubscribe(); f.storageEvent(null)
  assert.equal(notifications, 2)
})

test('blocked cookie access does not interrupt the other SDK revocations', () => {
  const f = fixture()
  f.storage.cookieError = true
  assert.doesNotThrow(f.sync)
  assert.equal(f.window['ga-disable-G-SYNTHETIC'], true)
})

test('invalid records fail closed and expired rejection snapshots do not mutate storage', () => {
  const f = fixture()
  for (const raw of ['broken', '{"status":"accepted","updatedAt":null}', '{"status":"other","updatedAt":1}']) {
    f.storage.values.set(key, raw)
    assert.equal(f.consent.getTrackingConsentStatus(), 'unknown')
  }
  const now = Date.now()
  const raw = JSON.stringify({ status: 'rejected', updatedAt: now - 21 * 24 * 60 * 60 * 1000 })
  f.storage.values.set(key, raw)
  assert.equal(f.consent.getTrackingConsentStatus(now), 'unknown')
  assert.equal(f.storage.values.get(key), raw)
})
