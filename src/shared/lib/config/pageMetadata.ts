import { BRAND_NAME, DEFAULT_DESCRIPTION, DEFAULT_OG_IMAGE, DEFAULT_TITLE, SITE_ORIGIN } from './seoConstants'

export interface PageMetaOptions {
  readonly title?: string
  readonly description?: string
  readonly canonicalPath?: string
  readonly ogImage?: string
  readonly ogType?: string
  readonly noIndex?: boolean
}

interface ManagedValue { selector: string; attribute: string; original: string | null; element: HTMLElement | null }
interface MetadataState {
  title: string
  baselineNoIndex: boolean
  permanentNoIndex: boolean
  values: Map<string, ManagedValue>
  owners: Map<symbol, { options: PageMetaOptions; staging: boolean }>
}
const states = new WeakMap<Document, MetadataState>()

/** Head ownership survives StrictMode and overlapping lazy-route lifetimes. */
export function applyPageMetadata(document: Document, options: PageMetaOptions, staging = false): () => void {
  let state = states.get(document)
  if (!state) {
    state = { title: document.title, baselineNoIndex: /(?:^|[\s,])noindex(?:$|[\s,])/i.test(document.head.querySelector('meta[name="robots"]')?.getAttribute('content') ?? ''), permanentNoIndex: staging, values: new Map(), owners: new Map() }
    states.set(document, state)
  }
  const owner = Symbol('page metadata')
  state.permanentNoIndex ||= staging
  state.owners.set(owner, { options, staging })
  const current = state
  function set(selector: string, attribute: string, value: string | null, create: () => HTMLElement) {
    if (!current.values.has(selector)) {
      const element = document.head.querySelector<HTMLElement>(selector)
      current.values.set(selector, { selector, attribute, original: element?.getAttribute(attribute) ?? null, element })
    }
    let element = document.head.querySelector<HTMLElement>(selector)
    if (value === null) { element?.remove(); return }
    if (!element) { element = create(); document.head.appendChild(element) }
    element.setAttribute(attribute, value)
  }
  function meta(attribute: 'name' | 'property', key: string, value: string | null) {
    set(`meta[${attribute}="${key}"]`, 'content', value, () => {
      const element = document.createElement('meta'); element.setAttribute(attribute, key); return element
    })
  }
  function link(rel: string, value: string | null) {
    set(`link[rel="${rel}"]${rel === 'alternate' ? '[hreflang="en-GB"]' : ''}`, 'href', value, () => {
      const element = document.createElement('link'); element.rel = rel; if (rel === 'alternate') element.hreflang = 'en-GB'; return element
    })
  }
  function render() {
    const active = [...current.owners.values()].at(-1)
    if (!active) {
      document.title = current.title
      for (const value of current.values.values()) {
        const existing = document.head.querySelector(value.selector)
        if (!value.element) existing?.remove()
        else {
          if (existing !== value.element) existing?.remove()
          if (!value.element.isConnected) document.head.appendChild(value.element)
          if (value.original === null) value.element.removeAttribute(value.attribute)
          else value.element.setAttribute(value.attribute, value.original)
        }
      }
      if (current.permanentNoIndex) meta('name', 'robots', 'noindex, nofollow, noarchive')
      states.delete(document)
      return
    }
    const { title = DEFAULT_TITLE, description = DEFAULT_DESCRIPTION, ogImage = DEFAULT_OG_IMAGE, ogType = 'website', canonicalPath, noIndex = false } = active.options
    // Query strings/fragments (including verification tokens) never enter metadata.
    const canonical = canonicalPath?.startsWith('/') && !canonicalPath.startsWith('//') && !/[?#\\]/.test(canonicalPath) ? `${SITE_ORIGIN}${canonicalPath}` : null
    let image = `${SITE_ORIGIN}${DEFAULT_OG_IMAGE}`
    try { const candidate = new URL(ogImage, SITE_ORIGIN); if (candidate.protocol === 'https:' && !candidate.username && !candidate.password) image = candidate.href } catch { /* Keep the public default. */ }
    document.title = title
    meta('name', 'description', description)
    meta('name', 'robots', noIndex || current.permanentNoIndex || current.baselineNoIndex ? 'noindex, nofollow, noarchive' : 'index, follow')
    link('canonical', canonical); link('alternate', canonical)
    meta('property', 'og:url', canonical)
    for (const [key, value] of Object.entries({ title, description, image, type: ogType, site_name: BRAND_NAME, locale: 'en_GB' })) meta('property', `og:${key}`, value)
    meta('property', 'og:image:width', ogImage === DEFAULT_OG_IMAGE ? '512' : null)
    meta('property', 'og:image:height', ogImage === DEFAULT_OG_IMAGE ? '512' : null)
    for (const [key, value] of Object.entries({ card: 'summary_large_image', title, description, image })) meta('name', `twitter:${key}`, value)
  }
  render()
  return () => { if (current.owners.delete(owner) && states.get(document) === current) render() }
}
