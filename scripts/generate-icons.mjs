import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const svg = await fs.readFile(path.join(root, 'src/assets/logo.svg'), 'utf8')
const browser = await puppeteer.launch({ headless: true, ...(process.env.CHROME_EXECUTABLE_PATH ? { executablePath: process.env.CHROME_EXECUTABLE_PATH } : {}) })
try {
  const page = await browser.newPage()
  await page.setRequestInterception(true)
  page.on('request', request => request.url().startsWith('data:') ? request.continue() : request.abort())
  const render = async (size, background = null, scale = 0.92) => {
    const data = await page.evaluate(async ({ source, size, background, scale }) => {
      const image = new Image(); image.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(source))); await image.decode()
      const canvas = document.createElement('canvas'); canvas.width = canvas.height = size
      const context = canvas.getContext('2d'); if (!context) throw Error('Canvas unavailable')
      if (background) { context.fillStyle = background; context.fillRect(0, 0, size, size) }
      const extent = size * scale, inset = (size - extent) / 2
      context.drawImage(image, inset, inset, extent, extent)
      return canvas.toDataURL('image/png').split(',')[1]
    }, { source: svg, size, background, scale })
    return Buffer.from(data, 'base64')
  }
  const publicRoot = path.join(root, 'public')
  await fs.mkdir(path.join(publicRoot, 'icons'), { recursive: true })
  const small = await render(32)
  await fs.writeFile(path.join(publicRoot, 'favicon-32.png'), small)
  // ICO directory containing a real32pxPNG image, not a PNG renamed .ico.
  const ico = Buffer.alloc(22)
  ico.writeUInt16LE(1, 2); ico.writeUInt16LE(1, 4); ico[6] = ico[7] = 32
  ico.writeUInt16LE(1, 10); ico.writeUInt16LE(32, 12); ico.writeUInt32LE(small.length, 14); ico.writeUInt32LE(22, 18)
  await fs.writeFile(path.join(publicRoot, 'favicon.ico'), Buffer.concat([ico, small]))
  await fs.writeFile(path.join(publicRoot, 'apple-touch-icon.png'), await render(180, '#F7FBF4'))
  await fs.writeFile(path.join(publicRoot, 'icons/icon-192.png'), await render(192))
  await fs.writeFile(path.join(publicRoot, 'icons/icon-512.png'), await render(512))
  await fs.writeFile(path.join(publicRoot, 'icons/maskable-512.png'), await render(512, '#F7FBF4', 0.70))
  console.log('Generated application icons from the existing TruCycle logo; no network or new branding.')
} finally { await browser.close() }
