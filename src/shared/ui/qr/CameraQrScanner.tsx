import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { QrCode } from 'lucide-react'
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
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRequestRef = useRef<number | null>(null)
  const isRunningRef = useRef(false)
  const barcodeDetector = useMemo(() => getBarcodeDetectorConstructor(), [])
  const hasCameraScanner = Boolean(barcodeDetector)

  const stopScanner = useCallback(() => {
    isRunningRef.current = false
    setIsLive(false)

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
  }, [])

  const startScanner = useCallback(async () => {
    if (!isActive) {
      return
    }

    if (!hasCameraScanner || !barcodeDetector) {
      onError?.('Camera scan is not supported on this device. Paste QR payload manually.')
      return
    }

    isRunningRef.current = true

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream

      if (!videoRef.current) {
        return
      }

      videoRef.current.srcObject = stream
      await videoRef.current.play()
      setIsLive(true)

      const detector = new barcodeDetector({ formats: ['qr_code'] })
      const scanFrame = async () => {
        if (!isRunningRef.current || !videoRef.current) {
          return
        }

        try {
          const results = await detector.detect(videoRef.current)
          const nextPayload = results[0]?.rawValue?.trim()
          if (nextPayload) {
            onDetected(nextPayload)
            stopScanner()
            return
          }
        } catch {
          onError?.('Unable to scan QR right now. You can paste it manually.')
        }

        frameRequestRef.current = window.requestAnimationFrame(() => {
          void scanFrame()
        })
      }

      frameRequestRef.current = window.requestAnimationFrame(() => {
        void scanFrame()
      })
    } catch {
      onError?.('Camera access was denied or unavailable. Paste QR payload manually.')
      stopScanner()
    }
  }, [barcodeDetector, hasCameraScanner, isActive, onDetected, onError, stopScanner])

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
      {isLive ? (
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <QrCode size={80} className="text-white" strokeWidth={1.5} />
        </div>
      )}
    </div>
  )
}
