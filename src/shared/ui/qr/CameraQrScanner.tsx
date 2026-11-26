import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from 'react'
import jsQR from 'jsqr'
import { classNames } from '@/shared/utils/classNames'

interface BarcodeDetectorInstance {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>
}

interface BarcodeDetectorConstructor {
  new (options?: { formats?: string[] }): BarcodeDetectorInstance
}

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor
  }
}

interface CameraQrScannerProps {
  readonly isActive?: boolean
  readonly onDetected: (payload: string) => void
  readonly onError?: (message: string) => void
  readonly className?: string
}

function getBarcodeDetectorConstructor(): BarcodeDetectorConstructor | null {
  if (typeof window === 'undefined') {
    return null
  }

  return 'BarcodeDetector' in window
    ? (window.BarcodeDetector as BarcodeDetectorConstructor)
    : null
}

export function CameraQrScanner(props: CameraQrScannerProps) {
  return <CameraQrScannerSession key={(props.isActive ?? true) ? 'active' : 'inactive'} {...props} />
}

function CameraQrScannerSession({
  isActive = true,
  onDetected,
  onError,
  className,
}: CameraQrScannerProps) {
  const [isLive, setIsLive] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(() => {
    if (!isActive) return null
    return typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function'
      ? 'Connecting camera...'
      : 'Camera access is not available in this browser.'
  })
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRequestRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isRunningRef = useRef(false)
  const hasScanErrorRef = useRef(false)
  const generationRef = useRef(0)
  const barcodeDetector = useMemo(() => getBarcodeDetectorConstructor(), [])
  const notifyDetected = useEffectEvent(onDetected)
  const notifyError = useEffectEvent((message: string) => onError?.(message))

  const stopScanner = useCallback(() => {
    generationRef.current += 1
    isRunningRef.current = false
    hasScanErrorRef.current = false

    if (frameRequestRef.current !== null) {
      window.cancelAnimationFrame(frameRequestRef.current)
      frameRequestRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    canvasRef.current = null
  }, [])

  const decodeWithJsQr = useCallback((videoElement: HTMLVideoElement): string | null => {
    if (videoElement.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
      return null
    }

    const width = videoElement.videoWidth
    const height = videoElement.videoHeight
    if (!width || !height) {
      return null
    }

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas')
    }

    const canvas = canvasRef.current
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }

    const context = canvas.getContext('2d')
    if (!context) {
      return null
    }

    context.drawImage(videoElement, 0, 0, width, height)
    const imageData = context.getImageData(0, 0, width, height)
    const result = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: 'dontInvert',
    })

    return result?.data?.trim() ?? null
  }, [])

  useEffect(() => {
    if (!isActive) {
      return
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const message = 'Camera access is not available in this browser.'
      notifyError(message)
      return
    }

    isRunningRef.current = true
    const generation = ++generationRef.current
    hasScanErrorRef.current = false

    void navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    }).then(async (stream) => {
      if (!isRunningRef.current || generationRef.current !== generation) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      if (!videoRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()

      if (!isRunningRef.current || generationRef.current !== generation) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      setIsLive(true)
      setStatusMessage(null)

      const detector = barcodeDetector
        ? new barcodeDetector({ formats: ['qr_code'] })
        : null

      const scanFrame = async () => {
        if (!isRunningRef.current || generationRef.current !== generation || !videoRef.current) {
          return
        }

        let nextPayload: string | null = null
        try {
          if (detector) {
            const results = await detector.detect(videoRef.current)
            nextPayload = results[0]?.rawValue?.trim() ?? null
          }

          if (!nextPayload) {
            nextPayload = decodeWithJsQr(videoRef.current)
          }
        } catch {
          if (!hasScanErrorRef.current) {
            if (!isRunningRef.current || generationRef.current !== generation) {
              return
            }
            const message = 'Unable to scan QR right now. Please try again.'
            notifyError(message)
            setStatusMessage(message)
            hasScanErrorRef.current = true
          }
        }

        if (!isRunningRef.current || generationRef.current !== generation) return

        if (nextPayload) {
          setIsLive(false)
          setStatusMessage(null)
          notifyDetected(nextPayload)
          stopScanner()
          return
        }

        frameRequestRef.current = window.requestAnimationFrame(() => {
          void scanFrame()
        })
      }

      frameRequestRef.current = window.requestAnimationFrame(() => {
        void scanFrame()
      })
    }).catch((error: unknown) => {
      if (!isRunningRef.current || generationRef.current !== generation) {
        return
      }

      const errorName =
        typeof error === 'object' &&
        error !== null &&
        'name' in error &&
        typeof (error as { name?: unknown }).name === 'string'
          ? ((error as { name: string }).name ?? '')
          : ''

      if (errorName === 'AbortError') {
        return
      }

      const message =
        errorName === 'NotAllowedError' || errorName === 'SecurityError'
          ? 'Camera permission was denied. Please allow camera access and try again.'
          : errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError'
            ? 'No camera was found on this device.'
            : errorName === 'NotReadableError' || errorName === 'TrackStartError'
              ? 'Camera is currently unavailable. Close other camera apps and retry.'
              : 'Unable to start camera right now. Please try again.'
      notifyError(message)
      setIsLive(false)
      setStatusMessage(message)
      stopScanner()
    })
    return () => {
      stopScanner()
    }
  }, [barcodeDetector, decodeWithJsQr, isActive, stopScanner])

  return (
    <div
      className={classNames(
        'relative h-[210px] w-[210px] overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-300 to-emerald-500',
        className,
      )}
      style={{ boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)' }}
    >
      <video
        ref={videoRef}
        className={classNames(
          'h-full w-full object-cover transition-opacity duration-200',
          isLive ? 'opacity-100' : 'opacity-0',
        )}
        muted
        playsInline
        autoPlay
      />
      {!isLive && statusMessage ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0000004D] px-4 text-center text-xs font-medium text-white">
          {statusMessage}
        </div>
      ) : null}
    </div>
  )
}
