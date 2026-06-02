import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Check,
  Clipboard,
  Cpu,
  Loader2,
  RefreshCw,
  ShieldCheck,
  X,
} from 'lucide-react'

const CORRECT_PIN = import.meta.env.VITE_INTERNAL_PIN ?? '12345678'
const SESSION_KEY = 'tc_internal_vision_unlocked'
const DEFAULT_WORKER = 'https://imgrc.trucycle01.workers.dev/'
const MAX_DIMENSION = 1000 // px — canvas resize ceiling
const JPEG_QUALITY = 0.85

// Prevent search-engine indexing
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

// ── helpers ────────────────────────────────────────────────────────────────────

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
        let w = img.width
        let h = img.height
        if (w > h) { if (w > MAX_DIMENSION) { h = Math.round(h * MAX_DIMENSION / w); w = MAX_DIMENSION } }
        else        { if (h > MAX_DIMENSION) { w = Math.round(w * MAX_DIMENSION / h); h = MAX_DIMENSION } }
        const canvas = document.createElement('canvas')
        canvas.width = w; canvas.height = h
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, w, h)
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')), 'image/jpeg', JPEG_QUALITY)
      }
      img.src = ev.target!.result as string
    }
    reader.readAsDataURL(file)
  })
}

// ── Toast ──────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'warn'
type ToastState = { title: string; message: string; type: ToastType } | null

