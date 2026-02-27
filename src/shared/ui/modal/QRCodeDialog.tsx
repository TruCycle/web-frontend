import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { Camera, CameraOff, QrCode } from 'lucide-react'
import { Modal } from './Modal'
import { Button } from '../button/Button'

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

interface QRCodeDialogProps {
  readonly isOpen: boolean
  readonly onClose: () => void
  readonly item?: unknown
  readonly onCollect: (payload: string) => Promise<void> | void
  readonly isCollecting?: boolean
}

function getBarcodeDetectorConstructor(): BarcodeDetectorConstructor | null {
  return 'BarcodeDetector' in window
    ? (window.BarcodeDetector as BarcodeDetectorConstructor)
    : null
}

export const QRCodeDialog = ({
  isOpen,
  onClose,
  onCollect,
  isCollecting = false,
}: QRCodeDialogProps) => {
  const [payload, setPayload] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRequestRef = useRef<number | null>(null)
  const isScanningRef = useRef(false)

  const barcodeDetector = useMemo(() => getBarcodeDetectorConstructor(), [])
  const hasCameraScanner = Boolean(barcodeDetector)

  const stopScanner = useCallback(() => {
    isScanningRef.current = false

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
    if (!hasCameraScanner || !barcodeDetector) {
      setScannerError(
        'Camera scan is not supported on this device. Paste QR payload manually.',
      )
      return
    }

    setScannerError(null)
    isScanningRef.current = true

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

      const detector = new barcodeDetector({ formats: ['qr_code'] })

      const scanFrame = async () => {
        if (!isScanningRef.current || !videoRef.current) {
          return
        }

        try {
          const results = await detector.detect(videoRef.current)
          const nextPayload = results[0]?.rawValue?.trim()
          if (nextPayload) {
            setPayload(nextPayload)
            setIsScanning(false)
            stopScanner()
            return
          }
        } catch {
          setScannerError('Unable to scan QR right now. You can paste it manually.')
        }

        frameRequestRef.current = window.requestAnimationFrame(() => {
          void scanFrame()
        })
      }

      frameRequestRef.current = window.requestAnimationFrame(() => {
        void scanFrame()
      })
    } catch {
      setScannerError(
        'Camera access was denied or unavailable. Paste QR payload manually.',
      )
      setIsScanning(false)
      stopScanner()
    }
  }, [barcodeDetector, hasCameraScanner, stopScanner])

  useEffect(
    () => () => {
      stopScanner()
    },
    [stopScanner],
  )

  const handleClose = () => {
    stopScanner()
    setIsScanning(false)
    setPayload('')
    setScannerError(null)
    onClose()
  }

  const handleToggleScanner = () => {
    if (isScanning) {
      setIsScanning(false)
      stopScanner()
      return
    }

    setIsScanning(true)
    void startScanner()
  }

  const handleCollect = async () => {
    const normalizedPayload = payload.trim()
    if (!normalizedPayload || isCollecting) {
      return
    }

    try {
      await onCollect(normalizedPayload)
    } catch {
      setScannerError('Collection could not be completed. Please try again.')
    }
  }

  const scannerFrameStyles: CSSProperties = {
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.2)',
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} position="center">
      <div className="flex flex-col gap-5 p-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Scan to collect</h2>
          <p className="mt-1 text-sm text-slate-500">
            Point your camera at the item QR. We&apos;ll register your collection
            automatically.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-center">
            <div
              className="relative h-[210px] w-[210px] overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-300 to-emerald-500"
              style={scannerFrameStyles}
            >
              {isScanning ? (
                <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <QrCode size={80} className="text-white" strokeWidth={1.5} />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-center">
            <Button
              className="min-w-[160px]"
              variant="secondary"
              disabled={!hasCameraScanner}
              onClick={handleToggleScanner}
            >
              {isScanning ? (
                <>
                  <CameraOff size={16} />
                  Stop Camera
                </>
              ) : (
                <>
                  <Camera size={16} />
                  Start Camera
                </>
              )}
            </Button>
          </div>

          {scannerError ? <p className="text-xs text-rose-600">{scannerError}</p> : null}
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            or enter manually
          </span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">QR payload or item id</label>
          <input
            type="text"
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-800 outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
            placeholder="Paste QR payload or UUID"
            value={payload}
            onChange={(event) => setPayload(event.target.value)}
          />
          <p className="text-xs leading-5 text-slate-500">
            We&apos;ll attempt one collection per scan to avoid duplicates. You can
            scan again if needed.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button className="min-w-[110px]" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            className="min-w-[110px]"
            disabled={!payload.trim() || isCollecting}
            onClick={() => {
              void handleCollect()
            }}
          >
            {isCollecting ? 'Collecting...' : 'Collect'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
