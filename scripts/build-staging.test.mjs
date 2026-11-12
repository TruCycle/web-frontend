import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { createStagingBuildPlan, enforceStagingMetadata, isolationAttestation } from './build-staging.mjs'

function validEnvironment(overrides = {}) {
  return {
    STAGING_RESOURCE_ISOLATION_CONFIRMED: isolationAttestation,
    STAGING_API_ORIGIN: 'https://api-staging.example.test',
    STAGING_WS_ORIGIN: 'wss://api-staging.example.test',
    ...overrides,
  }
}

test('requires a deliberate resource-isolation attestation', () => {
  for (const value of [undefined, '', 'true', 'false']) {
    assert.throws(() => createStagingBuildPlan(validEnvironment({ STAGING_RESOURCE_ISOLATION_CONFIRMED: value })), /separate staging data/)
  }
})

for (const key of ['STAGING_API_ORIGIN', 'STAGING_WS_ORIGIN']) {
  test(`${key} is mandatory even with inherited production Vite variables`, () => {
    for (const value of [undefined, '', '/api']) {
      assert.throws(() => createStagingBuildPlan(validEnvironment({
        [key]: value,
        VITE_API_BASE_URL: 'https://api.trucycle.co.uk',
        VITE_WS_URL: 'https://api.trucycle.co.uk',
      })), /explicit absolute staging origin/)
    }
  })

  test(`${key} rejects insecure and malformed origins`, () => {
    for (const value of [
      'http://api-staging.example.test',
      'ws://api-staging.example.test',
      'https://user:password@api-staging.example.test',
      'https://api-staging.example.test/api',
      'https://api-staging.example.test?target=production',
      'https://api-staging.example.test#fragment',
    ]) {
      assert.throws(() => createStagingBuildPlan(validEnvironment({ [key]: value })), /secure origin/)
    }
  })

  test(`${key} rejects production and unlabelled hosts`, () => {
    for (const value of [
      'https://trucycle.co.uk',
      'https://www.trucycle.co.uk',
      'https://api.trucycle.co.uk',
      'https://imgrc.trucycle01.workers.dev',
      'https://api-staging.production.example.test',
      'https://unreviewed.example.test',
      'https://stagingevil.example.test',
    ]) {
      assert.throws(() => createStagingBuildPlan(validEnvironment({ [key]: value })), /staging-labelled hostname/)
    }
  })
}

test('API uses HTTPS; Socket.IO supports explicit HTTPS or WSS origins', () => {
  assert.throws(() => createStagingBuildPlan(validEnvironment({ STAGING_API_ORIGIN: 'wss://api-staging.example.test' })), /secure origin/)
  for (const protocol of ['https', 'wss']) {
    const origin = `${protocol}://api-staging.example.test`
    const plan = createStagingBuildPlan(validEnvironment({ STAGING_WS_ORIGIN: origin }))
    assert.equal(plan.environment.VITE_WS_URL, origin)
  }
})

test('replaces inherited production browser values and strips unknown VITE keys', () => {
  const inherited = validEnvironment({
    PATH: 'preserved-for-local-tools',
    VITE_API_BASE_URL: 'https://api.trucycle.co.uk',
    VITE_WS_URL: 'https://api.trucycle.co.uk',
    VITE_POSTHOG_PROJECT_TOKEN: 'production-analytics',
    VITE_CLOUDINARY_UPLOAD_PRESET: 'production-media',
    VITE_VISION_WORKER_URL: 'https://imgrc.trucycle01.workers.dev',
    VITE_MESSAGE_ATTACHMENTS_ENABLED: 'true',
    VITE_UNKNOWN_SECRET: 'must-not-enter-the-browser',
    vite_lowercase_secret: 'must-not-enter-the-browser',
    NODE_ENV: 'development',
  })
  const plan = createStagingBuildPlan(inherited)
  assert.equal(plan.environment.VITE_API_BASE_URL, 'https://api-staging.example.test')
  assert.equal(plan.environment.VITE_WS_URL, 'wss://api-staging.example.test')
  assert.equal(plan.environment.NODE_ENV, 'production')
  assert.equal(plan.environment.PATH, inherited.PATH)
  assert.equal('VITE_UNKNOWN_SECRET' in plan.environment, false)
  assert.equal('vite_lowercase_secret' in plan.environment, false)
  for (const key of ['VITE_CLOUDINARY_CLOUD_NAME', 'VITE_CLOUDINARY_UPLOAD_PRESET', 'VITE_CLOUDINARY_FOLDER', 'VITE_GA_MEASUREMENT_ID', 'VITE_META_PIXEL_ID', 'VITE_POSTHOG_PROJECT_TOKEN', 'VITE_POSTHOG_HOST', 'VITE_GOOGLE_CLIENT_ID', 'VITE_VISION_WORKER_URL']) {
    assert.equal(plan.environment[key], '')
  }
  assert.equal(plan.environment.VITE_ENABLE_SMART_SPOT, 'false')
  assert.equal(plan.environment.VITE_MESSAGE_ATTACHMENTS_ENABLED, 'false')
  assert.equal(createStagingBuildPlan(validEnvironment({ STAGING_MESSAGE_ATTACHMENTS_ENABLED: 'true' })).environment.VITE_MESSAGE_ATTACHMENTS_ENABLED, 'true')
  assert.equal(inherited.VITE_POSTHOG_PROJECT_TOKEN, 'production-analytics', 'does not mutate the parent environment')
})