function Toast({ toast, onDismiss }: { readonly toast: ToastState; readonly onDismiss: () => void }) {
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(onDismiss, 4000)
    return () => clearTimeout(t)
  }, [toast, onDismiss])

  if (!toast) return null

  const colours =
    toast.type === 'success' ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200' :
    toast.type === 'warn'    ? 'bg-amber-950/30 border-amber-800/40 text-amber-200' :
                               'bg-rose-950/30 border-rose-800/40 text-rose-200'

  const icon =
    toast.type === 'success' ? <Check size={16} /> :
    toast.type === 'warn'    ? <span className="text-base leading-none">!</span> :
                               <X size={16} />

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${colours}`}>
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="text-sm font-semibold">{toast.title}</p>
        <p className="mt-0.5 text-xs opacity-70">{toast.message}</p>
      </div>
    </div>
  )
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6">
      <div
        className="w-full max-w-sm rounded-[2rem] border border-white/8 bg-slate-900 p-8 shadow-[0_32px_80px_rgba(0,0,0,0.7)]"
        style={shake ? { animation: 'shake 0.5s ease' } : {}}
      >
        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.1rem] bg-gradient-to-tr from-teal-600 to-emerald-500 shadow-[0_12px_32px_rgba(20,184,166,0.35)]">
            <ShieldCheck size={26} className="text-slate-950" />
          </div>
        </div>
        <h1 className="mb-1 text-center text-xl font-bold tracking-tight text-white">Internal access</h1>
        <p className="mb-8 text-center text-sm text-slate-400">Enter the 8-digit PIN to continue</p>

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
                'h-12 w-10 rounded-xl border bg-slate-950 text-center text-lg font-bold caret-transparent text-white outline-none transition-all duration-150',
                digit   ? 'border-teal-500/60 shadow-[0_0_0_2px_rgba(20,184,166,0.15)]' : 'border-slate-700',
                error   ? 'border-rose-500/70' : '',
                'focus:border-teal-400/80 focus:shadow-[0_0_0_3px_rgba(20,184,166,0.18)]',
              ].join(' ')}
            />
          ))}
        </div>

        {error && <p className="mt-4 text-center text-sm font-medium text-rose-400">Incorrect PIN — try again</p>}
        <p className="mt-8 text-center text-xs text-slate-600">TruCycle · Internal tools · Not indexed</p>
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

// ── Vision sandbox ─────────────────────────────────────────────────────────────

type StatusPulse = 'idle' | 'running' | 'success' | 'error' | 'warn'
type ResultData  = Record<string, unknown>

interface WorkerResponse {
  success: boolean
  data?:   ResultData
  raw?:    string
  error?:  string
  model?:  string
}

const PRESETS = [
  { icon: '👕', label: 'Apparel Audit',    prompt: 'Detailed clothing evaluation: Identify garment type, precise materials, wear tier, and reusable status.' },
  { icon: '🛋️', label: 'Furniture Audit', prompt: 'Analyze this furniture piece. Look for structural damage, fabric tearing, cleanliness, and determine category.' },
  { icon: '🍽️', label: 'Household items', prompt: 'Identify any household items or kitchenware visible. Assess material degradation and structural soundness.' },
]

function pulseClass(s: StatusPulse) {
  if (s === 'running') return 'bg-yellow-400 animate-ping'
  if (s === 'success') return 'bg-emerald-400 animate-pulse'
  if (s === 'error')   return 'bg-rose-500 animate-pulse'
  if (s === 'warn')    return 'bg-amber-400 animate-pulse'
  return 'bg-slate-600 animate-pulse'
}

function conditionStyle(c: string): { cls: string; label: string } {
  const lc = c.toLowerCase()
  if (lc.includes('excellent') || lc.includes('good')) return { cls: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/30', label: 'Resellable' }
  if (lc.includes('fair'))                              return { cls: 'bg-amber-950/40 text-amber-400 border-amber-800/30',     label: 'Repairable' }
  return                                                       { cls: 'bg-rose-950/40 text-rose-400 border-rose-800/30',         label: 'Downcycle'  }
}

function VisionTool() {
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
  const [toast, setToast]         = useState<{ title: string; message: string; type: 'success'|'error'|'warn' } | null>(null)
  const [copied, setCopied]       = useState(false)

  const notify = useCallback((title: string, message: string, type: 'success'|'error'|'warn' = 'success') => {
    setToast({ title, message, type })
  }, [])

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      notify('Format rejected', 'Please select a valid image file (.jpg, .png, .webp).', 'error')
      return
    }
    setRawSize(fmtMb(file.size))
    setRawFile(file)
    setResponse(null)
    setStatus('idle')

    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)

    try {
      const compressed = await compressImage(file)
      setBlob(compressed)
      setCmpSize(fmtMb(compressed.size))
      notify('Image ready', `Compressed to ${fmtMb(compressed.size)} — ready to analyse.`, 'success')
    } catch {
      notify('Compression failed', 'Could not optimise the image.', 'error')
      setBlob(null)
    }
  }, [notify])

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
    if (!blob) { notify('No image', 'Please upload an image first.', 'error'); return }
    if (!workerUrl.trim()) { notify('Worker URL missing', 'Enter your Cloudflare Worker URL.', 'error'); return }

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
        notify('Analysis complete', `Items categorised in ${ms}s.`, 'success')
      } else if (data.success && data.raw) {
        setStatus('warn')
        notify('Partial match', 'Result returned as plain text — check raw logs.', 'warn')
      } else {
        setStatus('error')
        notify('Inference failure', data.error ?? 'Unknown error from worker.', 'error')
      }
    } catch (err) {
      setStatus('error')
      notify('Network error', err instanceof Error ? err.message : 'Fetch failed.', 'error')
    } finally {
      setLoading(false)
    }
  }, [blob, workerUrl, prompt, notify])

  const copyJson = useCallback(() => {
    const text = response ? JSON.stringify(response, null, 2) : '{}'
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      notify('Copied', 'Raw JSON copied to clipboard.', 'success')
      setTimeout(() => setCopied(false), 2000)
    })
  }, [response, notify])

  const data = response?.data

  const condition = String(data?.condition ?? data?.estimated_wear_tier ?? '-')
  const isReusable = data?.reusable !== undefined ? Boolean(data.reusable) : Boolean(data?.uk_recycling_eligibility)
  const cStyle = data ? conditionStyle(condition) : null

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-teal-500 selection:text-slate-950">

      {/* Sticky header */}
      <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/60 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 shadow-lg shadow-teal-500/10">
              <Cpu size={20} className="text-slate-950" />
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-xl font-bold tracking-tight text-transparent">
                TruCycle
              </h1>
              <p className="text-xs font-medium text-slate-400">Vision Evaluation Sandbox v2.0</p>
            </div>
          </div>

          <div className="flex w-full max-w-md items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/80 p-1.5">
            <span className="px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Worker:</span>
            <input
              value={workerUrl}
              onChange={(e) => setWorkerUrl(e.target.value)}
              className="w-full rounded bg-slate-900 px-2.5 py-1 text-xs font-semibold text-teal-300 outline-none focus:ring-1 focus:ring-teal-500/50"
              placeholder="https://your-worker.workers.dev/"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">

          {/* ── Left panel (5 cols) ─────────────────────────────────────── */}
          <div className="space-y-5 lg:col-span-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
              <h2 className="mb-5 flex items-center gap-2 text-lg font-bold text-slate-200">
                <span className="text-teal-400">+</span> Upload &amp; Configure
              </h2>

              {/* Drop zone */}
              <div className="mb-5">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Garment / Item Photo
                </label>
                <div
                  className="relative flex min-h-[180px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-700 bg-slate-950/40 transition-all hover:border-teal-500/60 hover:bg-slate-950/80"
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
                        className="absolute right-2 top-2 z-10 rounded-full border border-slate-700/80 bg-slate-900/90 p-1.5 text-slate-400 backdrop-blur-sm transition-colors hover:text-rose-400"
                      >
                        <X size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); document.getElementById('tc-file-input')?.click() }}
                        className="relative z-10 rounded-full border border-white/20 bg-black/50 px-4 py-2 text-sm font-medium text-white backdrop-blur"
                      >
                        Click to change
                      </button>
                    </>
                  ) : (
                    <div className="pointer-events-none space-y-2 text-center transition-transform duration-200 group-hover:scale-105">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-slate-800 bg-slate-900 text-slate-400">
                        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-sm">
                        <span className="font-semibold text-teal-400">Click to upload</span>
                        <span className="text-slate-400"> or drag and drop</span>
                      </p>
                      <p className="text-xs font-medium text-slate-500">Auto-compressed in-browser</p>
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
                  <div className="mt-2 flex items-center justify-between rounded-md border border-slate-800/80 bg-slate-950/60 px-2.5 py-1 text-xs font-semibold text-slate-400">
                    <span>Raw: <span className="text-white">{rawSize}</span></span>
                    {cmpSize
                      ? <span className="text-emerald-400">Compressed: {cmpSize} ✓</span>
                      : <span className="text-amber-400 animate-pulse">Compressing…</span>}
                  </div>
                )}
              </div>

              {/* Prompt */}
              <div className="mb-5">
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Analysis Prompt</label>
                  <span className="text-[10px] font-bold text-slate-500">Llama-3.2 Vision</span>
                </div>
                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what attributes you are looking for…"
                  className="w-full resize-none rounded-xl border border-slate-800 bg-slate-950 px-3 py-3 text-sm text-slate-200 placeholder-slate-600 outline-none transition-colors focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50"
                />
              </div>

              {/* Presets */}
              <div className="mb-6">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Preset Quick Actions</span>
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => { setPrompt(p.prompt); notify('Prompt configured', `${p.label} template loaded.`, 'success') }}
                      className="rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-[11px] font-semibold text-slate-300 transition-colors hover:border-slate-700 hover:text-white"
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
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 py-3.5 font-bold text-slate-950 shadow-lg transition-all hover:from-teal-400 hover:to-emerald-300 hover:shadow-teal-500/10 disabled:from-slate-800 disabled:to-slate-800 disabled:cursor-not-allowed disabled:text-slate-500"
              >
                {loading
                  ? <><Loader2 size={18} className="animate-spin" /> Analyzing assets…</>
                  : blob ? 'Run auditing pipeline' : 'Select an image first'}
              </button>
            </div>

            {/* Toast */}
            <Toast toast={toast} onDismiss={() => setToast(null)} />
          </div>

          {/* ── Right panel (7 cols) ─────────────────────────────────────── */}
          <div className="space-y-6 lg:col-span-7">
            <div className="relative flex min-h-[450px] flex-col rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">

              {/* Panel header */}
              <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
                <h2 className="flex items-center gap-2 text-lg font-bold text-slate-200">
                  <span className={`inline-block h-2.5 w-2.5 rounded-full ${pulseClass(status)}`} />
                  Recycling Analysis Results
                </h2>
                <span className="rounded border border-slate-800/80 bg-slate-950/60 px-2.5 py-1 font-mono text-xs text-slate-400">
                  {latency} latency
                </span>
              </div>

              {/* Empty state */}
              {!response && (
                <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800/60 bg-slate-950 text-slate-600">
                    <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-300">Awaiting Analysis Parameters</h3>
                  <p className="mt-1 max-w-xs text-xs text-slate-500">Upload an image and submit to trigger Cloudflare Workers AI edge prediction.</p>
                </div>
              )}

              {/* Error state */}
              {response && !response.success && (
                <div className="flex-1 space-y-4">
                  <div className="rounded-xl border border-rose-800/40 bg-rose-950/20 p-4">
                    <p className="text-sm font-semibold text-rose-400">Worker returned an error</p>
                    <p className="mt-1 font-mono text-xs text-rose-400/70">{response.error}</p>
                    {response.model && <p className="mt-2 text-[10px] text-slate-500">Model: {response.model}</p>}
                  </div>
                </div>
              )}

              {/* Rich results */}
              {response?.success && data && (
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* Item type */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Identified Item Type</span>
                      <span className="text-base font-bold capitalize text-white">
                        {String(data.item_type ?? data.garment_type ?? '-')}
                      </span>
                    </div>

                    {/* Category */}
                    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Suggested Stream Category</span>
                      <span className="text-sm font-bold text-teal-400">
                        {String(data.suggested_category ?? '-')}
                      </span>
                    </div>

                    {/* Condition */}
                    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <div>
                        <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Structural Condition</span>
                        <span className="text-base font-bold text-white">{condition}</span>
                      </div>
                      {cStyle && (
                        <div className={`flex h-8 items-center rounded-lg border px-3 text-xs font-bold uppercase tracking-wider ${cStyle.cls}`}>
                          {cStyle.label}
                        </div>
                      )}
                    </div>

                    {/* Reusability */}
                    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                      <div>
                        <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Reusability Status</span>
                        <span className="text-base font-bold text-white">
                          {isReusable ? 'Yes — Eligible' : 'No — Excluded'}
                        </span>
                      </div>
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full border ${isReusable ? 'border-emerald-800/30 bg-emerald-950 text-emerald-400' : 'border-rose-800/30 bg-rose-950 text-rose-400'}`}>
                        {isReusable
                          ? <Check size={16} strokeWidth={2.5} />
                          : <X     size={16} strokeWidth={2.5} />}
                      </div>
                    </div>
                  </div>

                  {/* Material */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Material Composition</span>
                    <p className="text-sm font-medium leading-relaxed text-slate-300">
                      {String(data.material_composition ?? 'Evaluated by image pixel analysis directly.')}
                    </p>
                  </div>

                  {/* Notes */}
                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                    <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">AI Auditing Notes</span>
                    <p className="text-sm font-medium italic leading-relaxed text-slate-300">
                      "{String(data.notes ?? '-')}"
                    </p>
                  </div>
                </div>
              )}

              {/* Raw partial text */}
              {response?.success && response.raw && !data && (
                <div className="flex-1 space-y-3">
                  <div className="rounded-xl border border-amber-800/30 bg-amber-950/20 p-3">
                    <p className="text-xs font-semibold text-amber-400">Model returned plain text — JSON extraction failed</p>
                  </div>
                  <pre className="max-h-48 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs leading-6 text-slate-400">
                    {response.raw}
                  </pre>
                </div>
              )}

              {/* Raw JSON + copy */}
              <div className="mt-auto border-t border-slate-800 pt-5">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Edge Response Payload (Raw JSON)</h3>
                  <button
                    type="button"
                    onClick={copyJson}
                    className="flex items-center gap-1.5 rounded border border-slate-800 px-2 py-1 text-xs font-semibold text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
                  >
                    {copied ? <Check size={12} /> : <Clipboard size={12} />}
                    {copied ? 'Copied!' : 'Copy JSON'}
                  </button>
                </div>
                <pre className="max-h-44 select-all overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-500">
                  {response ? JSON.stringify(response, null, 2) : '{}'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="mx-auto mt-12 max-w-7xl border-t border-slate-900 px-6 py-8 text-center text-xs text-slate-600">
        © 2026 TruCycle Ltd. All Rights Reserved. Interfaces with Cloudflare Workers AI · Llama 3.2 Vision.
      </footer>

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
