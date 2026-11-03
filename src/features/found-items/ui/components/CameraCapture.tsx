import { useCallback, useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent, type PointerEvent } from 'react'
import { Camera, Image as ImageIcon, LoaderCircle, MapPin, RotateCw, Upload, X } from 'lucide-react'
import { Button } from '@/shared/ui/button/Button'
import { classNames } from '@/shared/utils/classNames'
import { INITIAL_CAMERA_TRANSFORM, resolveCameraFrame, zoomCameraAt, type CameraTransform } from '@/features/found-items/lib/cameraFraming'

interface CameraCaptureProps {
  readonly onCapture: (file: File) => void
  readonly onCancel: () => void
  readonly variant?: 'card' | 'immersive'
  readonly statusLabel?: string | null
  readonly isBusy?: boolean
}

export function CameraCapture({
  onCapture,
  onCancel,
  variant = 'card',
  statusLabel = null,
  isBusy = false,
}: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const cameraGenerationRef = useRef(0)
  const captureGenerationRef = useRef(0)
  const frameRef = useRef<HTMLDivElement | null>(null)
  const pointersRef = useRef(new Map<number, { x: number; y: number }>())
  const [transform, setTransform] = useState<CameraTransform>(INITIAL_CAMERA_TRANSFORM)
  const [dimensions, setDimensions] = useState({ sourceWidth: 0, sourceHeight: 0, width: 0, height: 0 })
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [cameraAttempt, setCameraAttempt] = useState(0)
  const [error, setError] = useState<string | null>(() =>
    typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function'
      ? null
      : 'Camera access is not available in this browser.',
  )

  const stopCamera = useCallback(() => {
    // Retire both acquisition and encoding work even when the parent keeps this
    // component mounted after Cancel or gallery selection.
    cameraGenerationRef.current += 1
    captureGenerationRef.current += 1
    pointersRef.current.clear()
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  useEffect(() => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return
    }
    let isCurrent = true
    stopCamera()
    const generation = cameraGenerationRef.current
    const isActive = () => isCurrent && generation === cameraGenerationRef.current
    const request = navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: facingMode } },
      audio: false,
    })
    void request.catch((cause: unknown) => {
      // A cancelled request must not open another camera during fallback.
      if (!isActive()) throw cause
      return navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    }).then(async (mediaStream) => {
      if (!isActive() || !videoRef.current) {
        mediaStream.getTracks().forEach((track) => track.stop())
        return
      }
      streamRef.current = mediaStream
      videoRef.current.srcObject = mediaStream
      await videoRef.current.play()
      if (!isActive()) return
      setError(null)
    }).catch(() => {
      if (!isActive()) return
      stopCamera()
      setError('Unable to access camera. Please allow permissions or upload instead.')
    })
    return () => {
      isCurrent = false
      stopCamera()
    }
  }, [cameraAttempt, facingMode, stopCamera])

  useEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return
      setDimensions((current) => ({ ...current, width: entry.contentRect.width, height: entry.contentRect.height }))
    })
    observer.observe(frame)
    return () => observer.disconnect()
  }, [error, variant])

  const frame = resolveCameraFrame(dimensions.sourceWidth, dimensions.sourceHeight, dimensions.width, dimensions.height, transform)

  const updateZoom = (zoom: number) => {
    if (!frame || isBusy) return
    setTransform(zoomCameraAt(frame, zoom))
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const pointers = pointersRef.current
    if (!pointers.has(event.pointerId) || !frame || isBusy) return
    const previous = [...pointers.values()]
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const next = [...pointers.values()]
    const bounds = event.currentTarget.getBoundingClientRect()
    setTransform((current) => {
      const currentFrame = resolveCameraFrame(dimensions.sourceWidth, dimensions.sourceHeight, bounds.width, bounds.height, current)
      if (!currentFrame) return current
      if (next.length === 1) return { zoom: currentFrame.zoom,
        panX: currentFrame.panX + next[0].x - previous[0].x,
        panY: currentFrame.panY + next[0].y - previous[0].y }
      const distance = (points: typeof next) => Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y)
      const oldDistance = distance(previous)
      if (oldDistance < 1) return current
      const oldX = (previous[0].x + previous[1].x) / 2
      const oldY = (previous[0].y + previous[1].y) / 2
      const zoomed = zoomCameraAt(currentFrame, currentFrame.zoom * distance(next) / oldDistance,
        oldX - bounds.left - bounds.width / 2, oldY - bounds.top - bounds.height / 2)
      return { ...zoomed, panX: zoomed.panX + (next[0].x + next[1].x) / 2 - oldX,
        panY: zoomed.panY + (next[0].y + next[1].y) / 2 - oldY }
    })
  }

  const preview = <video ref={videoRef} autoPlay playsInline muted draggable={false}
    onLoadedMetadata={(event) => {
      const { videoWidth: sourceWidth, videoHeight: sourceHeight } = event.currentTarget
      setDimensions((current) => ({ ...current, sourceWidth, sourceHeight }))
      setTransform(INITIAL_CAMERA_TRANSFORM)
    }}
    onResize={(event) => {
      const { videoWidth: sourceWidth, videoHeight: sourceHeight } = event.currentTarget
      setDimensions((current) => ({ ...current, sourceWidth, sourceHeight }))
    }}
    className="pointer-events-none absolute left-1/2 top-1/2 max-w-none"
    style={frame ? { width: frame.width, height: frame.height, transform: `translate(-50%, -50%) translate(${frame.panX}px, ${frame.panY}px)` }
      : { width: '100%', height: '100%', objectFit: 'cover', transform: 'translate(-50%, -50%)' }} />

  const pointerHandlers = {
    tabIndex: 0,
    role: 'group',
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
      if (isBusy || !frame) return
      const movements: Record<string, readonly [number, number]> = {
        ArrowLeft: [-24, 0], ArrowRight: [24, 0], ArrowUp: [0, -24], ArrowDown: [0, 24],
      }
      const movement = movements[event.key]
      if (!movement) return
      event.preventDefault()
      setTransform({ zoom: frame.zoom, panX: frame.panX + movement[0], panY: frame.panY + movement[1] })
    },
    onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
      if (isBusy || pointersRef.current.size >= 2 || (event.pointerType === 'mouse' && event.button !== 0)) return
      event.currentTarget.setPointerCapture(event.pointerId)
      pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    },
    onPointerMove,
    onPointerUp: (event: PointerEvent<HTMLDivElement>) => { pointersRef.current.delete(event.pointerId) },
    onPointerCancel: (event: PointerEvent<HTMLDivElement>) => { pointersRef.current.delete(event.pointerId) },
    onLostPointerCapture: (event: PointerEvent<HTMLDivElement>) => { pointersRef.current.delete(event.pointerId) },
  }

  const framingControls = <div className="mt-3 space-y-2 px-2 text-xs text-white/80">
    <label className="flex items-center gap-3">
      <span>Frame zoom</span>
      <input aria-label="Frame zoom" type="range" min="1" max="4" step="0.05" value={frame?.zoom ?? 1}
        disabled={!frame || isBusy} onChange={(event) => updateZoom(Number(event.target.value))} className="min-w-0 flex-1" />
      <output className="min-w-10">{(frame?.zoom ?? 1).toFixed(1)}×</output>
    </label>
    <div className="flex items-center justify-between gap-3">
      <span>Drag or use arrow keys to reframe. Pinch or slide to zoom.</span>
      <button type="button" onClick={() => setTransform(INITIAL_CAMERA_TRANSFORM)} disabled={isBusy}
        className="shrink-0 rounded-md border border-white/30 px-2 py-1 disabled:opacity-50">Reset frame</button>
    </div>
  </div>

  const capturePhoto = useCallback(() => {
    if (isBusy || !streamRef.current || !videoRef.current || !canvasRef.current) {
      return
    }
    const generation = ++captureGenerationRef.current
    const stream = streamRef.current

    const videoElement = videoRef.current
    const canvasElement = canvasRef.current
    const sourceWidth = videoElement.videoWidth
    const sourceHeight = videoElement.videoHeight
    if (!sourceWidth || !sourceHeight) {
      return
    }

    const bounds = frameRef.current?.getBoundingClientRect()
    if (!bounds) return
    const capturedFrame = resolveCameraFrame(sourceWidth, sourceHeight, bounds.width, bounds.height, transform)
    if (!capturedFrame) return
    const { cropX, cropY, cropWidth, cropHeight } = capturedFrame
    // Preserve native source detail. Capture uses the same bounded source rect
    // as the CSS preview, independent of screen density; never upscale for DPR.
    canvasElement.width = Math.max(1, Math.round(cropWidth))
    canvasElement.height = Math.max(1, Math.round(cropHeight))

    const context = canvasElement.getContext('2d')
    if (!context) {
      return
    }

    context.drawImage(
      videoElement,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      canvasElement.width,
      canvasElement.height,
    )
    canvasElement.toBlob(
      (blob) => {
        if (!blob || generation !== captureGenerationRef.current || stream !== streamRef.current) {
          return
        }

        const nextFile = new File([blob], `found-item-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        })
        stopCamera()
        onCapture(nextFile)
      },
      'image/jpeg',
      0.92,
    )
  }, [isBusy, onCapture, stopCamera, transform])

  const onSwitchCamera = useCallback(() => {
    stopCamera()
    setFacingMode((currentFacingMode) =>
      currentFacingMode === 'environment' ? 'user' : 'environment',
    )
  }, [stopCamera])

  const onFileSelected = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0]
      if (!selectedFile) {
        return
      }

      stopCamera()
      onCapture(selectedFile)
    },
    [onCapture, stopCamera],
  )

  if (variant === 'immersive') {
    return (
      <div className="relative min-h-[100dvh] overflow-hidden bg-[#081008] px-4 pb-10 pt-4 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,221,100,0.12),transparent_46%)]" />

        <div className="relative z-10 flex items-center justify-between">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-white transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => {
              stopCamera()
              onCancel()
            }}
            aria-label="Close camera"
            disabled={isBusy}
          >
            <X size={18} />
          </button>

          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-white transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Upload image instead"
            disabled={isBusy}
          >
            <Upload size={18} />
          </button>
        </div>

        {error ? (
          <div className="relative z-10 flex min-h-[calc(100dvh-5rem)] flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="max-w-sm text-sm text-white/75">{error}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button type="button" variant="secondary" onClick={() => {
                if (typeof navigator.mediaDevices?.getUserMedia !== 'function') {
                  setError('Camera access is not available in this browser.')
                  return
                }
                setError(null)
                setCameraAttempt((attempt) => attempt + 1)
              }}>
                Retry camera
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={16} />
                Upload instead
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="relative z-10 mx-auto mt-6 w-full max-w-[430px]">
              <div ref={frameRef} {...pointerHandlers} aria-label="Camera framing area"
                className="relative aspect-[3/4] touch-none overflow-hidden rounded-[36px] bg-black shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
                {preview}
              </div>

              <div className="pointer-events-none absolute inset-5 rounded-[32px] border border-white/15" />
              <div className="pointer-events-none absolute inset-6">
                <span className="absolute left-0 top-0 h-6 w-6 rounded-tl-[12px] border-l-[3px] border-t-[3px] border-white/90" />
                <span className="absolute right-0 top-0 h-6 w-6 rounded-tr-[12px] border-r-[3px] border-t-[3px] border-white/90" />
                <span className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-[12px] border-b-[3px] border-l-[3px] border-white/90" />
                <span className="absolute bottom-0 right-0 h-6 w-6 rounded-br-[12px] border-b-[3px] border-r-[3px] border-white/90" />
              </div>

              {statusLabel ? (
                <div className="absolute bottom-10 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/75 px-3 py-2 text-[0.74rem] font-medium shadow-lg backdrop-blur-sm">
                  <MapPin size={12} className="text-white/70" />
                  <span>{statusLabel}</span>
                </div>
              ) : null}

              {isBusy ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-[36px] bg-black/55 backdrop-blur-sm">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white">
                    <LoaderCircle size={16} className="animate-spin" />
                    Uploading photo...
                  </div>
                </div>
              ) : null}
            </div>

            <div className="relative z-10 mx-auto w-full max-w-[430px]">{framingControls}</div>

            <div className="relative z-10 mt-10 flex items-center justify-center gap-5">
              <button
                type="button"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={onSwitchCamera}
                aria-label="Switch camera"
                disabled={isBusy}
              >
                <RotateCw size={18} />
              </button>

              <button
                type="button"
                className="inline-flex h-[86px] w-[86px] items-center justify-center rounded-full border-[8px] border-white bg-white/95 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
                onClick={capturePhoto}
                aria-label="Take photo"
                disabled={isBusy}
              >
                <span className="h-[58px] w-[58px] rounded-full bg-white shadow-[inset_0_0_0_2px_rgba(8,16,8,0.28)]" />
              </button>

              <button
                type="button"
                className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload from gallery"
                disabled={isBusy}
              >
                <ImageIcon size={18} />
              </button>
            </div>

            <p className="relative z-10 mt-4 text-center text-xs text-white/55">
              Take a photo or upload one from your gallery
            </p>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onFileSelected}
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>
    )
  }

  return (
    <div
      className={classNames(
        'space-y-3 rounded-2xl bg-slate-950 p-3 text-white',
        isBusy && 'pointer-events-none opacity-95',
      )}
    >
      {error ? (
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="max-w-sm text-sm text-white/80">{error}</p>
          <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload size={16} />
            Upload Instead
          </Button>
        </div>
      ) : (
        <>
          <div ref={frameRef} {...pointerHandlers} aria-label="Camera framing area"
            className="relative h-[320px] touch-none overflow-hidden rounded-2xl bg-black">
            {preview}
          </div>

          {framingControls}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                stopCamera()
                onCancel()
              }}
            >
              <X size={16} />
              Close Camera
            </Button>

            <div className="flex items-center gap-3">
              <Button type="button" variant="secondary" onClick={onSwitchCamera}>
                <RotateCw size={16} />
                Flip
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon size={16} />
                Gallery
              </Button>
              <Button type="button" variant="primary" onClick={capturePhoto}>
                <Camera size={16} />
                Take Photo
              </Button>
            </div>
          </div>

          {isBusy ? <p className="text-sm text-slate-500">Uploading image...</p> : null}
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileSelected}
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}
