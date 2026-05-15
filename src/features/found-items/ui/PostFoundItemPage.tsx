import {
  ArrowLeft,
  Check,
  ChevronRight,
  LoaderCircle,
  MapPin,
  Share2,
  Smartphone,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createFoundItem, fetchFoundItemCatalog, uploadFoundItemImage } from '../api/foundItemsApi'
import { classifyImageFile, warmUpClassifier } from '../lib/imageClassifier'
import { pickConfidentHint, type CatalogHint } from '../lib/labelToCatalog'
import { foundItemCategories } from '../types'
import { RescueShareCard } from './components/RescueShareCard'
import type {
  CreateFoundItemPayload,
  FoundItem,
  FoundItemCatalogEntry,
  FoundItemCategory,
} from '../types'
import { CameraCapture } from './components/CameraCapture'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { env } from '@/shared/lib/config/env'
import { Button } from '@/shared/ui/button/Button'
import { useToast } from '@/shared/ui/toast/useToast'
import { classNames } from '@/shared/utils/classNames'

type PostStep = 'capture' | 'details' | 'review' | 'success'

interface LocationPoint {
  readonly latitude: number
  readonly longitude: number
}

interface PinPosition {
  readonly x: number
  readonly y: number
}

const defaultPinPosition: PinPosition = { x: 0.5, y: 0.48 }

const categoryMeta: Record<
  FoundItemCategory,
  {
    readonly label: string
    readonly searchPlaceholder: string
  }
> = {
  furniture: {
    label: 'Furniture',
    searchPlaceholder: 'Search catalog, e.g. Armchair',
  },
  electronics: {
    label: 'Electronics',
    searchPlaceholder: 'Search catalog, e.g. TV',
  },
  clothing: {
    label: 'Clothing',
    searchPlaceholder: 'Catalog coverage coming soon',
  },
  books: {
    label: 'Books',
    searchPlaceholder: 'Catalog coverage coming soon',
  },
  appliances: {
    label: 'Appliances',
    searchPlaceholder: 'Search catalog, e.g. Washing machine',
  },
  outdoor: {
    label: 'Outdoor',
    searchPlaceholder: 'Search catalog, e.g. Bicycle',
  },
  toys: {
    label: 'Toys',
    searchPlaceholder: 'Catalog coverage coming soon',
  },
  other: {
    label: 'Other',
    searchPlaceholder: 'Search catalog, e.g. Exercise bike',
  },
}

const confettiPieces = [
  { left: '7%', top: '16%', rotate: -12, color: 'bg-[#9EDB7D]' },
  { left: '31%', top: '9%', rotate: 9, color: 'bg-[#7CC54D]' },
  { left: '63%', top: '23%', rotate: -14, color: 'bg-[#F0B23B]' },
  { left: '84%', top: '18%', rotate: 15, color: 'bg-[#5172E4]' },
  { left: '13%', top: '58%', rotate: -18, color: 'bg-[#8ACD73]' },
  { left: '47%', top: '67%', rotate: 4, color: 'bg-[#5A79E9]' },
  { left: '76%', top: '52%', rotate: 16, color: 'bg-[#9EDB7D]' },
  { left: '32%', top: '31%', rotate: -24, color: 'bg-[#EF5F5F]' },
] as const

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

function formatPostcode(value: string): string {
  return value.trim().toUpperCase()
}

function scaleCatalogMetric(metric: number, typicalWeightKg: number, resolvedWeightKg: number): number {
  if (!(typicalWeightKg > 0)) {
    return Math.max(0, Math.round(metric))
  }

  return Math.max(0, Math.round((metric / typicalWeightKg) * resolvedWeightKg))
}

function isSameCatalogEntry(
  left: FoundItemCatalogEntry | null,
  right: FoundItemCatalogEntry,
): boolean {
  if (!left) {
    return false
  }

  return (
    left.sourceCategory === right.sourceCategory &&
    left.subcategory === right.subcategory &&
    left.item === right.item
  )
}

function buildDescription(
  title: string,
  weightKg: number,
  postcode: string,
  isFlyTipped: boolean,
  notes: string,
): string {
  const parts = [`${title} spotted in ${postcode}.`, `Estimated weight ${weightKg}kg.`]

  if (isFlyTipped) {
    parts.push('Marked as fly-tipped so council diversion data can be shared.')
  }

  if (notes.trim()) {
    parts.push(notes.trim())
  }

  return parts.join(' ')
}