test('staging build has a separate output and no deploy command', () => {
  const plan = createStagingBuildPlan(validEnvironment())
  assert.match(plan.outputDirectory, /[\\/]dist-staging$/)
  assert.equal(plan.commands.length, 2)
  assert.equal(plan.commands.flat().includes('deploy'), false)
  assert.equal(plan.commands[1].includes('staging'), true)
})

test('Vite resolves the real staging config with env-file loading disabled and sanitized browser values', () => {
  const plan = createStagingBuildPlan({
    ...process.env,
    ...validEnvironment(),
    VITE_UNKNOWN_SECRET: 'production-sentinel-must-not-leak',
    VITE_POSTHOG_PROJECT_TOKEN: 'production-sentinel-must-not-leak',
  })
  const source = `
    const { resolveConfig } = await import('vite');
    const config = await resolveConfig({ configFile: 'workers/staging-web/vite.config.mjs', configLoader: 'runner', mode: 'staging' }, 'build');
    console.log(JSON.stringify({ envDir: config.envDir, env: config.env, outDir: config.build.outDir }));
  `
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', source], {
    cwd: plan.root,
    env: plan.environment,
    encoding: 'utf8',
    shell: false,
  })
  assert.equal(result.status, 0, result.stderr)
  const resolved = JSON.parse(result.stdout.trim())
  assert.equal(resolved.envDir, false)
  assert.equal(resolved.outDir, 'dist-staging')
  assert.equal(resolved.env.VITE_API_BASE_URL, 'https://api-staging.example.test')
  assert.equal(resolved.env.VITE_ENABLE_SMART_SPOT, 'false')
  assert.equal(resolved.env.VITE_VISION_WORKER_URL, '')
  assert.equal(resolved.env.VITE_POSTHOG_PROJECT_TOKEN, '')
  assert.equal('VITE_UNKNOWN_SECRET' in resolved.env, false)
  assert.equal(JSON.stringify(resolved).includes('production-sentinel-must-not-leak'), false)
})

test('Cloudflare scaffold has no public endpoint or production route', () => {
  const config = JSON.parse(readFileSync(new URL('../workers/staging-web/wrangler.json', import.meta.url), 'utf8'))
  assert.equal(config.name, 'trucycle-web-staging')
  assert.equal(config.workers_dev, false)
  assert.equal(config.preview_urls, false)
  assert.deepEqual(config.routes, [])
  assert.equal(config.assets.directory, '../../dist-staging')
  assert.equal(config.assets.not_found_handling, 'none')
  assert.equal(config.assets.html_handling, 'none')
  assert.equal(config.assets.binding, 'ASSETS')
  assert.equal(config.assets.run_worker_first, true)
  assert.equal(config.main, 'index.js', 'frontend routing only; never proxies the API')
})

test('staging HTML is noindex before React executes and keeps non-robots metadata', () => {
  const html = enforceStagingMetadata('<html><head><meta name="robots" content="index,follow"><title>TruCycle</title></head><body>Public shell</body></html>')
  assert.match(html, /noindex, nofollow, noarchive/)
  assert.equal((html.match(/name="robots"/g) || []).length, 1)
  assert.match(html, /<title>TruCycle<\/title>/)
  assert.match(html, /Public shell/)
})
