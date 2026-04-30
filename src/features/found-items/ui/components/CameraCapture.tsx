import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Camera, LoaderCircle, MapPin, RotateCw, Upload, X } from 'lucide-react'
import { Button } from '@/shared/ui/button/Button'
import { classNames } from '@/shared/utils/classNames'

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
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [error, setError] = useState<string | null>(null)

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Camera access is not available in this browser.')
      return
    }

    try {
      stopCamera()

      let mediaStream: MediaStream
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: facingMode } },
          audio: false,
        })
      } catch {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        })
      }

      if (!videoRef.current) {
        mediaStream.getTracks().forEach((track) => track.stop())
        return
      }

      streamRef.current = mediaStream
      videoRef.current.srcObject = mediaStream
      await videoRef.current.play()
      setError(null)
    } catch {
      stopCamera()
      setError('Unable to access camera. Please allow permissions or upload instead.')
    }
  }, [facingMode, stopCamera])

  useEffect(() => {
    void startCamera()

    return () => {
      stopCamera()
    }
  }, [startCamera, stopCamera])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      return
    }

    const videoElement = videoRef.current
    const canvasElement = canvasRef.current
    canvasElement.width = videoElement.videoWidth
    canvasElement.height = videoElement.videoHeight

    const context = canvasElement.getContext('2d')
    if (!context) {
      return
    }

    context.drawImage(videoElement, 0, 0)
    canvasElement.toBlob(
      (blob) => {
        if (!blob) {
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
  }, [onCapture, stopCamera])

  const onSwitchCamera = useCallback(() => {
    setFacingMode((currentFacingMode) =>
      currentFacingMode === 'environment' ? 'user' : 'environment',
    )
  }, [])

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
              <Button type="button" variant="secondary" onClick={() => void startCamera()}>
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
              <div className="overflow-hidden rounded-[36px] bg-black shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="aspect-[3/4] w-full object-cover"
                />
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
            </div>
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
          <div className="overflow-hidden rounded-2xl bg-black">
            <video ref={videoRef} autoPlay playsInline muted className="h-[320px] w-full object-cover" />
          </div>

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
