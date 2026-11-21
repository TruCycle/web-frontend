import { useCallback, useEffect, useMemo, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import { Button } from '@/shared/ui/button/Button'
import { CustomSelect } from '@/shared/ui/select'
import { uploadFoundItemImage } from '../../api/foundItemsApi'
import { foundItemCategories } from '../../types'
import type { CreateFoundItemPayload, FoundItemCategory } from '../../types'
import { CameraCapture } from './CameraCapture'

interface PostFoundItemFormProps {
  readonly defaultPostcode: string
  readonly isSubmitting: boolean
  readonly onSubmit: (payload: CreateFoundItemPayload) => Promise<void>
}

const categoryOptions = foundItemCategories.map((itemCategory) => ({
  value: itemCategory,
  label: itemCategory,
}))

export function PostFoundItemForm({
  defaultPostcode,
  isSubmitting,
  onSubmit,
}: PostFoundItemFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<FoundItemCategory>('furniture')
  const [condition, setCondition] = useState('')
  const [address, setAddress] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [liveLocation, setLiveLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [isLocating, setIsLocating] = useState(true)
  const [locationError, setLocationError] = useState<string | null>(null)

  const requestLiveLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLiveLocation(null)
      setIsLocating(false)
      setLocationError('Live location is not available in this browser.')
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
        setLocationError('Allow location access to post this item.')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  }, [])

  useEffect(() => {
    requestLiveLocation()
  }, [requestLiveLocation])

  const canSubmit = useMemo(
    () =>
      title.trim().length > 2 &&
      description.trim().length > 8 &&
      defaultPostcode.trim().length > 1 &&
      liveLocation !== null &&
      !isLocating,
    [defaultPostcode, description, isLocating, liveLocation, title],
  )

  const handleCapturedFile = async (file: File) => {
    try {
      setIsUploading(true)
      const uploadedImage = await uploadFoundItemImage(file)
      setImageUrl(uploadedImage.url)
      setIsCameraOpen(false)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault()
        if (!canSubmit || !liveLocation) {
          return
        }

        void onSubmit({
          title: title.trim(),
          description: description.trim(),
          category,
          condition: condition.trim() || undefined,
          images: imageUrl ? [{ url: imageUrl, altText: title.trim() }] : [],
          location: {
            latitude: liveLocation.latitude,
            longitude: liveLocation.longitude,
            address: address.trim() || undefined,
            postcode: defaultPostcode.trim(),
          },
        })
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="block text-sm font-semibold text-tc-brand-ink">Title</span>
          <input
            className="min-h-11 w-full rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:outline-none focus:ring-2 focus:ring-tc-brand-mint"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What did you spot?"
          />
        </label>

        <label className="space-y-2">
          <span className="block text-sm font-semibold text-tc-brand-ink">Category</span>
          <CustomSelect
            value={category}
            options={categoryOptions}
            onChange={(value) => setCategory(value as FoundItemCategory)}
            buttonClassName="h-11 w-full rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink"
          />
        </label>
      </div>

      <label className="space-y-2 block">
        <span className="block text-sm font-semibold text-tc-brand-ink">Description</span>
        <textarea
          className="min-h-28 w-full rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:outline-none focus:ring-2 focus:ring-tc-brand-mint py-3"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Short, useful details only."
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="block text-sm font-semibold text-tc-brand-ink">Condition</span>
          <input
            className="min-h-11 w-full rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:outline-none focus:ring-2 focus:ring-tc-brand-mint"
            value={condition}
            onChange={(event) => setCondition(event.target.value)}
            placeholder="Good, fair, etc."
          />
        </label>

        <label className="space-y-2">
          <span className="block text-sm font-semibold text-tc-brand-ink">Address hint</span>
          <input
            className="min-h-11 w-full rounded-tc-md border border-tc-brand-control bg-white px-3.5 text-sm text-tc-brand-ink placeholder:text-tc-brand-muted focus:border-tc-brand-deep focus:outline-none focus:ring-2 focus:ring-tc-brand-mint"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Outside the gate"
          />
        </label>
      </div>

      {isLocating ? <p className="text-[13px] leading-5 text-tc-brand-muted">Getting your live location...</p> : null}
      {locationError ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[13px] leading-5 text-tc-brand-danger">{locationError}</p>
          <Button type="button" variant="secondary" onClick={requestLiveLocation}>
            Retry location
          </Button>
        </div>
      ) : null}

      <div className="space-y-3 rounded-tc-lg border border-dashed border-tc-brand-control p-4">
        <div className="flex items-center gap-3 text-tc-brand-deep">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-tc-brand-mintSoft">
            <ImagePlus size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold text-tc-brand-ink">Photo</p>
            <p className="text-[13px] leading-5 text-tc-brand-muted">One clear shot is enough.</p>
          </div>
        </div>

        {isCameraOpen ? (
          <CameraCapture
            onCapture={(file) => {
              void handleCapturedFile(file)
            }}
            onCancel={() => setIsCameraOpen(false)}
          />
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => setIsCameraOpen(true)}>
              Open Camera
            </Button>
            {imageUrl ? (
              <Button variant="secondary" onClick={() => setImageUrl('')}>
                Retake
              </Button>
            ) : null}
          </div>
        )}

        {isUploading ? <p className="text-[13px] leading-5 text-tc-brand-muted">Uploading image...</p> : null}
        {imageUrl ? (
          <img src={imageUrl} alt="Selected item" className="h-44 w-full rounded-tc-md object-cover" />
        ) : null}
      </div>

      <Button
        type="submit"
        variant="primary"
        className="w-full md:w-auto"
        disabled={!canSubmit || isSubmitting || isUploading || isCameraOpen}
      >
        {isSubmitting ? 'Posting...' : 'Post Found Item'}
      </Button>
    </form>
  )
}
