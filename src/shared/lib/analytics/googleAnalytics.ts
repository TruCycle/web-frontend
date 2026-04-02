const GOOGLE_ANALYTICS_MEASUREMENT_ID = 'G-JLFGRXSGYK'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

export function trackPageView(pagePath: string): void {
  window.gtag?.('config', GOOGLE_ANALYTICS_MEASUREMENT_ID, {
    page_path: pagePath,
  })
}
