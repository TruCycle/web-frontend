import { useState } from 'react'
import { env } from '@/shared/lib/config/env'
import { Button } from '@/shared/ui/button/Button'

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
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'unavailable'>('idle')
  const cutoutUrl = getCutoutUrl(originalUrl)
  if (!cutoutUrl) return null

  const showPreview = () => {
    setStatus('loading')
    setAttempt((current) => current + 1)
  }

  return (
    <div className="space-y-2">
      {status === 'loading' || status === 'ready' ? (
        <img key={attempt} src={cutoutUrl} alt="Item with the background removed"
          hidden={status !== 'ready'} className="max-h-56 w-full rounded-xl bg-slate-100 object-contain"
          onLoad={() => setStatus('ready')} onError={() => setStatus('unavailable')} />
      ) : null}
      {status === 'loading' ? <p role="status" className="text-sm text-slate-600">Preparing cutout…</p> : null}
      {status === 'unavailable' ? (
        <p role="status" className="text-sm text-slate-600">The cutout may still be processing. Retry the preview or continue with the original.</p>
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
