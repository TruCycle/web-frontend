/**
 * Post-build prerender for SEO.
 *
 * Serves the built `dist/` as a SPA, loads each route in headless Chromium,
 * waits for the app to render, then writes the fully-rendered HTML back to
 * `dist/<route>/index.html`. The client bundle still boots and takes over on
 * load (`createRoot` clears #root first, so there is no hydration step and no
 * mismatch risk) — crawlers and the first paint just get real HTML now.
 *
 * Run:  npm run build:prerender
 * (plain `npm run build` is unchanged.)
 */
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { join, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer'

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(rootDir, 'dist')
const PORT = 4178

// Routes to prerender. Keep this to genuinely public, static-enough pages.
const ROUTES = ['/', '/browse', '/privacy', '/terms', '/cookies']

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
}

async function fileExists(path) {
  try {
    const s = await stat(path)
    return s.isFile()
  } catch {
    return false
  }
}

function startStaticServer() {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0])
      let filePath = join(distDir, urlPath)

      if (!(await fileExists(filePath))) {
        // SPA fallback
        filePath = join(distDir, 'index.html')
      }

      try {
        const body = await readFile(filePath)
        res.writeHead(200, { 'Content-Type': MIME[extname(filePath)] || 'application/octet-stream' })
        res.end(body)
      } catch {
        res.writeHead(404)
        res.end('Not found')
      }
    })
    server.listen(PORT, () => resolve(server))
  })
}

async function prerender() {
  const server = await startStaticServer()
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })

  try {
    for (const route of ROUTES) {
      const page = await browser.newPage()
      // Block third-party scripts (analytics, GIS) so prerender stays deterministic.
      await page.setRequestInterception(true)
      page.on('request', (request) => {
        const url = request.url()
        const isThirdParty =
          !url.startsWith(`http://localhost:${PORT}`) && !url.startsWith('data:')
        if (isThirdParty && ['script', 'xhr', 'fetch'].includes(request.resourceType())) {
          request.abort()
          return
        }
        request.continue()
      })

      const target = `http://localhost:${PORT}${route}`
      await page.goto(target, { waitUntil: 'networkidle0', timeout: 30000 })
      // Give React a beat to flush route content.
      await page.waitForSelector('#root > *', { timeout: 15000 })
      await new Promise((r) => setTimeout(r, 400))

      let html = await page.content()
      // Neutralise any injected analytics noscript/iframe captured mid-flight.
      html = html.replace(/<script[^>]*accounts\.google\.com[^>]*><\/script>/g, '')

      const outPath =
        route === '/'
          ? join(distDir, 'index.html')
          : join(distDir, route.replace(/^\//, ''), 'index.html')
      await mkdir(dirname(outPath), { recursive: true })
      await writeFile(outPath, html, 'utf8')
      console.log(`prerendered ${route} -> ${outPath.replace(rootDir + '\\', '').replace(rootDir + '/', '')}`)
      await page.close()
    }
  } finally {
    await browser.close()
    server.close()
  }
}

prerender().catch((error) => {
  console.error('Prerender failed:', error)
  process.exit(1)
})
