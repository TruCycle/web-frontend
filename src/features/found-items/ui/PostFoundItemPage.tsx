import {
  ArrowLeft,
  Check,
  ChevronRight,
  LoaderCircle,
  MapPin,
  Share2,
  Smartphone,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createFoundItem, fetchFoundItemCatalog, uploadFoundItemImage } from '../api/foundItemsApi'
import { useSpotPostcode } from '../hooks/useSpotPostcode'
import { outwardPostcode } from '../lib/foundItemLocation'
import {
  classifyImageWithWorker,
  isVisionWorkerEnabled,
  type CatalogHint,
} from '../lib/visionClassifier'
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
import { useConfetti } from '@/shared/hooks/useConfetti'

type PostStep = 'capture' | 'details' | 'review' | 'success'

interface LocationPoint {
  readonly latitude: number
  readonly longitude: number
}

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
  { left: '7%', top: '16%', rotate: -12, color: 'bg-tc-brand-mint' },
  { left: '31%', top: '9%', rotate: 9, color: 'bg-tc-brand-deep' },
  { left: '63%', top: '23%', rotate: -14, color: 'bg-tc-brand-mintSoft' },
  { left: '84%', top: '18%', rotate: 15, color: 'bg-tc-brand-mint' },
  { left: '13%', top: '58%', rotate: -18, color: 'bg-tc-brand-mintLine' },
  { left: '47%', top: '67%', rotate: 4, color: 'bg-tc-brand-deep' },
  { left: '76%', top: '52%', rotate: 16, color: 'bg-tc-brand-mint' },
  { left: '32%', top: '31%', rotate: -24, color: 'bg-tc-brand-mintSoft' },
] as const

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
  const area = outwardPostcode(postcode)
  const parts = [`${title} spotted${area ? ` in ${area}` : ''}.`, `Estimated weight ${weightKg}kg.`]

  if (isFlyTipped) {
    parts.push('The poster has marked this item as suspected fly-tipping.')
  }

  if (notes.trim()) {
    parts.push(notes.trim())
  }

  return parts.join(' ')
}

