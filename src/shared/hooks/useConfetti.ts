import confetti from 'canvas-confetti'
import { useCallback, useEffect, useRef } from 'react'

export function useConfetti() {
  const active = useRef<{ canvas: HTMLCanvasElement; fire: confetti.CreateTypes } | null>(null)
  useEffect(() => () => {
    active.current?.fire.reset()
    active.current?.canvas.remove()
    active.current = null
  }, [])

  const fireMilestone = useCallback(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!active.current) {
      const canvas = document.createElement('canvas')
      canvas.setAttribute('aria-hidden', 'true')
      Object.assign(canvas.style, { position: 'fixed', inset: '0', width: '100%', height: '100%', pointerEvents: 'none', zIndex: '20' })
      document.body.appendChild(canvas)
      active.current = { canvas, fire: confetti.create(canvas, { resize: true, useWorker: false }) }
    }
    const effect = active.current
    const release = () => {
      if (active.current !== effect) return
      effect.fire.reset()
      effect.canvas.remove()
      active.current = null
    }
    const completion = effect.fire({
      particleCount: 120,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#232323', '#8EE3A8', '#DDF4E3', '#FFFFFF'],
      disableForReducedMotion: true,
    })
    if (completion) void completion.then(release, release)
    else release()
  }, [])

  return { fireMilestone }
}
