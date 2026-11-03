/** Optional public/static prerender. Never snapshots live catalogue/account data. */
import { createServer } from 'node:http'
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises'
import { resolve, join, extname, dirname, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer'

const rootDir = fileURLToPath(new URL('../', import.meta.url))
const distDir = join(rootDir, 'dist')
export const prerenderRoutes = ['/', '/privacy', '/terms', '/cookies']
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.json': 'application/json', '.woff': 'font/woff', '.woff2': 'font/woff2', '.otf': 'font/otf' }
async function exists(file) { try { return (await stat(file)).isFile() } catch { return false } }

export function startStaticServer({ directory = distDir, port = 0 } = {}) {
  const root = resolve(directory)
  return new Promise((done, reject) => {
    const server = createServer(async (request, response) => {
      try {
        if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405); response.end(); return }
        const pathname = decodeURIComponent(new URL(request.url || '/', 'http://127.0.0.1').pathname)
        let file = resolve(root, '.' + pathname)
        if (file !== root && !file.startsWith(root + sep)) { response.writeHead(404); response.end('Not found'); return }
        if (!(await exists(file))) {
          if (!prerenderRoutes.includes(pathname)) { response.writeHead(404); response.end('Not found'); return }
          file = join(root, 'index.html')
        }
        const body = await readFile(file)
        response.writeHead(200, { 'Content-Type': MIME[extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' })
        response.end(request.method === 'HEAD' ? undefined : body)
      } catch { response.writeHead(404); response.end('Not found') }
    })
    server.once('error', reject)
    server.listen(port, '127.0.0.1', () => done(server))
  })
}

export async function prerender() {
  const server = await startStaticServer()
  const origin = `http://127.0.0.1:${server.address().port}`
  let browser
  try {
    browser = await puppeteer.launch({ headless: true, ...(process.env.CHROME_EXECUTABLE_PATH ? { executablePath: process.env.CHROME_EXECUTABLE_PATH } : {}) })
    for (const route of prerenderRoutes) {
      const page = await browser.newPage()
      await page.setRequestInterception(true)
      page.on('request', request => {
        const url = new URL(request.url())
        if (url.protocol === 'data:' || (url.origin === origin && !url.pathname.startsWith('/api/'))) request.continue()
        else request.abort()
      })
      await page.goto(origin + route, { waitUntil: 'networkidle0', timeout: 30000 })
      await page.waitForSelector('#root h1', { timeout: 15000 })
      await page.waitForFunction(expected => document.querySelector('link[rel="canonical"]')?.getAttribute('href') === 'https://trucycle.co.uk' + expected, {}, route)
      const html = await page.content()
      const destination = route === '/' ? join(distDir, 'index.html') : join(distDir, route.slice(1), 'index.html')
      await mkdir(dirname(destination), { recursive: true })
      await writeFile(destination, html, 'utf8')
      console.log(`Prerendered public static route ${route}`)
      await page.close()
    }
  } finally {
    if (browser) await browser.close()
    await new Promise((done, reject) => server.close(error => error ? reject(error) : done()))
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  prerender().catch(error => { console.error('Prerender failed:', error instanceof Error ? error.message : 'unknown error'); process.exitCode = 1 })
}
