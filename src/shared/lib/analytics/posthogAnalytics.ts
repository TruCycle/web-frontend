import type { PostHog } from 'posthog-js'
import { clearAnalyticsCookies } from './clearAnalyticsCookies'
import { getTrackingConsentStatus } from './trackingConsent'

let client: PostHog | null = null
let loading: Promise<void> | null = null
let isEnabled = false
let pendingPath: string | null = null
let lastPageview: string | null = null
const sensitiveUrlProperties = new Set([
  '$current_url', '$referrer', '$referring_domain', '$initial_current_url',
  '$initial_referrer', '$initial_referring_domain', '$session_entry_url',
])

function withoutUrlProperties(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutUrlProperties)
  if (typeof value !== 'object' || value === null) return value
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !sensitiveUrlProperties.has(key))
    .map(([key, nested]) => [key, withoutUrlProperties(nested)]))
}

function capturePendingPageview(): void {
  if (!client || !isEnabled || getTrackingConsentStatus() !== 'accepted') return
  if (pendingPath === null || pendingPath === lastPageview) return
  client.capture('$pageview', { page_path: pendingPath })
  lastPageview = pendingPath
}

export function syncPostHogConsent(): void {
  if (getTrackingConsentStatus() !== 'accepted') {
    isEnabled = false
    pendingPath = null
    lastPageview = null
    client?.opt_out_capturing()
    client?.stopSessionRecording()
    clearAnalyticsCookies((name) => name.startsWith('ph_'))
    const token = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN?.trim()
    if (typeof window !== 'undefined' && token) {
      try {
        window.localStorage.removeItem(`ph_${token}_posthog`)
        window.sessionStorage.removeItem(`ph_${token}_posthog`)
      } catch { /* Storage may be unavailable; SDK capture remains opted out. */ }
    }
    return
  }
  if (client) {
    if (!isEnabled) client.opt_in_capturing({ captureEventName: false })
    isEnabled = true
    capturePendingPageview()
    return
  }
  const token = import.meta.env.VITE_POSTHOG_PROJECT_TOKEN?.trim()
  if (!token || loading) return
  loading = import('posthog-js').then(({ default: posthog }) => {
    if (getTrackingConsentStatus() !== 'accepted') return
    const host = import.meta.env.VITE_POSTHOG_HOST?.trim()
    posthog.init(token, {
      ...(host ? { api_host: host } : {}), defaults: '2026-01-30',
      opt_out_capturing_by_default: true, opt_out_persistence_by_default: true,
      autocapture: false, capture_pageview: false, capture_pageleave: false,
      disable_session_recording: true, advanced_disable_flags: true,
      disable_external_dependency_loading: true, disable_surveys: true,
      disable_conversations: true, disable_product_tours: true,
      save_campaign_params: false, save_referrer: false,
      property_denylist: [...sensitiveUrlProperties],
      before_send: (event) => getTrackingConsentStatus() === 'accepted'
        ? withoutUrlProperties(event) as typeof event
        : null,
    })
    client = posthog
    // No async boundary occurs between the final consent check and init/opt-in.
    client.opt_in_capturing({ captureEventName: false })
    isEnabled = true
    capturePendingPageview()
  }).catch(() => {
    // Optional analytics must not break the app; a later route/choice may retry.
  }).finally(() => { loading = null })
}

export function trackPostHogPageview(path: string): void {
  if (getTrackingConsentStatus() !== 'accepted') return
  pendingPath = path.split(/[?#]/, 1)[0]
  syncPostHogConsent()
}
