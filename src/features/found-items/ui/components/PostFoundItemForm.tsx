import { useMemo, useState } from 'react'
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

  const canSubmit = useMemo(
    () =>
      title.trim().length > 2 &&
      description.trim().length > 8 &&
      defaultPostcode.trim().length > 1,
    [defaultPostcode, description, title],
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
        if (!canSubmit) {
          return
        }

        void onSubmit({
          title: title.trim(),
          description: description.trim(),
          category,
          condition: condition.trim() || undefined,
          images: imageUrl ? [{ url: imageUrl, altText: title.trim() }] : [],
          location: {
            latitude: 51.5074,
            longitude: -0.1278,
            address: address.trim() || undefined,
            postcode: defaultPostcode.trim(),
          },
        })
      }}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Title</span>
          <input
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What did you spot?"
          />
          <p className="text-xs text-slate-500 mt-1">Use a nearby landmark or general area instead of a precise address.</p>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Category</span>
          <CustomSelect
            value={category}
            options={categoryOptions}
            onChange={(value) => setCategory(value as FoundItemCategory)}
            buttonClassName="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
          />
        </label>
      </div>

      <label className="space-y-2 block">
        <span className="text-sm font-medium text-slate-700">Description</span>
        <textarea
          className="min-h-28 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-700 outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Short, useful details only."
        />
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Condition</span>
          <input
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
            value={condition}
            onChange={(event) => setCondition(event.target.value)}
            placeholder="Good, fair, etc."
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-700">Address hint</span>
          <input
            className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Outside the gate"
          />
        </label>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Location</p>
          <p className="mt-1 text-sm font-medium text-slate-700">Using your saved address</p>
        </div>
      </div>

      <div className="space-y-3 rounded-2xl border border-dashed border-slate-300 p-4">
        <div className="flex items-center gap-3 text-slate-600">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
            <ImagePlus size={18} />
          </span>
          <div>
            <p className="text-sm font-medium text-slate-900">Photo</p>
            <p className="text-xs text-slate-500">One clear shot is enough.</p>
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

        {isUploading ? <p className="text-sm text-slate-500">Uploading image...</p> : null}
        {imageUrl ? (
          <img src={imageUrl} alt="Selected item" className="h-44 w-full rounded-xl object-cover" />
        ) : null}
      </div>

      <Button
        variant="primary"
        className="w-full md:w-auto"
        disabled={!canSubmit || isSubmitting || isUploading || isCameraOpen}
      >
        {isSubmitting ? 'Posting...' : 'Post Found Item'}
      </Button>
    </form>
  )
}
