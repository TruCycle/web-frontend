import { useState } from 'react'
import { env } from '@/shared/lib/config/env'
import { Button } from '@/shared/ui/button/Button'

const MAX_SAMPLE_SIDE = 160
const MIN_BACKGROUND_SHARE = 0.05
const MIN_FOREGROUND_SHARE = 0.05

function hasUsableCutout(image: HTMLImageElement): boolean {
  const { naturalWidth, naturalHeight } = image
  if (!naturalWidth || !naturalHeight) return false

  const scale = Math.min(1, MAX_SAMPLE_SIDE / Math.max(naturalWidth, naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(naturalHeight * scale))
  const context = canvas.getContext('2d')
  if (!context) return false

  try {
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    let backgroundPixels = 0
    let foregroundPixels = 0
    for (let index = 3; index < pixels.length; index += 4) {
      const alpha = pixels[index]
      if (alpha <= 16) backgroundPixels += 1
      if (alpha >= 224) foregroundPixels += 1
    }
    const pixelCount = canvas.width * canvas.height
    return backgroundPixels >= pixelCount * MIN_BACKGROUND_SHARE &&
      foregroundPixels >= pixelCount * MIN_FOREGROUND_SHARE
  } catch {
    // If the CDN response cannot be read by canvas, keep the original.
    return false
  }
}

function getCutoutUrl(original: string): string | null {
  if (!env.enablePhotoCutout || !env.cloudinaryCloudName) return null
  try {
    const url = new URL(original)
    const cloud = env.cloudinaryCloudName.replace(/^['"]|['"]$/g, '')
    const prefix = `/${cloud}/image/upload/`
    if (url.origin !== 'https://res.cloudinary.com' || url.username || url.password || url.search ||
        !url.pathname.startsWith(prefix)) return null
    const asset = url.pathname.slice(prefix.length)
    if (!/^v\d+\/.+\.[a-z0-9]+$/i.test(asset)) return null
    return `${url.origin}${prefix}e_background_removal/f_png/${asset.replace(/\.[a-z0-9]+$/i, '.png')}`
  } catch {
    return null
  }
}

interface PhotoCutoutPreviewProps {
  readonly originalUrl: string
  readonly selectedUrl: string | null
  readonly onChange: (url: string | null) => void
  readonly disabled?: boolean
}

export function PhotoCutoutPreview({ originalUrl, selectedUrl, onChange, disabled }: PhotoCutoutPreviewProps) {
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'unavailable' | 'rejected'>('idle')
  const cutoutUrl = getCutoutUrl(originalUrl)
  if (!cutoutUrl) return null

  const showPreview = () => {
    setStatus('loading')
    setAttempt((current) => current + 1)
  }

  const keepOriginal = (nextStatus: 'unavailable' | 'rejected') => {
    setStatus(nextStatus)
    if (selectedUrl) onChange(null)
  }

  return (
    <div className="space-y-2">
      {status === 'loading' || status === 'ready' ? (
        <img key={attempt} crossOrigin="anonymous" src={cutoutUrl} alt="Item with the background removed"
          hidden={status !== 'ready'} className="max-h-56 w-full rounded-xl bg-slate-100 object-contain"
          onLoad={(event) => {
            if (hasUsableCutout(event.currentTarget)) setStatus('ready')
            else keepOriginal('rejected')
          }} onError={() => keepOriginal('unavailable')} />
      ) : null}
      {status === 'loading' ? <p role="status" className="text-sm text-slate-600">Preparing cutout…</p> : null}
      {status === 'unavailable' ? (
        <p role="status" className="text-sm text-slate-600">The cutout may still be processing. Retry the preview or continue with the original.</p>
      ) : null}
      {status === 'rejected' ? (
        <p role="status" className="text-sm text-slate-600">Background removal did not produce a usable cutout. The original photo will be used.</p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {status === 'idle' || status === 'unavailable' ? (
          <Button type="button" variant="secondary" disabled={disabled} onClick={showPreview}>
            {status === 'idle' ? 'Preview background removal' : 'Retry cutout preview'}
          </Button>
        ) : null}
        {status === 'ready' && !selectedUrl ? (
          <Button type="button" variant="secondary" disabled={disabled} onClick={() => onChange(cutoutUrl)}>Use cutout</Button>
        ) : null}
        {selectedUrl ? (
          <Button type="button" variant="secondary" disabled={disabled} onClick={() => onChange(null)}>Use original</Button>
        ) : null}
      </div>
    </div>
  )
}
