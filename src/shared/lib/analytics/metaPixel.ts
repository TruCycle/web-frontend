import { env } from '@/shared/lib/config/env'
import { getTrackingConsentStatus } from './trackingConsent'
import { clearAnalyticsCookies } from './clearAnalyticsCookies'

type MetaPixelFunction = ((...args: unknown[]) => void) & {
  readonly callMethod?: (...args: unknown[]) => void
  push?: (...args: unknown[]) => void
  loaded?: boolean
  version?: string
  queue?: unknown[][]
}

declare global {
  interface Window {
    fbq?: MetaPixelFunction
    _fbq?: MetaPixelFunction
  }
}

let isInitialized = false

export function syncMetaPixelConsent(): void {
  if (typeof window === 'undefined') return
  if (getTrackingConsentStatus() === 'accepted') {
    if (isInitialized) window.fbq?.('consent', 'grant')
    return
  }
  if (window.fbq?.queue) window.fbq.queue.length = 0
  window.fbq?.('consent', 'revoke')
  document.querySelectorAll('script[data-analytics="meta-pixel"]').forEach((script) => script.remove())
  clearAnalyticsCookies((name) => name === '_fbp' || name === '_fbc')
  isInitialized = Boolean(window.fbq?.callMethod)
}

export function initMetaPixel(): void {
  if (getTrackingConsentStatus() !== 'accepted') return
  if (isInitialized || !env.metaPixelId || typeof window === 'undefined') {
    return
  }

  if (!window.fbq) {
    const fbq: MetaPixelFunction = function metaPixelQueue(...args: unknown[]) {
      if (fbq.callMethod) {
        fbq.callMethod(...args)
        return
      }

      fbq.queue = [...(fbq.queue ?? []), args]
    }

    fbq.push = (...args: unknown[]) => {
      fbq(...args)
    }
    fbq.loaded = true
    fbq.version = '2.0'
    fbq.queue = []

    window.fbq = fbq
    window._fbq = fbq
  }

  window.fbq('consent', 'grant')
  if (!document.querySelector('script[data-analytics="meta-pixel"]')) {
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    script.dataset.analytics = 'meta-pixel'
    document.head.appendChild(script)
  }

  window.fbq('init', env.metaPixelId)
  isInitialized = true
}

export function trackMetaPageView(): void {
  if (getTrackingConsentStatus() !== 'accepted' || !isInitialized) return
  window.fbq?.('track', 'PageView')
}

export function trackMetaEvent(
  eventName: string,
  params?: Record<string, unknown>,
): void {
  if (getTrackingConsentStatus() !== 'accepted' || !isInitialized) return
  window.fbq?.('track', eventName, params)
}
