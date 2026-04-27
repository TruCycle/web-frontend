import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react'
import { Camera, RotateCw, Upload, X } from 'lucide-react'
import { Button } from '@/shared/ui/button/Button'

interface CameraCaptureProps {
  readonly onCapture: (file: File) => void
  readonly onCancel: () => void
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
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

  return (
    <div className="space-y-3 rounded-2xl bg-slate-950 p-3 text-white">
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
