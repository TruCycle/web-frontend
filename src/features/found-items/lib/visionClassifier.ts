// Cloudflare Worker-backed image recognition for the Spot flow.
//
// Replaces the in-browser MobileNet/TensorFlow classifier: the image is
// compressed client-side and POSTed to the TruCycle Vision Worker
// (@cf/meta/llama-3.2-11b-vision-instruct), which returns a structured item
// analysis. We map that onto a CatalogHint the Post flow already understands.

import { env } from '@/shared/lib/config/env'
import type { FoundItemCategory } from '../types'

export interface CatalogHint {
  readonly category: FoundItemCategory
  readonly keyword: string
  readonly displayLabel: string
  readonly confidence: number
}

const MAX_DIMENSION = 1000
const JPEG_QUALITY = 0.85

interface WorkerItemData {
  readonly item_type?: unknown
  readonly suggested_category?: unknown
  readonly condition?: unknown
  readonly reusable?: unknown
  readonly notes?: unknown
}

interface WorkerResponse {
  readonly success?: boolean
  readonly data?: WorkerItemData | null
  readonly raw?: string
  readonly error?: string
}

// The worker's suggested_category enum -> our FoundItemCategory.
const CATEGORY_MAP: Record<string, FoundItemCategory> = {
  furniture: 'furniture',
  kitchenware: 'appliances',
  'books + media': 'books',
  'kids + baby': 'toys',
  'garden + tools': 'outdoor',
  'tech shelf': 'electronics',
  clothing: 'clothing',
  other: 'other',
}

function isVisionConfigured(): boolean {
  return env.visionWorkerUrl.trim().length > 0
}

function toTitleCase(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase())
}

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the image.'))
    reader.onload = (event) => {
      const image = new Image()
      image.onerror = () => reject(new Error('Could not decode the image.'))
      image.onload = () => {
        let width = image.width
        let height = image.height
        if (width > height && width > MAX_DIMENSION) {
          height = Math.round((height * MAX_DIMENSION) / width)
          width = MAX_DIMENSION
        } else if (height >= width && height > MAX_DIMENSION) {
          width = Math.round((width * MAX_DIMENSION) / height)
          height = MAX_DIMENSION
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const context = canvas.getContext('2d')
        if (!context) {
          reject(new Error('Canvas is not available.'))
          return
        }
        context.drawImage(image, 0, 0, width, height)
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Image compression failed.'))),
          'image/jpeg',
          JPEG_QUALITY,
        )
      }
      image.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Classify a captured/selected image via the Cloudflare Vision Worker.
 * Returns a CatalogHint for smart pre-fill, or null when the worker is not
 * configured / could not produce a confident structured result.
 */
export async function classifyImageWithWorker(file: File): Promise<CatalogHint | null> {
  if (!isVisionConfigured()) {
    return null
  }

  const compressed = await compressImage(file)
  const formData = new FormData()
  formData.append('image', compressed, 'spot.jpg')
  formData.append('prompt', 'Analyze this item spotted on a UK street for TruCycle.')

  const response = await fetch(env.visionWorkerUrl.trim(), {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`Vision worker responded ${response.status}`)
  }

  const payload = (await response.json()) as WorkerResponse
  const data = payload.data
  if (!payload.success || !data) {
    return null
  }

  const itemType = typeof data.item_type === 'string' ? data.item_type.trim() : ''
  const suggested =
    typeof data.suggested_category === 'string'
      ? data.suggested_category.trim().toLowerCase()
      : ''
  const category = CATEGORY_MAP[suggested] ?? 'other'

  if (!itemType && category === 'other') {
    return null
  }

  return {
    category,
    keyword: itemType,
    displayLabel: itemType ? toTitleCase(itemType) : toTitleCase(suggested || 'item'),
    // The worker doesn't return a probability; treat a structured answer as
    // high-confidence so the existing threshold check passes.
    confidence: 0.9,
  }
}

export function isVisionWorkerEnabled(): boolean {
  return isVisionConfigured()
}
