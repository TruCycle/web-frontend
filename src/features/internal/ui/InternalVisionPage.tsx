import { useCallback, useEffect, useState } from 'react'
import { Check, Clipboard, Cpu, Loader2, RefreshCw, X } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { apiRequest } from '@/shared/lib/api/client'
import { unwrapApiData } from '@/shared/lib/api/envelope'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { LoadingState } from '@/shared/ui/loading/LoadingState'
import { useToast } from '@/shared/ui/toast/useToast'

const MAX_DIMENSION  = 1000
const JPEG_QUALITY   = 0.85

function NoIndex() {
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow, noarchive'
    document.head.appendChild(meta)
    return () => { document.head.removeChild(meta) }
  }, [])
  return null
}

function fmtMb(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = (ev) => {
      const img = new Image()
      img.onerror = reject
      img.onload = () => {
        let w = img.width, h = img.height
        if (w > h) { if (w > MAX_DIMENSION) { h = Math.round(h * MAX_DIMENSION / w); w = MAX_DIMENSION } }
        else        { if (h > MAX_DIMENSION) { w = Math.round(w * MAX_DIMENSION / h); h = MAX_DIMENSION } }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/jpeg', JPEG_QUALITY)
      }
      img.src = ev.target!.result as string
    }
    reader.readAsDataURL(file)
  })
}

// ── Types & constants ──────────────────────────────────────────────────────────

type StatusPulse = 'idle' | 'running' | 'success' | 'error' | 'warn'

interface WorkerResponse {
  success: boolean
  data?:   Record<string, unknown>
  raw?:    string
  error?:  string
  model?:  string
}

const PRESETS = [
  { icon: '👕', label: 'Apparel',   prompt: 'Detailed clothing evaluation: identify garment type, precise materials, wear tier, and reusable status.' },
  { icon: '🛋️', label: 'Furniture', prompt: 'Analyze this furniture piece. Look for structural damage, fabric tearing, cleanliness, and determine category.' },
  { icon: '🍽️', label: 'Household', prompt: 'Identify any household items or kitchenware visible. Assess material degradation and structural soundness.' },
]

function pulseClass(s: StatusPulse) {
  if (s === 'running') return 'bg-tc-brand-track animate-ping'
  if (s === 'success') return 'bg-tc-brand-mint animate-pulse'
  if (s === 'error')   return 'bg-tc-brand-danger animate-pulse'
  if (s === 'warn')    return 'bg-tc-brand-track animate-pulse'
  return 'bg-tc-brand-track'
}

function conditionStyle(c: string) {
  const lc = c.toLowerCase()
  if (lc.includes('excellent') || lc.includes('good'))
    return { cls: 'bg-tc-brand-mintSoft text-tc-brand-deep border-tc-brand-mintLine', label: 'Resellable' }
  if (lc.includes('fair'))
    return { cls: 'bg-tc-brand-soft text-tc-brand-body border-tc-brand-line', label: 'Repairable' }
  return   { cls: 'bg-tc-brand-dangerSoft text-tc-brand-danger border-tc-brand-dangerLine', label: 'Downcycle' }
}

// ── Vision tool ────────────────────────────────────────────────────────────────

