import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeSpaRoutes } from './spa-routes.mjs'

const repoRoot = fileURLToPath(new URL('../', import.meta.url))
export const isolationAttestation = 'isolated-staging-only'

export function enforceStagingMetadata(html) {
  if (!/<head\b[^>]*>/i.test(html)) throw Error('Staging HTML is missing its head')
  return html.replace(/<meta\b(?=[^>]*\bname=["']robots["'])[^>]*>/gi, '')
    .replace(/<head\b[^>]*>/i, value => value + '\n<meta name="robots" content="noindex, nofollow, noarchive" /><meta name="trucycle-environment" content="staging" />')
}

const productionHosts = new Set([
  'trucycle.co.uk',
  'www.trucycle.co.uk',
  'api.trucycle.co.uk',
  'imgrc.trucycle01.workers.dev',
])

function stagingOrigin(value, key, protocols) {
  let parsed
  try {
    parsed = new URL(value?.trim())
  } catch {
    throw new Error(`${key} must be an explicit absolute staging origin.`)
  }
  if (
    !protocols.includes(parsed.protocol) ||
    parsed.username || parsed.password || parsed.search || parsed.hash ||
    parsed.pathname !== '/'
  ) {
    throw new Error(`${key} must be a secure origin without credentials, a path, query or fragment.`)
  }
  const hostname = parsed.hostname.toLowerCase()
  if (
    productionHosts.has(hostname) ||
    /(^|[.-])(prod|production|live)([.-]|$)/.test(hostname) ||
    !/(^|[.-])staging([.-]|$)/.test(hostname)
  ) {
    throw new Error(`${key} must use a staging-labelled hostname and cannot target a known production service.`)
  }
  return parsed.origin
}

export function createStagingBuildPlan(environment, root = repoRoot) {
  if (environment.STAGING_RESOURCE_ISOLATION_CONFIRMED !== isolationAttestation) {
    throw new Error('Set STAGING_RESOURCE_ISOLATION_CONFIRMED=isolated-staging-only only after verifying separate staging data and services.')
  }
  const apiOrigin = stagingOrigin(environment.STAGING_API_ORIGIN, 'STAGING_API_ORIGIN', ['https:'])
  const websocketOrigin = stagingOrigin(environment.STAGING_WS_ORIGIN, 'STAGING_WS_ORIGIN', ['https:', 'wss:'])

  // Remove inherited browser variables, including unknown future VITE_* keys.
  // Case-insensitive filtering also protects builds launched on Windows.
  const childEnvironment = Object.fromEntries(
    Object.entries(environment).filter(([key]) => !/^VITE_/i.test(key)),
  )
  Object.assign(childEnvironment, {
    NODE_ENV: 'production',
    VITE_API_BASE_URL: apiOrigin,
    VITE_WS_URL: websocketOrigin,
    VITE_DEFAULT_SEARCH_POSTCODE: '',
    VITE_CLOUDINARY_CLOUD_NAME: '',
    VITE_CLOUDINARY_UPLOAD_PRESET: '',
    VITE_CLOUDINARY_FOLDER: '',
    VITE_GA_MEASUREMENT_ID: '',
    VITE_META_PIXEL_ID: '',
    VITE_POSTHOG_PROJECT_TOKEN: '',
    VITE_POSTHOG_HOST: '',
    VITE_GOOGLE_CLIENT_ID: '',
    VITE_ENABLE_SMART_SPOT: 'false',
    VITE_VISION_WORKER_URL: '',
    VITE_INTERNAL_PIN: '',
  })

  return {
    root,
    outputDirectory: path.join(root, 'dist-staging'),
    environment: childEnvironment,
    commands: [
      [path.join(root, 'node_modules/typescript/bin/tsc'), '-b'],
      [path.join(root, 'node_modules/vite/bin/vite.js'), 'build', '--config', 'workers/staging-web/vite.config.mjs', '--configLoader', 'runner', '--mode', 'staging'],
    ],
  }
}

export function runStagingBuild(environment = process.env) {
  // Validate before running TypeScript/Vite or writing build output.
  const plan = createStagingBuildPlan(environment)
  writeSpaRoutes(plan.root)
  for (const command of plan.commands) {
    const result = spawnSync(process.execPath, command, {
      cwd: plan.root,
      env: plan.environment,
      stdio: 'inherit',
      shell: false,
    })
    if (result.error) throw result.error
    if (result.status !== 0) throw new Error(`Staging build failed with exit code ${result.status ?? 'unknown'}.`)
  }
  const indexPath = path.join(plan.outputDirectory, 'index.html')
  writeFileSync(indexPath, enforceStagingMetadata(readFileSync(indexPath, 'utf8')))
  writeFileSync(path.join(plan.outputDirectory, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n')
  writeFileSync(path.join(plan.outputDirectory, 'robots.txt'), 'User-agent: *\nDisallow: /\n')
  console.log('Staging assets built in dist-staging. Nothing has been uploaded or deployed.')
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    runStagingBuild()
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Staging build failed.')
    process.exitCode = 1
  }
}