function DesktopOnlyNotice() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-14rem)] max-w-[560px] items-center justify-center px-4 py-8">
      <div className="w-full rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime-100 text-[#305B1D]">
          <Smartphone size={28} />
        </div>
        <h1 className="mt-6 text-2xl font-bold text-slate-900">Use a mobile device to post</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Found-item posting now uses the mobile camera and live GPS flow. Open this page on your
          phone to capture the item and lock the location.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/found-items"
            className="inline-flex items-center justify-center rounded-full bg-[#111611] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#1C241C]"
          >
            Back to found items
          </Link>
        </div>
      </div>
    </div>
  )
}

interface LocationPreviewCardProps {
  readonly postcode: string
  readonly pinPosition: PinPosition
  readonly onPinChange: (nextPosition: PinPosition) => void
}

function LocationPreviewCard({ postcode, pinPosition, onPinChange }: LocationPreviewCardProps) {
  const surfaceRef = useRef<HTMLDivElement | null>(null)
  const [activePointerId, setActivePointerId] = useState<number | null>(null)

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const surface = surfaceRef.current
      if (!surface) {
        return
      }

      const bounds = surface.getBoundingClientRect()
      const nextX = clamp((clientX - bounds.left) / bounds.width, 0.18, 0.82)
      const nextY = clamp((clientY - bounds.top) / bounds.height, 0.22, 0.78)
      onPinChange({ x: nextX, y: nextY })
    },
    [onPinChange],
  )

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    setActivePointerId(event.pointerId)
    event.currentTarget.setPointerCapture(event.pointerId)
    updateFromPointer(event.clientX, event.clientY)
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (activePointerId !== event.pointerId) {
      return
    }

    updateFromPointer(event.clientX, event.clientY)
  }

  const handlePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (activePointerId !== event.pointerId) {
      return
    }

    setActivePointerId(null)
    event.currentTarget.releasePointerCapture(event.pointerId)
  }

  return (
    <div
      ref={surfaceRef}
      className="relative overflow-hidden rounded-[24px] bg-[#EEF1E6] px-4 pb-4 pt-3"
    >
      <div className="absolute inset-x-[-10%] top-[56%] h-3 -translate-y-1/2 rounded-full bg-[#D3D8CC]" />
      <div className="absolute left-[43%] top-[-12%] h-[140%] w-6 rotate-[10deg] rounded-full bg-[#D7D9CF]" />
      <div className="absolute left-[19%] top-[18%] h-12 w-24 rounded-full bg-[#DCE8C4]" />
      <div className="absolute right-[16%] top-[26%] h-10 w-20 rounded-full bg-[#E5E8D8]" />

      <div className="relative flex justify-end">
        <span className="rounded-full bg-white/90 px-3 py-1 text-[0.72rem] font-medium text-slate-500 shadow-sm">
          drag pin to adjust
        </span>
      </div>

      <button
        type="button"
        className="absolute z-10 -translate-x-1/2 -translate-y-full touch-none cursor-grab active:cursor-grabbing"
        style={{ left: `${pinPosition.x * 100}%`, top: `${pinPosition.y * 100}%` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        aria-label="Adjust found item location"
      >
        <MapPin size={38} fill="#447D24" className="text-white drop-shadow-[0_8px_16px_rgba(0,0,0,0.25)]" />
      </button>

      <div className="relative mt-20 rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm w-fit">
        {postcode}
      </div>
    </div>
  )
}

export default function PostFoundItemPage() {
  const navigate = useNavigate()
  const isMobileViewport = useMediaQuery('(max-width: 767px)')
  const { user } = useAuthSession()
  const { success, error, info } = useToast()
  const [step, setStep] = useState<PostStep>('capture')
  const [category, setCategory] = useState<FoundItemCategory>('furniture')
  const [itemName, setItemName] = useState('')
  const [estimatedWeightKg, setEstimatedWeightKg] = useState('')
  const [hasEditedWeight, setHasEditedWeight] = useState(false)
  const [catalogEntries, setCatalogEntries] = useState<FoundItemCatalogEntry[]>([])
  const [selectedCatalogEntry, setSelectedCatalogEntry] = useState<FoundItemCatalogEntry | null>(null)
  const [supportedCatalogCategories, setSupportedCatalogCategories] = useState<FoundItemCategory[]>([])
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [isFlyTipped, setIsFlyTipped] = useState(false)
  const [notes, setNotes] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadedImageUrl, setUploadedImageUrl] = useState('')
  const [liveLocation, setLiveLocation] = useState<LocationPoint | null>(null)
  const [pinPosition, setPinPosition] = useState<PinPosition>(defaultPinPosition)
  const [isLocating, setIsLocating] = useState(true)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdItem, setCreatedItem] = useState<FoundItem | null>(null)
  const [smartHint, setSmartHint] = useState<CatalogHint | null>(null)
  const [isClassifying, setIsClassifying] = useState(false)

  const defaultPostcode = formatPostcode(user?.postcode?.trim() || env.defaultSearchPostcode)
  const actor = useMemo(
    () => ({
      id: user?.id ?? 'current-user',
      name: [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'You',
      avatarUrl: null,
    }),
    [user?.firstName, user?.id, user?.lastName],
  )

  useEffect(() => {
    let isMounted = true

    const loadCatalog = async () => {
      try {
        setIsLoadingCatalog(true)
        setCatalogError(null)
        const response = await fetchFoundItemCatalog(category, itemName, 8)
        if (!isMounted) {
          return
        }

        setSupportedCatalogCategories(response.supportedCategories)
        setCatalogEntries(response.entries)
        setSelectedCatalogEntry((currentEntry) => {
          if (currentEntry && response.entries.some((entry) => isSameCatalogEntry(currentEntry, entry))) {
            return currentEntry
          }

          return response.entries[0] ?? null
        })

        if (response.entries.length === 0) {
          setCatalogError('No carbon catalog matches yet. Try another search or supported category.')
        }
      } catch {
        if (!isMounted) {
          return
        }

        setCatalogEntries([])
        setSelectedCatalogEntry(null)
        setCatalogError('Unable to load the carbon catalog right now.')
      } finally {
        if (isMounted) {
          setIsLoadingCatalog(false)
        }
      }
    }

    void loadCatalog()

    return () => {
      isMounted = false
    }
  }, [category, itemName])

  useEffect(() => {
    if (!hasEditedWeight && selectedCatalogEntry) {
      setEstimatedWeightKg(String(selectedCatalogEntry.typicalWeightKg))
    }
  }, [hasEditedWeight, selectedCatalogEntry])

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const requestLiveLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLiveLocation(null)
      setIsLocating(false)
      setLocationError('GPS is not available in this browser.')
      return
    }

    setIsLocating(true)
    setLocationError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLiveLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setIsLocating(false)
      },
      () => {
        setLiveLocation(null)
        setIsLocating(false)
        setLocationError('Allow location access to lock the item spot.')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  }, [])

  useEffect(() => {
    if (!isMobileViewport) {
      return
    }

    requestLiveLocation()
  }, [isMobileViewport, requestLiveLocation])

  const adjustedLocation = useMemo<LocationPoint | null>(() => {
    if (!liveLocation) {
      return null
    }

    return {
      latitude: liveLocation.latitude + (0.5 - pinPosition.y) * 0.0018,
      longitude: liveLocation.longitude + (pinPosition.x - 0.5) * 0.0025,
    }
  }, [liveLocation, pinPosition])

  const safeWeightKg = useMemo(() => {
    const parsed = Number(estimatedWeightKg)
    const fallbackWeightKg = selectedCatalogEntry?.typicalWeightKg ?? 0
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return fallbackWeightKg
    }

    return Math.round(parsed * 10) / 10
  }, [estimatedWeightKg, selectedCatalogEntry?.typicalWeightKg])

  const title = selectedCatalogEntry?.item ?? (itemName.trim() || 'Found item')
  const co2e = useMemo(() => {
    if (!selectedCatalogEntry) {
      return 0
    }

    return scaleCatalogMetric(
      selectedCatalogEntry.estimatedCo2eKg,
      selectedCatalogEntry.typicalWeightKg,
      safeWeightKg,
    )
  }, [safeWeightKg, selectedCatalogEntry])
  const previewImpactPoints = useMemo(() => {
    if (!selectedCatalogEntry) {
      return 0
    }

    return scaleCatalogMetric(
      selectedCatalogEntry.impactPoints,
      selectedCatalogEntry.typicalWeightKg,
      safeWeightKg,
    )
  }, [safeWeightKg, selectedCatalogEntry])
  const supportedCatalogCategorySet = useMemo(
    () => new Set(supportedCatalogCategories),
    [supportedCatalogCategories],
  )
  const cameraStatusLabel = locationError
    ? 'Location needed'
    : isLocating
    ? 'Locking GPS...'
    : `${defaultPostcode} · GPS locked`

  const setNextPreviewUrl = useCallback((nextPreviewUrl: string | null) => {
    setPreviewUrl((currentPreviewUrl) => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl)
      }

      return nextPreviewUrl
    })
  }, [])

  const handleCapturedFile = useCallback(
    async (file: File) => {
      setNextPreviewUrl(URL.createObjectURL(file))

      // Smart pre-fill: classify in parallel with the Cloudinary upload so we
      // don't add latency. The hint is applied to the form state when ready.
      const classifyTask = env.enableSmartSpot
        ? (async () => {
            try {
              setIsClassifying(true)
              const predictions = await classifyImageFile(file)
              const hint = pickConfidentHint(predictions)
              if (hint) {
                setSmartHint(hint)
                setCategory(hint.category)
                if (hint.keyword) {
                  setItemName(hint.keyword)
                }
                info('Smart pre-fill applied', `Detected ${hint.displayLabel} \u2014 tap to change.`)
              }
            } catch {
              // Silent: smart pre-fill is a nice-to-have, never block posting.
            } finally {
              setIsClassifying(false)
            }
          })()
        : Promise.resolve()

      try {
        setIsUploadingImage(true)
        const uploadedImage = await uploadFoundItemImage(file)
        setUploadedImageUrl(uploadedImage.url)
        setStep('details')
      } catch {
        error('Upload failed', 'Retake the photo or try uploading it again.')
      } finally {
        setIsUploadingImage(false)
        await classifyTask
      }
    },
    [error, info, setNextPreviewUrl],
  )

  const resetDraft = useCallback(() => {
    setStep('capture')
    setCategory('furniture')
    setItemName('')
    setEstimatedWeightKg('')
    setHasEditedWeight(false)
    setCatalogEntries([])
    setSelectedCatalogEntry(null)
    setCatalogError(null)
    setIsFlyTipped(false)
    setNotes('')
    setUploadedImageUrl('')
    setCreatedItem(null)
    setPinPosition(defaultPinPosition)
    setNextPreviewUrl(null)
    setSmartHint(null)
    requestLiveLocation()
  }, [requestLiveLocation, setNextPreviewUrl])

  const handleContinueToReview = () => {
    if (!uploadedImageUrl) {
      error('Add a photo first', 'Capture or upload a clear image before continuing.')
      return
    }

    if (!selectedCatalogEntry) {
      error('Choose a catalog match', 'Select a carbon catalog item before you continue.')
      return
    }

    if (!adjustedLocation) {
      error('Location missing', 'Allow GPS access before you continue.')
      return
    }

    setStep('review')
  }

  const handleSubmit = async () => {
    if (!adjustedLocation || !uploadedImageUrl || !selectedCatalogEntry) {
      return
    }

    const payload: CreateFoundItemPayload = {
      title,
      description: buildDescription(title, safeWeightKg, defaultPostcode, isFlyTipped, notes),
      category,
      condition: isFlyTipped ? 'Fly-tipped' : undefined,
      weightKg: safeWeightKg,
      isFlyTipped,
      carbonCatalogSelection: {
        sourceCategory: selectedCatalogEntry.sourceCategory,
        subcategory: selectedCatalogEntry.subcategory,
        item: selectedCatalogEntry.item,
      },
      images: [{ url: uploadedImageUrl, altText: title }],
      location: {
        latitude: adjustedLocation.latitude,
        longitude: adjustedLocation.longitude,
        postcode: defaultPostcode,
      },
    }

    try {
      setIsSubmitting(true)
      const item = await createFoundItem(payload, actor)
      setCreatedItem(item)
      setStep('success')
      success('Spot posted', `${item.title} is now live on the board.`)
    } catch {
      error('Unable to post', 'Please try again in a moment.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const shareCardRef = useRef<HTMLDivElement | null>(null)
  const [isPreparingShare, setIsPreparingShare] = useState(false)

  const handleShare = async () => {
    const item = createdItem
    const shareTitle = item?.title ?? title
    const sharePostcode = item?.location.postcode ?? defaultPostcode
    const shareText = `${shareTitle} is now live in ${sharePostcode}. Rescue it on TruCycle.`
    const shareUrl = `${window.location.origin}/found-items`

    setIsPreparingShare(true)
    try {
      // Try to render the branded card to a PNG file we can share.
      let pngFile: File | null = null
      const cardNode = shareCardRef.current
      if (cardNode) {
        try {
          const { toBlob } = await import('html-to-image')
          const blob = await toBlob(cardNode, {
            cacheBust: true,
            pixelRatio: 1,
            backgroundColor: '#0F1F08',
          })
          if (blob) {
            pngFile = new File([blob], `trucycle-rescue-${item?.id ?? 'spot'}.png`, {
              type: 'image/png',
            })
          }
        } catch {
          // Fall through to text-only share.
        }
      }

      const shareNavigator = navigator as Navigator & {
        canShare?: (data: ShareData & { files?: File[] }) => boolean
      }

      if (
        pngFile &&
        typeof shareNavigator.share === 'function' &&
        typeof shareNavigator.canShare === 'function' &&
        shareNavigator.canShare({ files: [pngFile] })
      ) {
        await shareNavigator.share({
          title: 'TruCycle rescue',
          text: shareText,
          url: shareUrl,
          files: [pngFile],
        })
        return
      }

      if (typeof navigator.share === 'function') {
        await navigator.share({ title: 'TruCycle rescue spot', text: shareText, url: shareUrl })
        return
      }

      if (pngFile && typeof window !== 'undefined') {
        const objectUrl = URL.createObjectURL(pngFile)
        const anchor = document.createElement('a')
        anchor.href = objectUrl
        anchor.download = pngFile.name
        document.body.appendChild(anchor)
        anchor.click()
        document.body.removeChild(anchor)
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1500)
        info('Card downloaded', 'Share the saved image anywhere.')
        return
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
        info('Copied to clipboard', 'The share message is ready to paste.')
        return
      }

      info('Share ready', shareText)
    } catch {
      error('Share cancelled', 'The spot is still live on the board.')
    } finally {
      setIsPreparingShare(false)
    }
  }

  if (!isMobileViewport) {
    return <DesktopOnlyNotice />
  }

  if (step === 'capture') {
    if (env.enableSmartSpot) {
      // Kick off model download while the user is framing their shot so the
      // classifier is hot by the time they tap capture.
      warmUpClassifier()
    }
    return (
      <CameraCapture
        variant="immersive"
        statusLabel={cameraStatusLabel}
        isBusy={isUploadingImage}
        onCapture={(file) => {
          void handleCapturedFile(file)
        }}
        onCancel={() => navigate('/found-items')}
      />
    )
  }

  if (step === 'success') {
    const postedTitle = createdItem?.title ?? title
    const postedPostcode = createdItem?.location.postcode ?? defaultPostcode
    const postedEstimatedCo2eKg = createdItem?.estimatedCo2eKg ?? co2e
    const postedImpactPoints = createdItem?.impactPoints ?? 0

    return (
      <div className="min-h-[100dvh] bg-[linear-gradient(180deg,#F4F9E8_0%,#F8FBF0_100%)] px-4 pb-10 pt-16 text-center text-slate-900">
        {/* Off-screen rescue card used to render a PNG for sharing. */}
        <div
          aria-hidden
          style={{ position: 'fixed', left: -10000, top: 0, pointerEvents: 'none', opacity: 0 }}
        >
          <RescueShareCard
            ref={shareCardRef}
            data={{
              title: postedTitle,
              imageUrl: createdItem?.images?.[0]?.url ?? uploadedImageUrl,
              postcode: postedPostcode,
              co2eKg: Number(postedEstimatedCo2eKg) || 0,
              impactPoints: Number(postedImpactPoints) || 0,
              rescuerName: actor?.name ?? 'a TruCycle spotter',
            }}
          />
        </div>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {confettiPieces.map((piece) => (
            <span
              key={`${piece.left}-${piece.top}`}
              className={classNames('absolute h-2 w-6 rounded-full', piece.color)}
              style={{ left: piece.left, top: piece.top, transform: `rotate(${piece.rotate}deg)` }}
            />
          ))}
        </div>

        <div className="relative mx-auto flex max-w-[420px] flex-col items-center pt-28">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#CFF1A4] text-[#101610] shadow-[0_18px_40px_rgba(154,214,104,0.35)]">
            <Check size={34} strokeWidth={3} />
          </div>
          <p className="mt-7 text-[0.86rem] font-bold uppercase tracking-[0.22em] text-[#55741D]">
            Spot posted
          </p>
          <h1 className="mt-3 text-[2.4rem] font-bold leading-[1.02] tracking-[-0.03em] text-[#111611]">
            Board impact confirmed
          </h1>
          <p className="mt-4 max-w-[320px] text-base leading-7 text-slate-700">
            {postedTitle} is now live in {postedPostcode}. It adds verified impact to your local
            board and feeds into My Impact.
          </p>

          <div className="mt-10 grid w-full grid-cols-2 gap-3 text-left">
            <div className="rounded-[24px] bg-white px-4 py-4 shadow-sm">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Impact score
              </p>
              <p className="mt-2 text-[2rem] font-bold leading-none tracking-[-0.04em] text-[#3A7618]">
                {postedImpactPoints}
              </p>
              <p className="mt-1 text-sm text-slate-500">community pts</p>
            </div>
            <div className="rounded-[24px] bg-white px-4 py-4 shadow-sm">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                CO2e saved
              </p>
              <p className="mt-2 text-[2rem] font-bold leading-none tracking-[-0.04em] text-[#111611]">
                {postedEstimatedCo2eKg}
              </p>
              <p className="mt-1 text-sm text-slate-500">kg CO2e</p>
            </div>
          </div>

          <p className="mt-5 max-w-[320px] text-sm leading-6 text-slate-500">
            Posting also counts toward your badges, streaks and community board standing.
          </p>

          <div className="mt-16 w-full space-y-4">
            <button
              type="button"
              disabled={isPreparingShare}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#111611] px-5 py-4 text-base font-semibold text-white transition hover:bg-[#1B231B] disabled:opacity-60"
              onClick={() => {
                void handleShare()
              }}
            >
              {isPreparingShare ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Share2 size={16} />
              )}
              {isPreparingShare ? 'Preparing card…' : 'Share this rescue'}
            </button>

            <button
              type="button"
              className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-4 text-base font-semibold text-[#111611] transition hover:bg-slate-50"
              onClick={resetDraft}
            >
              Spot another
            </button>
          </div>

          <button
            type="button"
            className="mt-7 text-sm font-medium text-[#446B16] transition hover:text-[#29470C]"
            onClick={() => {
              navigate(createdItem ? `/map?highlight=${encodeURIComponent(createdItem.id)}` : '/map')
            }}
          >
            View on the map →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] bg-white px-4 pb-8 pt-5 text-slate-900">
      <div className="mx-auto max-w-[440px] space-y-5">
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F2F3EC] text-slate-900 transition hover:bg-[#E8EADF]"
            onClick={() => {
              if (step === 'details') {
                setStep('capture')
                return
              }

              setStep('details')
            }}
            aria-label={step === 'review' ? 'Back to confirm details' : 'Back to camera'}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="mb-0 text-[1.95rem] font-bold tracking-[-0.03em] text-slate-950">
              {step === 'review' ? 'Ready to post' : 'Confirm details'}
            </h1>
          </div>
        </div>

        {step === 'details' ? (
          <>
            <LocationPreviewCard
              postcode={defaultPostcode}
              pinPosition={pinPosition}
              onPinChange={setPinPosition}
            />

            {locationError ? (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <span>{locationError}</span>
                <Button type="button" variant="secondary" onClick={requestLiveLocation}>
                  Retry
                </Button>
              </div>
            ) : isLocating ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-[#F5F7EE] px-3 py-2 text-sm text-slate-500">
                <LoaderCircle size={14} className="animate-spin" />
                Locking your location...
              </div>
            ) : null}

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">Catalog search</span>
              <input
                className="h-14 w-full rounded-[18px] border border-slate-200 px-4 text-lg text-slate-900 outline-none transition focus:border-[#87C15F] focus:ring-4 focus:ring-[#EAF6DA]"
                value={itemName}
                onChange={(event) => setItemName(event.target.value)}
                placeholder={categoryMeta[category].searchPlaceholder}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">Item category</span>
              <div className="relative">
                <select
                  className="h-14 w-full appearance-none rounded-[18px] border border-slate-200 bg-white px-4 pr-12 text-lg text-slate-900 outline-none transition focus:border-[#87C15F] focus:ring-4 focus:ring-[#EAF6DA]"
                  value={category}
                  onChange={(event) => {
                    setCategory(event.target.value as FoundItemCategory)
                    setItemName('')
                    setSelectedCatalogEntry(null)
                    setCatalogError(null)
                    setHasEditedWeight(false)
                  }}
                >
                  {foundItemCategories.map((itemCategory) => (
                    <option
                      key={itemCategory}
                      value={itemCategory}
                      disabled={supportedCatalogCategories.length > 0 && !supportedCatalogCategorySet.has(itemCategory)}
                    >
                      {categoryMeta[itemCategory].label}
                    </option>
                  ))}
                </select>
                <ChevronRight
                  size={20}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-400"
                />
              </div>
              <p className="text-sm text-slate-500">Only categories with carbon catalog coverage can be posted from this flow.</p>
            </label>

            {(isClassifying || smartHint) && env.enableSmartSpot ? (
              <div className="flex items-center justify-between gap-3 rounded-[18px] border border-[#D7E8C2] bg-[#F4FAEA] px-4 py-3 text-sm text-[#3A5C12]">
                {isClassifying ? (
                  <span className="inline-flex items-center gap-2">
                    <LoaderCircle size={14} className="animate-spin" />
                    Detecting item...
                  </span>
                ) : smartHint ? (
                  <>
                    <span>
                      <span className="font-semibold">Auto-detected:</span>{' '}
                      {smartHint.displayLabel}
                      <span className="ml-2 text-xs text-[#55741D]">
                        {Math.round(smartHint.confidence * 100)}% confident
                      </span>
                    </span>
                    <button
                      type="button"
                      className="text-xs font-semibold text-[#3A5C12] underline-offset-4 hover:underline"
                      onClick={() => setSmartHint(null)}
                    >
                      Change
                    </button>
                  </>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-700">Catalog matches</span>
                {isLoadingCatalog ? (
                  <span className="inline-flex items-center gap-2 text-xs text-slate-500">
                    <LoaderCircle size={12} className="animate-spin" />
                    Loading
                  </span>
                ) : null}
              </div>

              {catalogError ? <p className="text-sm text-amber-700">{catalogError}</p> : null}

              <div className="grid gap-2">
                {catalogEntries.map((entry) => {
                  const isSelected = isSameCatalogEntry(selectedCatalogEntry, entry)

                  return (
                    <button
                      key={`${entry.sourceCategory}-${entry.subcategory}-${entry.item}`}
                      type="button"
                      className={classNames(
                        'rounded-[18px] border px-4 py-3 text-left transition',
                        isSelected
                          ? 'border-[#87C15F] bg-[#F4FAEA] shadow-sm'
                          : 'border-slate-200 bg-white hover:border-[#D7E8C2] hover:bg-[#FAFCF6]',
                      )}
                      onClick={() => {
                        setSelectedCatalogEntry(entry)
                        setItemName(entry.item)
                        setHasEditedWeight(false)
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950">{entry.item}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {entry.sourceCategory} · {entry.subcategory}
                          </p>
                        </div>
                        <div className="text-right text-sm text-slate-500">
                          <p className="font-semibold text-[#55741D]">{entry.impactPoints} pts</p>
                          <p>{entry.estimatedCo2eKg} kg CO2e</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {selectedCatalogEntry ? (
                <p className="text-sm text-slate-500">
                  Selected profile: {selectedCatalogEntry.item} · typical weight {selectedCatalogEntry.typicalWeightKg} kg
                </p>
              ) : null}
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">Estimated weight</span>
              <div className="relative">
                <input
                  inputMode="numeric"
                  className="h-14 w-full rounded-[18px] border border-slate-200 px-4 pr-12 text-lg text-slate-900 outline-none transition focus:border-[#87C15F] focus:ring-4 focus:ring-[#EAF6DA]"
                  value={estimatedWeightKg}
                  onChange={(event) => {
                    setHasEditedWeight(true)
                    setEstimatedWeightKg(event.target.value.replace(/[^\d.]/g, ''))
                  }}
                  placeholder={selectedCatalogEntry ? String(selectedCatalogEntry.typicalWeightKg) : '0'}
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-lg text-slate-400">
                  kg
                </span>
              </div>
              <p className="text-sm text-slate-500">Auto-filled from the selected catalog match · tap to override</p>
            </label>

            <button
              type="button"
              className={classNames(
                'flex w-full items-start gap-3 rounded-[18px] border px-4 py-4 text-left transition',
                isFlyTipped
                  ? 'border-[#F15A43] bg-[#FFF0EC]'
                  : 'border-slate-200 bg-[#FBFBFA] hover:border-[#E3E7DA] hover:bg-[#F7F8F4]',
              )}
              onClick={() => setIsFlyTipped((currentValue) => !currentValue)}
              aria-pressed={isFlyTipped}
            >
              <span
                className={classNames(
                  'mt-1 inline-flex h-7 w-12 items-center rounded-full px-1 transition',
                  isFlyTipped ? 'bg-[#D3543D]' : 'bg-slate-300',
                )}
              >
                <span
                  className={classNames(
                    'h-5 w-5 rounded-full bg-white transition',
                    isFlyTipped ? 'translate-x-5' : 'translate-x-0',
                  )}
                />
              </span>
              <span>
                <span className="block text-lg font-semibold text-slate-950">Fly-tipped item</span>
                <span className="block text-sm text-slate-500">
                  We&apos;ll share diversion data with the council.
                </span>
              </span>
            </button>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-slate-700">Notes (optional)</span>
              <textarea
                className="min-h-[116px] w-full rounded-[18px] border border-slate-200 px-4 py-4 text-base text-slate-900 outline-none transition focus:border-[#87C15F] focus:ring-4 focus:ring-[#EAF6DA]"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Condition, size, any warnings..."
              />
            </label>

            <button
              type="button"
              className="mt-10 inline-flex w-full items-center justify-center rounded-full bg-[#111611] px-5 py-4 text-lg font-semibold text-white transition hover:bg-[#1B231B]"
              onClick={handleContinueToReview}
              disabled={isUploadingImage}
            >
              Continue
              <ChevronRight size={18} />
            </button>
          </>
        ) : (
          <>
            <div className="overflow-hidden rounded-[24px] bg-[linear-gradient(180deg,#F0F5E4_0%,#EFF7E6_100%)]">
              {previewUrl ? (
                <img src={previewUrl} alt={title} className="h-[360px] w-full object-cover" />
              ) : (
                <div className="flex h-[360px] items-center justify-center bg-[#E7EFD6] text-slate-400">
                  No preview
                </div>
              )}
            </div>

            <div>
              <h2 className="mb-1 text-[2rem] font-bold tracking-[-0.03em] text-slate-950">{title}</h2>
              <p className="text-lg text-slate-500">
                {safeWeightKg} kg · {defaultPostcode}
              </p>
              {selectedCatalogEntry ? (
                <p className="mt-2 text-sm text-slate-500">
                  {selectedCatalogEntry.sourceCategory} · {selectedCatalogEntry.subcategory}
                </p>
              ) : null}
            </div>

            <div className="rounded-[24px] bg-[linear-gradient(90deg,#F4F8EA_0%,#EEF6DE_100%)] px-5 py-5 text-slate-950">
              <p className="text-[0.82rem] font-bold uppercase tracking-[0.18em] text-[#55741D]">
                Catalog-backed preview
              </p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">CO2e saved</p>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-[2.6rem] font-bold leading-none tracking-[-0.05em]">{co2e}</span>
                    <span className="pb-1 text-xl text-slate-700">kg</span>
                  </div>
                </div>
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-slate-500">Impact score</p>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-[2.6rem] font-bold leading-none tracking-[-0.05em] text-[#3A7618]">{previewImpactPoints}</span>
                    <span className="pb-1 text-xl text-slate-700">pts</span>
                  </div>
                </div>
              </div>
              <p className="mt-2 text-lg text-slate-700">based on the selected carbon catalog profile and weight</p>

              <div className="mt-5 h-px bg-slate-300/70" />

              <p className="mt-4 text-sm leading-6 text-slate-600">
                This preview is calculated from the exact catalog row that will be submitted with your post.
              </p>
            </div>

            <p className="pt-2 text-center text-sm leading-6 text-slate-500">
              By posting, you confirm this item was in a public space.
            </p>

            <button
              type="button"
              className="inline-flex w-full items-center justify-center rounded-full bg-[#111611] px-5 py-4 text-lg font-semibold text-white transition hover:bg-[#1B231B] disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => {
                void handleSubmit()
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  Post spot
                  <Check size={18} />
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
