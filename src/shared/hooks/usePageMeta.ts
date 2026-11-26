import { useEffect } from 'react'
import { applyPageMetadata, type PageMetaOptions } from '@/shared/lib/config/pageMetadata'

/** Route-owned metadata; never clears a build/server-provided noindex policy. */
export function usePageMeta(options: PageMetaOptions = {}): void {
  const { title, description, canonicalPath, ogImage, ogType, noIndex } = options
  useEffect(() => applyPageMetadata(document, { title, description, canonicalPath, ogImage, ogType, noIndex }, import.meta.env.MODE === 'staging'),
    [title, description, canonicalPath, ogImage, ogType, noIndex])
}
