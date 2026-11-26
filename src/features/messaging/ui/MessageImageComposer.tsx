import { useRef, useState } from 'react'
import { Paperclip } from 'lucide-react'
import { MAX_MESSAGE_IMAGE_BYTES } from '../api/messagingApi'

export function MessageImageComposer({ disabled, send }: {
  disabled: boolean
  send: (file: File, id: string) => Promise<boolean>
}) {
  const input = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<{ file: File; id: string } | null>(null)
  const [error, setError] = useState('')
  return (
    <div className="shrink-0">
      <input
        type="file"
        hidden
        ref={input}
        accept="image/jpeg,image/png,image/webp"
        onChange={event => {
          const file = event.target.files?.[0]
          event.target.value = ''
          if (!file) return
          if (!file.size || file.size > MAX_MESSAGE_IMAGE_BYTES) {
            setError('Choose an image no larger than 512 KB.')
            return
          }
          setError('')
          setPending({ file, id: crypto.randomUUID() })
        }}
      />
      {pending ? (
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" disabled={disabled} className="min-h-10 underline" onClick={() => {
            void send(pending.file, pending.id).then(confirmed => {
              if (confirmed) setPending(null)
            })
          }}>Send image</button>
          <button type="button" disabled={disabled} className="min-h-10 underline" onClick={() => setPending(null)}>Remove image</button>
        </div>
      ) : (
        <button type="button" aria-label="Attach image" disabled={disabled} className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-slate-100" onClick={() => input.current?.click()}>
          <Paperclip size={20} />
        </button>
      )}
      {error ? <p role="status" className="text-sm">{error}</p> : null}
    </div>
  )
}
