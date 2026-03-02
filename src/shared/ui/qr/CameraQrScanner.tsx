import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

export function CameraQrScanner({
  isActive = true,
  onDetected,
  onError,
  className,
}: CameraQrScannerProps) {
  const [isLive, setIsLive] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRequestRef = useRef<number | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isRunningRef = useRef(false)
  const hasScanErrorRef = useRef(false)
  const barcodeDetector = useMemo(() => getBarcodeDetectorConstructor(), [])

  const stopScanner = useCallback(() => {
    isRunningRef.current = false
    setIsLive(false)
    setStatusMessage(null)
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

  const startScanner = useCallback(async () => {
    if (!isActive) {
      return
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const message = 'Camera access is not available in this browser.'
      setStatusMessage(message)
      onError?.(message)
      return
    }

    isRunningRef.current = true
    hasScanErrorRef.current = false
    setStatusMessage('Connecting camera...')

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      if (!isRunningRef.current) {
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

      if (!isRunningRef.current) {
        stream.getTracks().forEach((track) => track.stop())
        return
      }

      setIsLive(true)
      setStatusMessage(null)

      const detector = barcodeDetector
        ? new barcodeDetector({ formats: ['qr_code'] })
        : null

      const scanFrame = async () => {
        if (!isRunningRef.current || !videoRef.current) {
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
            if (!isRunningRef.current) {
              return
            }
            const message = 'Unable to scan QR right now. Please try again.'
            onError?.(message)
            setStatusMessage(message)
            hasScanErrorRef.current = true
          }
        }

        if (nextPayload) {
          onDetected(nextPayload)
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
    } catch {
      if (!isRunningRef.current) {
        return
      }
      const message = 'Camera access was denied or unavailable.'
      onError?.(message)
      setStatusMessage(message)
      stopScanner()
    }
  }, [barcodeDetector, decodeWithJsQr, isActive, onDetected, onError, stopScanner])

  useEffect(() => {
    if (!isActive) {
      stopScanner()
      return
    }

    void startScanner()
    return () => {
      stopScanner()
    }
  }, [isActive, startScanner, stopScanner])

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
