import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Clipboard, Cpu, Loader2, RefreshCw, ShieldCheck, X } from 'lucide-react'
import { useToast } from '@/shared/ui/toast/useToast'

const CORRECT_PIN = import.meta.env.VITE_INTERNAL_PIN ?? '12345678'
const SESSION_KEY  = 'tc_internal_vision_unlocked'
const DEFAULT_WORKER = 'https://imgrc.trucycle01.workers.dev/'
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

// ── PIN gate ───────────────────────────────────────────────────────────────────

function PinGate({ onUnlock }: { readonly onUnlock: () => void }) {
  const [digits, setDigits] = useState<string[]>(Array(8).fill(''))
  const [error, setError]   = useState(false)
  const [shake, setShake]   = useState(false)
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const verify = useCallback((pin: string) => {
    if (pin === CORRECT_PIN) {
      sessionStorage.setItem(SESSION_KEY, '1')
      onUnlock()
    } else {
      setError(true); setShake(true)
      setDigits(Array(8).fill(''))
      setTimeout(() => { setShake(false); refs.current[0]?.focus() }, 600)
    }
  }, [onUnlock])

  const handleChange = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return
    const next = [...digits]; next[i] = v.slice(-1)
    setDigits(next); setError(false)
    if (v && i < 7) refs.current[i + 1]?.focus()
    if (next.every(Boolean)) verify(next.join(''))
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) refs.current[i - 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8)
    if (!p) return
    e.preventDefault()
    const next = Array(8).fill('') as string[]
    p.split('').forEach((ch, i) => { next[i] = ch })
    setDigits(next)
    if (p.length === 8) verify(p)
    else refs.current[p.length]?.focus()
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-tc-app-canvas px-6">
      <div
        className="w-full max-w-sm rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_20px_60px_rgba(0,0,0,0.06)]"
        style={shake ? { animation: 'shake 0.5s ease' } : {}}
      >
        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.1rem] bg-[#0D3B24] shadow-[0_12px_32px_rgba(13,59,36,0.25)]">
            <ShieldCheck size={26} className="text-[#A4F5A6]" />
          </div>
        </div>
        <h1 className="mb-1 text-center text-xl font-bold tracking-tight text-slate-900">Internal access</h1>
        <p className="mb-8 text-center text-sm text-slate-500">Enter the 8-digit PIN to continue</p>

        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { refs.current[i] = el }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              autoFocus={i === 0}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className={[
                'h-12 w-10 rounded-xl border bg-slate-50 text-center text-lg font-bold caret-transparent text-slate-900 outline-none transition-all duration-150',
                digit ? 'border-[#0D3B24]/50 shadow-[0_0_0_3px_rgba(13,59,36,0.08)]' : 'border-slate-200',
                error ? '!border-rose-400' : '',
                'focus:border-[#0D3B24]/60 focus:shadow-[0_0_0_3px_rgba(13,59,36,0.10)]',
              ].join(' ')}
            />
          ))}
        </div>

        {error && <p className="mt-4 text-center text-sm font-medium text-rose-500">Incorrect PIN — try again</p>}
        <p className="mt-8 text-center text-xs text-slate-400">TruCycle · Internal tools · Not indexed</p>
      </div>
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}   60%{transform:translateX(-5px)}
          80%{transform:translateX(5px)}
        }
      `}</style>
    </div>
  )
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
  if (s === 'running') return 'bg-amber-400 animate-ping'
  if (s === 'success') return 'bg-emerald-500 animate-pulse'
  if (s === 'error')   return 'bg-rose-500 animate-pulse'
  if (s === 'warn')    return 'bg-amber-400 animate-pulse'
  return 'bg-slate-300'
}

function conditionStyle(c: string) {
  const lc = c.toLowerCase()
  if (lc.includes('excellent') || lc.includes('good'))
    return { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Resellable' }
  if (lc.includes('fair'))
    return { cls: 'bg-amber-50 text-amber-700 border-amber-200', label: 'Repairable' }
  return   { cls: 'bg-rose-50 text-rose-700 border-rose-200', label: 'Downcycle' }
}

// ── Vision tool ────────────────────────────────────────────────────────────────

function VisionTool() {
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast()

  const [workerUrl, setWorkerUrl] = useState(DEFAULT_WORKER)
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
    if (!workerUrl.trim()) { toastError('Worker URL missing',  'Enter your Cloudflare Worker URL.'); return }

    setLoading(true); setStatus('running'); setResponse(null)
    const t0 = performance.now()

    const fd = new FormData()
    fd.append('image', blob, 'optimized.jpg')
    fd.append('prompt', prompt || 'Analyze this item for TruCycle.')

    try {
      const res  = await fetch(workerUrl.trim(), { method: 'POST', body: fd })
      const data = await res.json() as WorkerResponse
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
  }, [blob, workerUrl, prompt])

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
    <div className="min-h-screen bg-tc-app-canvas">

      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0D3B24] shadow-sm">
              <Cpu size={20} className="text-[#A4F5A6]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-900">TruCycle Vision</h1>
                <span className="rounded-full bg-[#0D3B24]/8 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0D3B24]">
                  Internal
                </span>
              </div>
              <p className="text-xs text-slate-400">Evaluation Sandbox · Llama 3.2 Vision · Not indexed</p>
            </div>
          </div>

          {/* Worker URL input */}
          <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Worker</span>
            <input
              value={workerUrl}
              onChange={(e) => setWorkerUrl(e.target.value)}
              className="w-full bg-transparent text-xs font-semibold text-[#0D3B24] outline-none placeholder:text-slate-400"
              placeholder="https://your-worker.workers.dev/"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">

          {/* ── Left panel ── */}
          <div className="space-y-5 lg:col-span-5">
            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">

              <h2 className="mb-5 text-base font-semibold text-slate-800">Upload &amp; Configure</h2>

              {/* Drop zone */}
              <div className="mb-5">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Garment / Item Photo
                </label>
                <div
                  className="relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition-all hover:border-[#0D3B24]/30 hover:bg-[#0D3B24]/3"
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
                        className="absolute right-2 top-2 z-10 rounded-full border border-slate-200 bg-white p-1.5 text-slate-400 shadow-sm transition-colors hover:text-rose-500"
                      >
                        <X size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); document.getElementById('tc-file-input')?.click() }}
                        className="relative z-10 rounded-full border border-white/60 bg-white/80 px-4 py-1.5 text-sm font-medium text-slate-700 shadow backdrop-blur"
                      >
                        <RefreshCw size={13} className="mr-1.5 inline" />
                        Change
                      </button>
                    </>
                  ) : (
                    <div className="pointer-events-none space-y-2 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm text-slate-500">
                        <span className="font-semibold text-[#0D3B24]">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-slate-400">Auto-compressed in-browser · Max ~3 MB raw</p>
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
                  <div className="mt-2 flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
                    <span>Raw: <span className="font-semibold text-slate-700">{rawSize}</span></span>
                    {cmpSize
                      ? <span className="font-semibold text-emerald-600">Compressed: {cmpSize} ✓</span>
                      : <span className="animate-pulse font-semibold text-amber-500">Compressing…</span>}
                  </div>
                )}
              </div>

              {/* Prompt */}
              <div className="mb-5">
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Analysis Prompt</label>
                  <span className="text-[10px] font-semibold text-slate-400">Llama-3.2 Vision</span>
                </div>
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what attributes you are looking for…"
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#0D3B24]/40 focus:ring-2 focus:ring-[#0D3B24]/8"
                />
              </div>

              {/* Presets */}
              <div className="mb-6">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Quick Presets</span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => { setPrompt(p.prompt); toastSuccess('Prompt loaded', `${p.label} template applied`) }}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
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
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-tc-action-primary py-3.5 text-sm font-bold text-tc-action-primaryText shadow-sm transition hover:bg-tc-action-primaryHover disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading
                  ? <><Loader2 size={16} className="animate-spin" />Analysing…</>
                  : blob ? 'Run auditing pipeline' : 'Select an image first'}
              </button>
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="lg:col-span-7">
            <div className="flex min-h-[680px] flex-col rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">

              {/* Panel header */}
              <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${pulseClass(status)}`} />
                  Analysis Results
                </h2>
                <span className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-1 font-mono text-xs text-slate-400">
                  {latency} latency
                </span>
              </div>

              {/* Empty state */}
              {!response && (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-300">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-600">Awaiting Analysis</h3>
                  <p className="mt-1 max-w-xs text-xs text-slate-400">
                    Upload an item image and run the pipeline to see AI results here.
                  </p>
                </div>
              )}

              {/* Worker error */}
              {response && !response.success && (
                <div className="flex-1 space-y-3">
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <p className="text-sm font-semibold text-rose-700">Worker error</p>
                    <p className="mt-1 font-mono text-xs text-rose-500">{response.error}</p>
                    {response.model && <p className="mt-2 text-[10px] text-slate-400">Model: {response.model}</p>}
                  </div>
                </div>
              )}

              {/* Rich results */}
              {response?.success && data && (
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                    {/* Item type */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Identified Item Type</span>
                      <span className="text-base font-bold capitalize text-slate-900">
                        {String(data.item_type ?? data.garment_type ?? '-')}
                      </span>
                    </div>

                    {/* Category */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Suggested Category</span>
                      <span className="text-sm font-bold text-[#0D3B24]">
                        {String(data.suggested_category ?? '-')}
                      </span>
                    </div>

                    {/* Condition */}
                    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div>
                        <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Condition</span>
                        <span className="text-base font-bold text-slate-900">{condition}</span>
                      </div>
                      {cStyle && (
                        <div className={`flex h-7 items-center rounded-lg border px-2.5 text-xs font-bold uppercase tracking-wider ${cStyle.cls}`}>
                          {cStyle.label}
                        </div>
                      )}
                    </div>

                    {/* Reusability */}
                    <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 p-4">
                      <div>
                        <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Reusability</span>
                        <span className="text-base font-bold text-slate-900">
                          {isReusable ? 'Yes — Eligible' : 'No — Excluded'}
                        </span>
                      </div>
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full border ${
                        isReusable
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                          : 'border-rose-200 bg-rose-50 text-rose-500'
                      }`}>
                        {isReusable ? <Check size={15} strokeWidth={2.5} /> : <X size={15} strokeWidth={2.5} />}
                      </div>
                    </div>
                  </div>

                  {/* Material */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400">Material Composition</span>
                    <p className="text-sm font-medium leading-relaxed text-slate-700">
                      {String(data.material_composition ?? 'Evaluated by image analysis — no sub-fibers detected.')}
                    </p>
                  </div>

                  {/* Notes */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400">AI Notes</span>
                    <p className="text-sm font-medium italic leading-relaxed text-slate-600">
                      "{String(data.notes ?? '-')}"
                    </p>
                  </div>
                </div>
              )}

              {/* Raw partial text */}
              {response?.success && response.raw && !data && (
                <div className="flex-1 space-y-3">
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-semibold text-amber-700">Model returned plain text — JSON extraction failed</p>
                  </div>
                  <pre className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 font-mono text-xs leading-6 text-slate-500">
                    {response.raw}
                  </pre>
                </div>
              )}

              {/* JSON inspector */}
              <div className="mt-auto border-t border-slate-100 pt-5">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Raw Response Payload</h3>
                  <button
                    type="button"
                    onClick={copyJson}
                    className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-800"
                  >
                    {copied ? <Check size={11} /> : <Clipboard size={11} />}
                    {copied ? 'Copied!' : 'Copy JSON'}
                  </button>
                </div>
                <pre className="max-h-44 select-all overflow-x-auto rounded-xl border border-slate-100 bg-slate-50 p-4 font-mono text-xs text-slate-500">
                  {response ? JSON.stringify(response, null, 2) : '{}'}
                </pre>
              </div>
            </div>
          </div>

        </div>
      </main>

      <footer className="mx-auto mt-8 max-w-7xl border-t border-slate-100 px-6 py-6 text-center text-xs text-slate-400">
        © 2026 TruCycle Ltd · Internal · Not tracked · Not indexed
      </footer>
    </div>
  )
}

// ── Page root ──────────────────────────────────────────────────────────────────

export default function InternalVisionPage() {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === '1'
  )
  return (
    <>
      <NoIndex />
      {unlocked ? <VisionTool /> : <PinGate onUnlock={() => setUnlocked(true)} />}
    </>
  )
}
