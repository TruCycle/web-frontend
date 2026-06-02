import { useEffect, useRef, useState } from 'react'
import { Cpu, Loader2, ScanLine, ShieldCheck } from 'lucide-react'

const CORRECT_PIN = import.meta.env.VITE_INTERNAL_PIN ?? '12345678'
const SESSION_KEY = 'tc_internal_vision_unlocked'

// Prevent search-engine indexing for this page
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

// ── PIN gate ──────────────────────────────────────────────────────────────────

function PinGate({ onUnlock }: { readonly onUnlock: () => void }) {
  const [digits, setDigits] = useState<string[]>(Array(8).fill(''))
  const [error, setError] = useState(false)
  const [shaking, setShaking] = useState(false)
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const next = [...digits]
    next[index] = value.slice(-1)
    setDigits(next)
    setError(false)
    if (value && index < 7) refs.current[index + 1]?.focus()
    if (next.every(Boolean)) verify(next.join(''))
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 8)
    if (!pasted) return
    e.preventDefault()
    const next = Array(8).fill('')
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setDigits(next)
    if (pasted.length === 8) verify(pasted)
    else refs.current[pasted.length]?.focus()
  }

  const verify = (pin: string) => {
    if (pin === CORRECT_PIN) {
      sessionStorage.setItem(SESSION_KEY, '1')
      onUnlock()
    } else {
      setError(true)
      setShaking(true)
      setDigits(Array(8).fill(''))
      setTimeout(() => { setShaking(false); refs.current[0]?.focus() }, 600)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#121212] px-6">
      <div
        className={`w-full max-w-sm rounded-[2rem] border border-white/8 bg-[#1A1A1A] p-8 shadow-[0_32px_80px_rgba(0,0,0,0.6)] ${shaking ? 'animate-[shake_0.5s_ease]' : ''}`}
        style={shaking ? { animation: 'shake 0.5s ease' } : {}}
      >
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.1rem] bg-[#0D3B24] shadow-[0_12px_32px_rgba(13,59,36,0.45)]">
            <ShieldCheck size={26} className="text-[#A4F5A6]" />
          </div>
        </div>

        <h1 className="mb-1 text-center text-xl font-semibold text-white">Internal access</h1>
        <p className="mb-8 text-center text-sm text-white/45">Enter the 8-digit PIN to continue</p>

        {/* Digit inputs */}
        <div
          className="flex justify-center gap-2"
          onPaste={handlePaste}
        >
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
              className={`h-12 w-10 rounded-xl border text-center text-lg font-bold caret-transparent outline-none transition-all duration-150
                bg-[#242424] text-white
                ${digit ? 'border-[#A4F5A6]/60 shadow-[0_0_0_2px_rgba(164,245,166,0.15)]' : 'border-white/10'}
                ${error ? 'border-red-500/70' : ''}
                focus:border-[#A4F5A6]/80 focus:shadow-[0_0_0_3px_rgba(164,245,166,0.18)]`}
            />
          ))}
        </div>

        {error && (
          <p className="mt-4 text-center text-sm font-medium text-red-400">
            Incorrect PIN — try again
          </p>
        )}

        <p className="mt-8 text-center text-xs text-white/25">
          TruCycle · Internal tools · Not indexed
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px); }
          60%      { transform: translateX(-5px); }
          80%      { transform: translateX(5px); }
        }
      `}</style>
    </div>
  )
}

// ── Vision tool ───────────────────────────────────────────────────────────────

const WORKER_URL = 'https://imgrc.trucycle01.workers.dev/'

type AnalysisResult = Record<string, unknown>

function VisionTool() {
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = (file: File) => {
    setImage(file)
    setResult(null)
    setError(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type.startsWith('image/')) handleFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!image) return
    setLoading(true)
    setResult(null)
    setError(null)

    const formData = new FormData()
    formData.append('image', image)
    formData.append('prompt', prompt || 'Analyze this item for TruCycle.')

    try {
      const res = await fetch(WORKER_URL, { method: 'POST', body: formData })
      const json = (await res.json()) as AnalysisResult
      setResult(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#121212] px-4 pb-16 pt-12 text-white">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <div className="mb-10 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-[0.9rem] bg-[#0D3B24]">
            <Cpu size={22} className="text-[#A4F5A6]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-white">TruCycle Vision</h1>
              <span className="rounded-full bg-[#0D3B24] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#A4F5A6]">
                Internal
              </span>
            </div>
            <p className="text-sm text-white/40">AI item analysis · LLaVA 1.5 · Not indexed</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-[1.75rem] border border-white/8 bg-[#1A1A1A] shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6 p-7 sm:p-8">

            {/* Drop zone */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white/60">
                Item image
              </label>
              <label
                className="group relative flex h-52 cursor-pointer flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 border-dashed border-white/10 bg-[#212121] transition hover:border-[#A4F5A6]/40 hover:bg-[#252525]"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              >
                {preview ? (
                  <>
                    <img
                      src={preview}
                      alt="Preview"
                      className="absolute inset-0 h-full w-full object-cover opacity-60"
                    />
                    <div className="relative z-10 rounded-full bg-black/50 px-4 py-2 text-sm font-medium text-white backdrop-blur">
                      Click to change
                    </div>
                  </>
                ) : (
                  <>
                    <ScanLine size={32} className="text-white/20" />
                    <p className="text-sm text-white/35">
                      Drag & drop or <span className="text-[#A4F5A6]">browse</span>
                    </p>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFile(file)
                  }}
                />
              </label>
            </div>

            {/* Prompt */}
            <div>
              <label className="mb-2 block text-sm font-medium text-white/60">
                Custom prompt <span className="text-white/25">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Identify materials and check for stains..."
                className="w-full resize-none rounded-xl border border-white/10 bg-[#212121] px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-[#A4F5A6]/50 focus:ring-2 focus:ring-[#A4F5A6]/10"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!image || loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0D3B24] py-3.5 text-sm font-bold text-[#A4F5A6] transition hover:bg-[#0a2e1c] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Analysing…
                </>
              ) : (
                'Analyse item'
              )}
            </button>
          </form>

          {/* Result */}
          {(result ?? error) ? (
            <div className="border-t border-white/8 px-7 py-6 sm:px-8">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-white/30">
                Analysis result
              </p>
              {error ? (
                <p className="text-sm text-red-400">{error}</p>
              ) : result?.success === false ? (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <p className="text-sm font-semibold text-red-400">Worker error</p>
                  <p className="mt-1 text-xs text-red-400/70">{String(result.error)}</p>
                </div>
              ) : result?.data ? (
                <div className="space-y-3">
                  {Object.entries(result.data as Record<string, unknown>).map(([key, value]) => (
                    <div key={key} className="flex items-start justify-between gap-4 rounded-xl border border-white/6 bg-[#141414] px-4 py-3">
                      <span className="text-xs font-semibold uppercase tracking-wider text-white/35">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <span className={`text-right text-sm font-medium ${
                        value === true ? 'text-[#A4F5A6]' :
                        value === false ? 'text-red-400' :
                        value === 'Excellent' ? 'text-[#A4F5A6]' :
                        value === 'Good' ? 'text-[#D4A84B]' :
                        value === 'Fair' ? 'text-orange-400' :
                        value === 'Poor' || value === 'End-of-Life' ? 'text-red-400' :
                        'text-white'
                      }`}>
                        {String(value)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : result?.raw ? (
                <pre className="overflow-x-auto rounded-xl border border-white/8 bg-[#141414] p-4 text-xs leading-6 text-white/60">
                  {String(result.raw)}
                </pre>
              ) : (
                <pre className="overflow-x-auto rounded-xl border border-white/8 bg-[#141414] p-4 text-xs leading-6 text-[#A4F5A6]">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </div>
          ) : null}
        </div>

        <p className="mt-8 text-center text-xs text-white/20">
          TruCycle · Internal · Not tracked · Not indexed
        </p>
      </div>
    </div>
  )
}

// ── Page root ─────────────────────────────────────────────────────────────────

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
