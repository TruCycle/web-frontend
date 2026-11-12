import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { createStagingBuildPlan, isolationAttestation } from './build-staging.mjs'
import worker from '../workers/staging-web/index.js'

test('the staging Worker serves a 404 for the internal Vision route', async () => {
  const request = new Request('https://web-staging.example.test/internal/vision', {
    headers: { Accept: 'text/html' },
  })
  const response = await worker.fetch(request, {
    ASSETS: { fetch: async assetRequest => new URL(assetRequest.url).pathname === '/index.html'
      ? new Response('<html><div id="root"></div></html>')
      : new Response('Asset not found', { status: 404 }) },
  })
  assert.equal(response.status, 404)
})

test('a real Vite staging build omits the internal Vision UI and production Worker URL', () => {
  const plan = createStagingBuildPlan({
    ...process.env,
    STAGING_RESOURCE_ISOLATION_CONFIRMED: isolationAttestation,
    STAGING_API_ORIGIN: 'https://api-staging.example.test',
    STAGING_WS_ORIGIN: 'wss://api-staging.example.test',
  })
  const source = `
    import assert from 'node:assert/strict';
    import { build } from 'vite';

    const bundle = await build({
      configFile: 'workers/staging-web/vite.config.mjs',
      configLoader: 'runner',
      mode: 'staging',
      logLevel: 'error',
      build: { write: false },
    });
    const chunks = [bundle].flat().flatMap(result => result.output).filter(entry => entry.type === 'chunk');
    assert.ok(chunks.some(chunk => chunk.isEntry));
    for (const chunk of chunks) {
      assert.doesNotMatch(chunk.fileName, /InternalVisionPage/);
      assert.doesNotMatch(chunk.code, /imgrc[.]trucycle01[.]workers[.]dev|tc_internal_vision_unlocked/);
    }
  `
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', source], {
    cwd: plan.root,
    env: plan.environment,
    encoding: 'utf8',
    shell: false,
    timeout: 120_000,
  })
  assert.ifError(result.error)
  assert.equal(result.status, 0, result.stderr)
})
