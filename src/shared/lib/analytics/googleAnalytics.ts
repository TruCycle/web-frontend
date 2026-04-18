import { env } from '@/shared/lib/config/env'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

let isInitialized = false

export function initGoogleAnalytics(): void {
  if (isInitialized || !env.googleAnalyticsMeasurementId || typeof window === 'undefined') {
    return
  }

  window.dataLayer = window.dataLayer || []
  window.gtag = window.gtag || function gtag(...args: unknown[]) {
    window.dataLayer?.push(args)
  }

  if (!document.querySelector(`script[data-analytics="ga4"][src*="${env.googleAnalyticsMeasurementId}"]`)) {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(env.googleAnalyticsMeasurementId)}`
    script.dataset.analytics = 'ga4'
    document.head.appendChild(script)
  }

  window.gtag('js', new Date())
  window.gtag('config', env.googleAnalyticsMeasurementId, { send_page_view: false })
  isInitialized = true
}

export function trackPageView(pagePath: string): void {
  if (!env.googleAnalyticsMeasurementId) {
    return
  }

  window.gtag?.('config', env.googleAnalyticsMeasurementId, {
    page_path: pagePath,
  })
}

export function trackGoogleAnalyticsEvent(
  eventName: string,
  params?: Record<string, unknown>,
): void {
  window.gtag?.('event', eventName, params)
}
