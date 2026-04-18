import { env } from '@/shared/lib/config/env'

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

export function initMetaPixel(): void {
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
  window.fbq?.('track', 'PageView')
}

export function trackMetaEvent(
  eventName: string,
  params?: Record<string, unknown>,
): void {
  window.fbq?.('track', eventName, params)
}