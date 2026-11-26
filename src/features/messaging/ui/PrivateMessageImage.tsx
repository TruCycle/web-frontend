import { useEffect, useId, useRef, useState } from 'react'
import { fetchMessageImage } from '../api/messagingApi'

export function PrivateMessageImage({ roomId, messageId, alt }: {
  roomId: string
  messageId: string
  alt: string
}) {
  const request = useRef<AbortController | null>(null)
  const objectUrl = useRef<string | null>(null)
  const previewId = useId()
  const [src, setSrc] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => () => {
    request.current?.abort()
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
  }, [])

  function closeImage() {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
    objectUrl.current = null
    setSrc(null)
  }

  async function openImage() {
    if (request.current) return
    const controller = new AbortController()
    request.current = controller
    setLoading(true)
    setError(false)
    try {
      const blob = await fetchMessageImage(roomId, messageId, controller.signal)
      if (controller.signal.aborted) return
      objectUrl.current = URL.createObjectURL(blob)
      setSrc(objectUrl.current)
    } catch {
      if (!controller.signal.aborted) setError(true)
    } finally {
      request.current = null
      if (!controller.signal.aborted) setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={Boolean(src)}
        aria-controls={previewId}
        aria-disabled={loading}
        className="min-h-11 underline"
        onClick={() => {
          if (src) closeImage()
          else if (!loading) void openImage()
        }}
      >
        {src ? 'Close image' : loading ? 'Opening image…' : error ? 'Retry opening image' : 'Open image'}
      </button>
      <div id={previewId} hidden={!src}>
        {src ? (
          <img src={src} alt={alt} className="mb-2 max-h-72 max-w-full rounded-lg object-contain" onError={() => {
            if (objectUrl.current !== src) return
            closeImage()
            setError(true)
          }} />
        ) : null}
      </div>
      {error ? <p role="status">Image attachment unavailable.</p> : null}
    </div>
  )
}
