import { useEffect } from 'react'
import {
  BRAND_NAME,
  DEFAULT_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  SITE_ORIGIN,
} from '@/shared/lib/config/seoConstants'

type PageMetaOptions = {
  /** Full page title. Falls back to DEFAULT_TITLE. */
  readonly title?: string
  /** Meta description. Falls back to DEFAULT_DESCRIPTION. */
  readonly description?: string
  /** Path portion appended to SITE_ORIGIN for <link rel="canonical">. e.g. '/' or '/privacy' */
  readonly canonicalPath?: string
  /** Relative path to OG image. Falls back to DEFAULT_OG_IMAGE. */
  readonly ogImage?: string
  /** OG type. Defaults to 'website'. */
  readonly ogType?: string
  /** If true, injects <meta name="robots" content="noindex, nofollow">. */
  readonly noIndex?: boolean
}

/**
 * Manages `<title>` and `<meta>` tags for SEO.
 *
 * Call once per route component with route-specific data.
 * On unmount the tags are removed so the next route can set its own.
 */
export function usePageMeta(options: PageMetaOptions = {}): void {
  const {
    title = DEFAULT_TITLE,
    description = DEFAULT_DESCRIPTION,
    canonicalPath,
    ogImage = DEFAULT_OG_IMAGE,
    ogType = 'website',
    noIndex = false,
  } = options

  useEffect(() => {
    // --- title ---
    const previousTitle = document.title
    document.title = title

    // --- helper to create / update a <meta> tag ---
    const managedElements: HTMLElement[] = []

    function ensureMeta(
      attr: 'name' | 'property',
      key: string,
      content: string,
    ): void {
      const selector = `meta[${attr}="${key}"]`
      let el = document.head.querySelector<HTMLMetaElement>(selector)

      if (el) {
        el.setAttribute('content', content)
      } else {
        el = document.createElement('meta')
        el.setAttribute(attr, key)
        el.setAttribute('content', content)
        document.head.appendChild(el)
        managedElements.push(el)
      }
    }

    function ensureLink(rel: string, href: string): void {
      const selector = `link[rel="${rel}"]`
      let el = document.head.querySelector<HTMLLinkElement>(selector)

      if (el) {
        el.setAttribute('href', href)
      } else {
        el = document.createElement('link')
        el.setAttribute('rel', rel)
        el.setAttribute('href', href)
        document.head.appendChild(el)
        managedElements.push(el)
      }
    }

    // --- description ---
    ensureMeta('name', 'description', description)

    // --- robots ---
    if (noIndex) {
      ensureMeta('name', 'robots', 'noindex, nofollow')
    } else {
      // Remove any stale noindex meta left by a previous page
      const robotsMeta = document.head.querySelector<HTMLMetaElement>(
        'meta[name="robots"]',
      )
      if (robotsMeta) {
        robotsMeta.remove()
      }
    }

    // --- canonical ---
    if (canonicalPath != null) {
      ensureLink('canonical', `${SITE_ORIGIN}${canonicalPath}`)
    }

    // --- Open Graph ---
    const absoluteOgImage = ogImage.startsWith('http')
      ? ogImage
      : `${SITE_ORIGIN}${ogImage}`

    ensureMeta('property', 'og:title', title)
    ensureMeta('property', 'og:description', description)
    ensureMeta('property', 'og:image', absoluteOgImage)
    ensureMeta('property', 'og:type', ogType)
    ensureMeta('property', 'og:site_name', BRAND_NAME)
    ensureMeta('property', 'og:locale', 'en_GB')

    if (canonicalPath != null) {
      ensureMeta('property', 'og:url', `${SITE_ORIGIN}${canonicalPath}`)
    }

    // --- Twitter Card ---
    ensureMeta('name', 'twitter:card', 'summary_large_image')
    ensureMeta('name', 'twitter:title', title)
    ensureMeta('name', 'twitter:description', description)
    ensureMeta('name', 'twitter:image', absoluteOgImage)

    // --- cleanup on unmount ---
    return () => {
      document.title = previousTitle
      for (const el of managedElements) {
        el.remove()
      }
    }
  }, [title, description, canonicalPath, ogImage, ogType, noIndex])
}
