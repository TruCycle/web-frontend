import { env } from '@/shared/lib/config/env'
import { getTrackingConsentStatus } from './trackingConsent'
import { clearAnalyticsCookies } from './clearAnalyticsCookies'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

let isInitialized = false

export function syncGoogleAnalyticsConsent(): void {
  if (typeof window === 'undefined' || !env.googleAnalyticsMeasurementId) return
  const accepted = getTrackingConsentStatus() === 'accepted'
  const globals = window as unknown as Record<string, unknown>
  globals[`ga-disable-${env.googleAnalyticsMeasurementId}`] = !accepted
  if (!accepted) {
    if (window.dataLayer) window.dataLayer.length = 0
    window.gtag?.('consent', 'update', {
      analytics_storage: 'denied', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied',
    })
    document.querySelectorAll('script[data-analytics="ga4"]').forEach((script) => script.remove())
    clearAnalyticsCookies((name) => name === '_ga' || name.startsWith('_ga_') || name === '_gid' || name.startsWith('_gat'))
    isInitialized = false
  }
}

export function initGoogleAnalytics(): void {
  if (getTrackingConsentStatus() !== 'accepted') return
  if (isInitialized || !env.googleAnalyticsMeasurementId || typeof window === 'undefined') {
    return
  }

  window.dataLayer = window.dataLayer || []
  window.gtag = window.gtag || function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments)
  }
  syncGoogleAnalyticsConsent()
  window.gtag('consent', 'update', { analytics_storage: 'granted', ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted' })

  if (!document.querySelector(`script[data-analytics="ga4"][src*="${env.googleAnalyticsMeasurementId}"]`)) {
    const script = document.createElement('script')
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(env.googleAnalyticsMeasurementId)}`
    script.dataset.analytics = 'ga4'
    document.head.appendChild(script)
  }

  window.gtag('js', new Date())
  window.gtag('config', env.googleAnalyticsMeasurementId, { send_page_view: false, page_location: window.location.origin + window.location.pathname, page_referrer: '' })
  isInitialized = true
}

export function trackPageView(pagePath: string): void {
  if (getTrackingConsentStatus() !== 'accepted' || !isInitialized || !env.googleAnalyticsMeasurementId) {
    return
  }

  window.gtag?.('event', 'page_view', {
    page_path: pagePath.split(/[?#]/, 1)[0],
    page_location: window.location.origin + pagePath.split(/[?#]/, 1)[0],
    page_referrer: '',
  })
}

export function trackGoogleAnalyticsEvent(
  eventName: string,
  params?: Record<string, unknown>,
): void {
  if (getTrackingConsentStatus() !== 'accepted' || !isInitialized) return
  window.gtag?.('event', eventName, params)
}