function VisionTool() {
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast()

  const [rawFile, setRawFile]     = useState<File | null>(null)
  const [blob, setBlob]           = useState<Blob | null>(null)
  const [preview, setPreview]     = useState<string | null>(null)
  const [rawSize, setRawSize]     = useState('')
  const [cmpSize, setCmpSize]     = useState('')
  const [prompt, setPrompt]       = useState(PRESETS[0].prompt)
  const [loading, setLoading]     = useState(false)
  const [status, setStatus]       = useState<StatusPulse>('idle')
  const [latency, setLatency]     = useState('0.00s')
  const [response, setResponse]   = useState<WorkerResponse | null>(null)
  const [copied, setCopied]       = useState(false)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toastError('Format rejected', 'Please select a valid image file (.jpg, .png, .webp).')
      return
    }
    setRawSize(fmtMb(file.size))
    setRawFile(file)
    setResponse(null)
    setStatus('idle')
    if (preview) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(file))
    setCmpSize('')
    try {
      const compressed = await compressImage(file)
      setBlob(compressed)
      setCmpSize(fmtMb(compressed.size))
      toastSuccess('Image ready', `Optimised to ${fmtMb(compressed.size)}`)
    } catch {
      toastError('Compression failed', 'Could not optimise the image.')
      setBlob(null)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview])

  const clearFile = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview)
    setRawFile(null); setBlob(null); setPreview(null)
    setRawSize(''); setCmpSize('')
    setResponse(null); setStatus('idle')
  }, [preview])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) void handleFile(file)
  }, [handleFile])

  const handleSubmit = useCallback(async () => {
    if (!blob)             { toastError('No image',            'Upload an image first.'); return }

    setLoading(true); setStatus('running'); setResponse(null)
    const t0 = performance.now()

    const fd = new FormData()
    fd.append('image', blob, 'optimized.jpg')
    fd.append('prompt', prompt || 'Analyze this item for TruCycle.')

    try {
      const data = unwrapApiData<WorkerResponse>(await apiRequest<WorkerResponse, FormData>('/found-items/vision', { method: 'POST', body: fd, timeoutMs: 25_000 }))
      const ms   = ((performance.now() - t0) / 1000).toFixed(2)
      setLatency(`${ms}s`)
      setResponse(data)

      if (data.success && data.data) {
        setStatus('success')
        toastSuccess('Analysis complete', `Categorised in ${ms}s`)
      } else if (data.success && data.raw) {
        setStatus('warn')
        toastInfo('Partial result', 'Model returned plain text — see raw output')
      } else {
        setStatus('error')
        toastError('Inference failed', data.error ?? 'Unknown error from worker')
      }
    } catch (err) {
      setStatus('error')
      toastError('Network error', err instanceof Error ? err.message : 'Fetch failed')
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blob, prompt])

  const copyJson = useCallback(() => {
    const text = response ? JSON.stringify(response, null, 2) : '{}'
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      toastSuccess('Copied', 'Raw JSON copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [response])

  const data       = response?.data
  const condition  = String(data?.condition ?? data?.estimated_wear_tier ?? '-')
  const isReusable = data?.reusable !== undefined ? Boolean(data.reusable) : Boolean(data?.uk_recycling_eligibility)
  const cStyle     = data ? conditionStyle(condition) : null

  return (
    <div className="min-h-screen bg-tc-brand-haze">

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-50 border-b border-tc-brand-line bg-white/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-tc-md bg-tc-brand-deep">
              <Cpu size={20} className="text-tc-brand-mint" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold tracking-tight text-tc-brand-ink">TruCycle Vision</h1>
                <span className="rounded-full bg-tc-brand-mintSoft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-tc-brand-deep">
                  Internal
                </span>
              </div>
              <p className="text-xs leading-4 text-tc-brand-muted">Evaluation Sandbox · Llama 3.2 Vision · Not indexed</p>
            </div>
          </div>

        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

          {/* ── Left panel ── */}
          <div className="space-y-5 lg:col-span-5">
            <div className="rounded-tc-lg border border-tc-brand-line bg-white p-6">

              <h2 className="mb-5 text-lg font-semibold leading-6 text-tc-brand-ink">Upload &amp; Configure</h2>

              {/* Drop zone */}
              <div className="mb-5">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-tc-brand-muted">
                  Garment / Item Photo
                </label>
                <div
                  className="relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-tc-lg border-2 border-dashed border-tc-brand-control bg-tc-brand-haze transition-all hover:border-tc-brand-deep hover:bg-tc-brand-mintSoft"
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={(e) => e.preventDefault()}
                  onClick={() => !preview && document.getElementById('tc-file-input')?.click()}
                >
                  {preview ? (
                    <>
                      <img src={preview} alt="Preview" className="absolute inset-0 h-full w-full object-contain" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); clearFile() }}
                        className="absolute right-2 top-2 z-10 rounded-full border border-tc-brand-line bg-white p-1.5 text-tc-brand-body shadow-tc-card transition-colors hover:text-tc-brand-danger"
                      >
                        <X size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); document.getElementById('tc-file-input')?.click() }}
                        className="relative z-10 rounded-full border border-tc-brand-control bg-white/90 px-4 py-1.5 text-sm font-semibold text-tc-brand-deep shadow-tc-card backdrop-blur"
                      >
                        <RefreshCw size={13} className="mr-1.5 inline" />
                        Change
                      </button>
                    </>
                  ) : (
                    <div className="pointer-events-none space-y-2 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-tc-brand-line bg-white text-tc-brand-ink">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm leading-5 text-tc-brand-body">
                        <span className="font-semibold text-tc-brand-ink">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs leading-4 text-tc-brand-muted">Auto-compressed in-browser · Max ~3 MB raw</p>
                    </div>
                  )}
                  <input
                    id="tc-file-input"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f) }}
                  />
                </div>

                {/* Size badge */}
                {rawFile && (
                  <div className="mt-2 flex items-center justify-between rounded-tc-sm bg-tc-brand-soft px-3 py-2 text-xs font-medium text-tc-brand-body">
                    <span>Raw: <span className="font-semibold text-tc-brand-ink">{rawSize}</span></span>
                    {cmpSize
                      ? <span className="font-semibold text-tc-brand-ink">Compressed: {cmpSize} ✓</span>
                      : <span className="animate-pulse font-semibold text-tc-brand-body">Compressing…</span>}
                  </div>
                )}
              </div>

              {/* Prompt */}
              <div className="mb-5">
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-tc-brand-muted">Analysis Prompt</label>
                  <span className="text-xs font-semibold text-tc-brand-muted">Llama-3.2 Vision</span>
                </div>
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what attributes you are looking for…"
                  className="w-full resize-none rounded-tc-md border border-tc-brand-control bg-white px-3.5 py-3 text-sm text-tc-brand-ink outline-none transition placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:ring-2 focus:ring-tc-brand-mint"
                />
              </div>

              {/* Presets */}
              <div className="mb-6">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-tc-brand-muted">Quick Presets</span>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => { setPrompt(p.prompt); toastSuccess('Prompt loaded', `${p.label} template applied`) }}
                      className="min-h-11 rounded-full border border-tc-brand-control bg-white px-4 py-2 text-sm font-semibold text-tc-brand-deep transition hover:bg-tc-brand-soft"
                    >
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="button"
                disabled={!blob || loading}
                onClick={() => void handleSubmit()}
                className="flex w-full items-center justify-center gap-2 min-h-12 rounded-tc-md bg-tc-brand-deep px-4 py-3 text-sm font-semibold text-white transition hover:bg-tc-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" />Analysing…</>
                  : blob ? 'Run auditing pipeline' : 'Select an image first'}
              </button>
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="lg:col-span-7">
            <div className="flex min-h-[500px] flex-col rounded-tc-lg border border-tc-brand-line bg-white p-6">

              {/* Panel header */}
              <div className="mb-6 flex items-center justify-between border-b border-tc-brand-line pb-4">
                <h2 className="flex items-center gap-2.5 text-lg font-semibold leading-6 text-tc-brand-ink">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${pulseClass(status)}`} />
                  Analysis Results
                </h2>
                <span className="rounded-tc-sm border border-tc-brand-line bg-tc-brand-haze px-3 py-1 font-mono text-xs text-tc-brand-muted">
                  {latency} latency
                </span>
              </div>

              {/* Empty state */}
              {!response && (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-tc-brand-mintSoft text-tc-brand-deep">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold leading-6 text-tc-brand-ink">Awaiting Analysis</h3>
                  <p className="mt-1 max-w-sm text-sm leading-5 text-tc-brand-body">
                    Upload an item image and run the pipeline to see AI results here.
                  </p>
                </div>
              )}

              {/* Worker error */}
              {response && !response.success && (
                <div className="flex-1 space-y-3">
                  <div className="rounded-tc-md border border-tc-brand-dangerLine bg-tc-brand-dangerSoft p-4">
                    <p className="text-sm font-semibold text-tc-brand-danger">Worker error</p>
                    <p className="mt-1 break-words font-mono text-xs text-tc-brand-danger">{response.error}</p>
                    {response.model && <p className="mt-2 text-xs text-tc-brand-muted">Model: {response.model}</p>}
                  </div>
                </div>
              )}

              {/* Rich results */}
              {response?.success && data && (
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                    {/* Item type */}
                    <div className="rounded-tc-md bg-tc-brand-soft p-4">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-tc-brand-muted">Identified Item Type</span>
                      <span className="text-base font-semibold capitalize text-tc-brand-ink">
                        {String(data.item_type ?? data.garment_type ?? '-')}
                      </span>
                    </div>

                    {/* Category */}
                    <div className="rounded-tc-md bg-tc-brand-soft p-4">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-tc-brand-muted">Suggested Category</span>
                      <span className="text-sm font-semibold text-tc-brand-ink">
                        {String(data.suggested_category ?? '-')}
                      </span>
                    </div>

                    {/* Condition */}
                    <div className="flex items-center justify-between rounded-tc-md bg-tc-brand-soft p-4">
                      <div>
                        <span className="mb-0.5 block text-xs font-semibold uppercase tracking-wider text-tc-brand-muted">Condition</span>
                        <span className="text-base font-semibold text-tc-brand-ink">{condition}</span>
                      </div>
                      {cStyle && (
                        <div className={`flex h-7 items-center rounded-full border px-2.5 text-xs font-semibold uppercase tracking-wider ${cStyle.cls}`}>
                          {cStyle.label}
                        </div>
                      )}
                    </div>

                    {/* Reusability */}
                    <div className="flex items-center justify-between rounded-tc-md bg-tc-brand-soft p-4">
                      <div>
                        <span className="mb-0.5 block text-xs font-semibold uppercase tracking-wider text-tc-brand-muted">Reusability</span>
                        <span className="text-base font-semibold text-tc-brand-ink">
                          {isReusable ? 'Yes — Eligible' : 'No — Excluded'}
                        </span>
                      </div>
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                        isReusable
                          ? 'border-tc-brand-mintLine bg-tc-brand-mintSoft text-tc-brand-deep'
                          : 'border-tc-brand-dangerLine bg-tc-brand-dangerSoft text-tc-brand-danger'
                      }`}>
                        {isReusable ? <Check size={15} strokeWidth={2.5} /> : <X size={15} strokeWidth={2.5} />}
                      </div>
                    </div>
                  </div>

                  {/* Material */}
                  <div className="rounded-tc-md bg-tc-brand-soft p-4">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-tc-brand-muted">Material Composition</span>
                    <p className="text-sm font-medium leading-relaxed text-tc-brand-ink">
                      {String(data.material_composition ?? 'Evaluated by image analysis — no sub-fibers detected.')}
                    </p>
                  </div>

                  {/* Notes */}
                  <div className="rounded-tc-md bg-tc-brand-soft p-4">
                    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-tc-brand-muted">AI Notes</span>
                    <p className="text-sm font-medium italic leading-relaxed text-tc-brand-body">
                      "{String(data.notes ?? '-')}"
                    </p>
                  </div>
                </div>
              )}

              {/* Raw partial text */}
              {response?.success && response.raw && !data && (
                <div className="flex-1 space-y-3">
                  <div className="rounded-tc-md border border-tc-brand-control bg-tc-brand-soft p-3">
                    <p className="text-xs font-semibold text-tc-brand-ink">Model returned plain text — JSON extraction failed</p>
                  </div>
                  <pre className="min-h-[260px] overflow-y-auto whitespace-pre-wrap rounded-tc-md border border-tc-brand-line bg-tc-brand-haze p-4 font-mono text-xs leading-7 text-tc-brand-body">
                    {response.raw}
                  </pre>
                </div>
              )}

              {/* JSON inspector */}
              <div className="mt-auto border-t border-tc-brand-line pt-5">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-tc-brand-muted">Raw Response Payload</h3>
                  <button
                    type="button"
                    onClick={copyJson}
                    className="flex items-center gap-1.5 min-h-11 rounded-tc-md border border-tc-brand-control bg-white px-4 py-2 text-sm font-semibold text-tc-brand-deep transition hover:bg-tc-brand-soft"
                  >
                    {copied ? <Check size={11} /> : <Clipboard size={11} />}
                    {copied ? 'Copied!' : 'Copy JSON'}
                  </button>
                </div>
                <pre className="max-h-44 select-all overflow-x-auto rounded-tc-md border border-tc-brand-line bg-tc-brand-haze p-4 font-mono text-xs text-tc-brand-body">
                  {response ? JSON.stringify(response, null, 2) : '{}'}
                </pre>
              </div>
            </div>
          </div>

        </div>
      </main>

      <footer className="mx-auto mt-8 max-w-7xl border-t border-tc-brand-line px-6 py-6 text-center text-xs text-tc-brand-muted">
        © 2026 TruCycle Ltd · Internal · Not tracked · Not indexed
      </footer>
    </div>
  )
}

// ── Page root ──────────────────────────────────────────────────────────────────

export default function InternalVisionPage() {
  const { user, isBootstrapping } = useAuthSession()
  if (isBootstrapping) return <LoadingState variant="page" label="Checking access" />
  if (!user) return <Navigate to="/login" state={{ from: { pathname: '/internal/vision' } }} replace />

  return (
    <>
      <NoIndex />
      {user.roles?.includes('admin') ? <VisionTool key={user.id} /> : (
        <main className="min-h-screen bg-tc-brand-haze p-4 sm:p-8">
          <h1 className="text-xl font-semibold leading-7 tracking-[-0.015em] text-tc-brand-ink">Administrator access required</h1>
        </main>
      )}
    </>
  )
}