function DesktopOnlyNotice() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-14rem)] max-w-[480px] items-center justify-center px-4 py-8">
      <div className="w-full rounded-tc-lg border border-tc-brand-line bg-white px-6 py-12 text-center sm:px-10 sm:py-14">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-tc-brand-mintSoft text-tc-brand-deep">
          <Smartphone size={28} />
        </div>
        <h1 className="mt-4 text-lg leading-7 font-semibold text-tc-brand-ink">Use a mobile device to post</h1>
        <p className="mx-auto mt-2.5 max-w-[380px] text-sm leading-5 text-tc-brand-body">
          Found-item posting now uses the mobile camera and live GPS flow. Open this page on your
          phone to capture the item and lock the location.
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/found-items"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-tc-brand-deep px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-tc-brand-hover"
          >
            Back to found items
          </Link>
        </div>
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
  const { fireMilestone } = useConfetti()
  useEffect(() => {
    if (step === 'success') fireMilestone()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])
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
  // The exact spot the item was seen. Seeded from the live GPS fix, then the
  // user can fine-tune it by dragging the map pin.
  const [pinnedLocation, setPinnedLocation] = useState<LocationPoint | null>(null)
  const [isLocating, setIsLocating] = useState(true)
  const [locationError, setLocationError] = useState<string | null>(null)
  const locationRequestGenerationRef = useRef(0)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdItem, setCreatedItem] = useState<FoundItem | null>(null)
  const [smartHint, setSmartHint] = useState<CatalogHint | null>(null)
  const [isClassifying, setIsClassifying] = useState(false)

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
    const generation = ++locationRequestGenerationRef.current
    setLiveLocation(null)
    setPinnedLocation(null)
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
        if (generation !== locationRequestGenerationRef.current) return
        locationRequestGenerationRef.current += 1
        const nextLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
        setLiveLocation(nextLocation)
        setPinnedLocation(nextLocation)
        setIsLocating(false)
      },
      () => {
        if (generation !== locationRequestGenerationRef.current) return
        locationRequestGenerationRef.current += 1
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
    return () => {
      // No geolocation cancellation API: invalidate on viewport exit/replay/unmount.
      locationRequestGenerationRef.current += 1
    }
  }, [isMobileViewport, requestLiveLocation])

  // The pin position is the real GPS spot the item was seen — the live fix by
  // default, or wherever the user dragged the pin.
  const adjustedLocation = pinnedLocation ?? liveLocation
  const { postcode, status: postcodeStatus, error: postcodeError, retry: retryPostcode } = useSpotPostcode(adjustedLocation)
  const displayPostcode = postcode ?? (postcodeStatus === 'loading' ? 'Identifying area…' : 'Postcode not resolved')

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
  const supportedCatalogCategorySet = useMemo(
    () => new Set(supportedCatalogCategories),
    [supportedCatalogCategories],
  )
  const cameraStatusLabel = locationError
    ? 'Location needed'
    : isLocating
    ? 'Locking GPS...'
    : postcodeStatus === 'resolved'
      ? `${postcode} · GPS locked`
      : postcodeStatus === 'error' ? 'Postcode lookup needed' : 'Identifying area…'

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

      // Smart pre-fill: classify via the Cloudflare Vision Worker in parallel
      // with the Cloudinary upload so we don't add latency. The hint is applied
      // to the form state when ready.
      const classifyTask =
        env.enableSmartSpot && isVisionWorkerEnabled()
        ? (async () => {
            try {
              setIsClassifying(true)
              const hint = await classifyImageWithWorker(file)
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
    setPinnedLocation(null)
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
    if (postcodeStatus !== 'resolved' || !postcode) {
      error('Postcode needed', 'Resolve the postcode for this pin before continuing.')
      return
    }

    setStep('review')
  }

  const handleSubmit = async () => {
    if (!adjustedLocation || !uploadedImageUrl || !selectedCatalogEntry) {
      return
    }
    if (postcodeStatus !== 'resolved' || !postcode) {
      error('Postcode needed', 'Resolve the postcode for this pin before posting.')
      return
    }

    const payload: CreateFoundItemPayload = {
      title,
      description: buildDescription(title, safeWeightKg, postcode, isFlyTipped, notes),
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
        postcode,
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
    const sharePostcode = outwardPostcode(item?.location.postcode ?? postcode)
    const shareText = `${shareTitle} is now posted${sharePostcode ? ` in ${sharePostcode}` : ''}. See the post on TruCycle.`
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
            pngFile = new File([blob], `trucycle-spot-${item?.id ?? 'spot'}.png`, {
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
          title: 'TruCycle spot',
          text: shareText,
          url: shareUrl,
          files: [pngFile],
        })
        return
      }

      if (typeof navigator.share === 'function') {
        await navigator.share({ title: 'TruCycle spot', text: shareText, url: shareUrl })
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
    const postedPostcode = outwardPostcode(createdItem?.location.postcode ?? postcode)
    const postedEstimatedCo2eKg = createdItem?.estimatedCo2eKg ?? co2e
    const postedImpactPoints = createdItem?.impactPoints ?? 0

    return (
      <div className="min-h-[100dvh] bg-tc-brand-haze px-4 pb-10 pt-16 text-center text-tc-brand-ink">
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
          <div className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-tc-brand-mint text-tc-brand-onMint">
            <Check size={34} strokeWidth={3} />
          </div>
          <p className="mt-6 text-xs leading-4 font-semibold uppercase tracking-[0.06em] text-tc-brand-muted">
            Spot posted
          </p>
          <h1 className="mt-2 text-[26px] leading-8 font-semibold tracking-[-0.02em] text-tc-brand-ink">
            Board impact confirmed
          </h1>
          <p className="mt-3 max-w-[320px] text-sm leading-6 text-tc-brand-body">
            {postedTitle} is now posted in {postedPostcode}. A post does not confirm that an item has been handed over.
          </p>

          <p className="mt-8 rounded-tc-lg border border-tc-brand-mintLine bg-tc-brand-mintSoft p-4 text-left text-[13px] leading-5 text-tc-brand-body">Keep the post up to date if the item is no longer available. Confirm its condition and the owner&apos;s permission before arranging a handover.</p>

          <p className="mt-4 max-w-[320px] text-[13px] leading-5 text-tc-brand-muted">
            You can review your recorded activity in My Impact.
          </p>

          <div className="mt-10 w-full space-y-2.5">
            <button
              type="button"
              disabled={isPreparingShare}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-tc-brand-deep px-5 py-3 text-base font-semibold text-white transition hover:bg-tc-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => {
                void handleShare()
              }}
            >
              {isPreparingShare ? (
                <LoaderCircle size={16} className="animate-spin" />
              ) : (
                <Share2 size={16} />
              )}
              {isPreparingShare ? 'Preparing card…' : 'Share this post'}
            </button>

            <button
              type="button"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-tc-brand-control bg-white px-5 py-3 text-base font-semibold text-tc-brand-ink transition hover:bg-tc-brand-soft"
              onClick={resetDraft}
            >
              Spot another
            </button>
          </div>

          <button
            type="button"
            className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-tc-brand-deep underline underline-offset-4 transition hover:text-black"
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
    <div className="min-h-[100dvh] bg-tc-brand-haze px-4 pb-8 pt-5 text-tc-brand-ink">
      <div className="mx-auto max-w-[440px] space-y-5">
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-tc-brand-control bg-white text-tc-brand-ink transition hover:bg-tc-brand-soft"
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
            <h1 className="mb-0 text-xl leading-7 font-semibold tracking-[-0.015em] text-tc-brand-ink">
              {step === 'review' ? 'Ready to post' : 'Confirm details'}
            </h1>
          </div>
        </div>

        {postcodeStatus === 'loading' ? (
          <p role="status" className="inline-flex items-center gap-2 text-[13px] leading-5 text-tc-brand-muted">
            <LoaderCircle size={14} className="animate-spin" />
            Identifying postcode for this pin…
          </p>
        ) : postcodeStatus === 'error' ? (
          <div role="alert" className="space-y-3 rounded-tc-md border border-tc-brand-dangerLine bg-tc-brand-dangerSoft p-4 text-sm text-tc-brand-danger">
            <p>{postcodeError}</p>
            <Button type="button" variant="secondary" onClick={retryPostcode}>Retry postcode</Button>
          </div>
        ) : null}

        {step === 'details' ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-tc-brand-ink">Captured photo</span>
                <button
                  type="button"
                  onClick={() => setStep('capture')}
                  className="-my-2 inline-flex min-h-11 items-center text-[13px] font-semibold text-tc-brand-deep underline underline-offset-4 transition hover:text-black"
                >
                  Retake photo
                </button>
              </div>
              <div className="relative h-60 w-full overflow-hidden rounded-tc-lg border border-tc-brand-line bg-tc-brand-soft">
                {previewUrl || uploadedImageUrl ? (
                  <img
                    src={previewUrl || uploadedImageUrl}
                    alt={title || 'Captured item'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-tc-brand-muted">
                    No preview available
                  </div>
                )}
              </div>
              {adjustedLocation ? (
                <div className="flex items-center gap-1.5 text-xs leading-4 text-tc-brand-body">
                  <MapPin size={14} className="shrink-0 text-tc-brand-deep" />
                  <span>
                    <span className="font-semibold text-tc-brand-ink">{displayPostcode}</span>
                    {' · '}
                    {adjustedLocation.latitude.toFixed(5)}, {adjustedLocation.longitude.toFixed(5)}
                  </span>
                </div>
              ) : null}
            </div>

            {locationError ? (
              <div className="flex items-center justify-between gap-3 rounded-tc-md border border-tc-brand-dangerLine bg-tc-brand-dangerSoft px-4 py-3 text-sm text-tc-brand-danger">
                <span>{locationError}</span>
                <Button type="button" variant="secondary" onClick={requestLiveLocation}>
                  Retry
                </Button>
              </div>
            ) : isLocating ? (
              <div className="inline-flex items-center gap-2 rounded-full bg-tc-brand-soft px-3 py-2 text-[13px] leading-5 text-tc-brand-body">
                <LoaderCircle size={14} className="animate-spin" />
                Locking your location...
              </div>
            ) : null}

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-tc-brand-ink">Catalog search</span>
              <input
                className="h-12 w-full rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-base text-tc-brand-ink outline-none transition placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:ring-2 focus:ring-tc-brand-mint"
                value={itemName}
                onChange={(event) => setItemName(event.target.value)}
                placeholder={categoryMeta[category].searchPlaceholder}
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-tc-brand-ink">Item category</span>
              <div className="relative">
                <select
                  className="h-12 w-full appearance-none rounded-tc-md border border-tc-brand-control bg-white px-3.5 pr-12 text-base text-tc-brand-ink outline-none transition placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:ring-2 focus:ring-tc-brand-mint"
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
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-tc-brand-muted"
                />
              </div>
              <p className="text-[13px] leading-5 text-tc-brand-muted">Only categories with carbon catalog coverage can be posted from this flow.</p>
            </label>

            {(isClassifying || smartHint) && env.enableSmartSpot ? (
              <div className="flex items-center justify-between gap-3 rounded-tc-md border border-tc-brand-mintLine bg-tc-brand-mintSoft px-3.5 py-2.5 text-sm text-tc-brand-ink">
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
                      <span className="ml-2 text-xs text-tc-brand-body">
                        {Math.round(smartHint.confidence * 100)}% confident
                      </span>
                    </span>
                    <button
                      type="button"
                      className="-my-2 inline-flex min-h-11 shrink-0 items-center text-[13px] font-semibold text-tc-brand-deep underline underline-offset-4 hover:text-black"
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
                <span className="text-sm font-semibold text-tc-brand-ink">Catalog matches</span>
                {isLoadingCatalog ? (
                  <span className="inline-flex items-center gap-2 text-xs text-tc-brand-muted">
                    <LoaderCircle size={12} className="animate-spin" />
                    Loading
                  </span>
                ) : null}
              </div>

              {catalogError ? <p className="text-[13px] leading-5 text-tc-brand-danger">{catalogError}</p> : null}

              <div className="grid gap-2">
                {catalogEntries.map((entry) => {
                  const isSelected = isSameCatalogEntry(selectedCatalogEntry, entry)

                  return (
                    <button
                      key={`${entry.sourceCategory}-${entry.subcategory}-${entry.item}`}
                      type="button"
                      className={classNames(
                        'min-h-11 rounded-tc-md border px-3.5 py-3 text-left transition',
                        isSelected
                          ? 'border-tc-brand-deep bg-tc-brand-mintSoft'
                          : 'border-tc-brand-line bg-white hover:border-tc-brand-control hover:bg-tc-brand-soft',
                      )}
                      onClick={() => {
                        setSelectedCatalogEntry(entry)
                        setItemName(entry.item)
                        setHasEditedWeight(false)
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-tc-brand-ink">{entry.item}</p>
                          <p className="mt-0.5 text-[13px] leading-5 text-tc-brand-muted">
                            {entry.sourceCategory} · {entry.subcategory}
                          </p>
                        </div>
                        <div className="shrink-0 text-right text-[13px] leading-5 text-tc-brand-muted">
                          <p className="font-semibold tabular-nums text-tc-brand-ink">{entry.impactPoints} pts</p>
                          <p>Item profile</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {selectedCatalogEntry ? (
                <p className="text-[13px] leading-5 text-tc-brand-muted">
                  Selected profile: {selectedCatalogEntry.item} · typical weight {selectedCatalogEntry.typicalWeightKg} kg
                </p>
              ) : null}
            </div>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-tc-brand-ink">Estimated weight</span>
              <div className="relative">
                <input
                  inputMode="numeric"
                  className="h-12 w-full rounded-tc-md border border-tc-brand-control bg-white px-3.5 pr-12 text-base text-tc-brand-ink outline-none transition placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:ring-2 focus:ring-tc-brand-mint"
                  value={estimatedWeightKg}
                  onChange={(event) => {
                    setHasEditedWeight(true)
                    setEstimatedWeightKg(event.target.value.replace(/[^\d.]/g, ''))
                  }}
                  placeholder={selectedCatalogEntry ? String(selectedCatalogEntry.typicalWeightKg) : '0'}
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-base text-tc-brand-muted">
                  kg
                </span>
              </div>
              <p className="text-[13px] leading-5 text-tc-brand-muted">Auto-filled from the selected catalog match · tap to override</p>
            </label>

            <button
              type="button"
              className={classNames(
                'flex w-full flex-row-reverse items-center justify-between gap-4 rounded-tc-md border p-4 text-left transition',
                isFlyTipped
                  ? 'border-tc-brand-dangerLine bg-tc-brand-dangerSoft'
                  : 'border-tc-brand-line bg-white hover:border-tc-brand-control',
              )}
              onClick={() => setIsFlyTipped((currentValue) => !currentValue)}
              aria-pressed={isFlyTipped}
            >
              <span
                className={classNames(
                  'inline-flex h-[26px] w-11 shrink-0 items-center rounded-full px-[3px] transition',
                  isFlyTipped ? 'bg-tc-brand-danger' : 'bg-tc-brand-track',
                )}
              >
                <span
                  className={classNames(
                    'h-5 w-5 rounded-full bg-white transition',
                    isFlyTipped ? 'translate-x-[18px]' : 'translate-x-0',
                  )}
                />
              </span>
              <span>
                <span className="block text-sm font-semibold text-tc-brand-ink">Fly-tipped item</span>
                <span className="mt-0.5 block text-[13px] leading-5 text-tc-brand-body">
                  Flag suspected dumping. This does not send a report to your council.
                </span>
              </span>
            </button>

            <label className="block space-y-2">
              <span className="text-sm font-semibold text-tc-brand-ink">Notes (optional)</span>
              <textarea
                className="min-h-[116px] w-full rounded-tc-md border border-tc-brand-control bg-white px-3.5 py-3 text-base text-tc-brand-ink outline-none transition placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:ring-2 focus:ring-tc-brand-mint"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Condition, size, any warnings..."
              />
            </label>

            <button
              type="button"
              className="mt-10 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-tc-brand-deep px-5 py-3 text-base font-semibold text-white transition hover:bg-tc-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleContinueToReview}
              disabled={isUploadingImage || postcodeStatus !== 'resolved' || !postcode}
            >
              Continue
              <ChevronRight size={18} />
            </button>
          </>
        ) : (
          <>
            <div className="overflow-hidden rounded-tc-xl border border-tc-brand-line bg-tc-brand-soft">
              {previewUrl ? (
                <img src={previewUrl} alt={title} className="h-[360px] w-full object-cover" />
              ) : (
                <div className="flex h-[360px] items-center justify-center bg-tc-brand-soft text-sm text-tc-brand-muted">
                  No preview
                </div>
              )}
            </div>

            <div>
              <h2 className="mb-1 text-xl leading-7 font-semibold tracking-[-0.015em] text-tc-brand-ink">{title}</h2>
              <p className="text-sm leading-5 tabular-nums text-tc-brand-body">
                {safeWeightKg} kg · {displayPostcode}
              </p>
              {selectedCatalogEntry ? (
                <p className="mt-1 text-[13px] leading-5 text-tc-brand-muted">
                  {selectedCatalogEntry.sourceCategory} · {selectedCatalogEntry.subcategory}
                </p>
              ) : null}
            </div>

            <div className="rounded-tc-lg border border-tc-brand-mintLine bg-tc-brand-mintSoft p-4 text-tc-brand-ink">
              <p className="text-sm font-semibold text-tc-brand-ink">
                Before the handover
              </p>
              <p className="mt-1 text-[13px] leading-5 text-tc-brand-body">Check availability, condition and owner permission. Agree any minor repair with the next owner before the item moves. Posting an item is not a completed handover or a measurement of environmental savings.</p>
            </div>

            <p className="pt-2 text-center text-[13px] leading-5 text-tc-brand-muted">
              A location does not establish ownership or permission to take an item. For suspected dumping, use the{' '}<a className="font-semibold text-tc-brand-deep underline underline-offset-4 hover:text-black" href="https://www.gov.uk/report-flytipping">official reporting guidance</a>.
            </p>

            <button
              type="button"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-tc-brand-deep px-5 py-3 text-base font-semibold text-white transition hover:bg-tc-brand-hover disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => {
                void handleSubmit()
              }}
              disabled={isSubmitting || postcodeStatus !== 'resolved' || !postcode}
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
