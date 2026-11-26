import { useCallback, useSyncExternalStore } from 'react'
import {
  getTrackingConsentStatus,
  setTrackingConsentStatus,
  subscribeTrackingConsent,
  type TrackingConsentStatus,
} from '@/shared/lib/analytics/trackingConsent'

type UseTrackingConsentResult = {
  readonly status: TrackingConsentStatus
  readonly accept: () => void
  readonly reject: () => void
}

export function useTrackingConsent(): UseTrackingConsentResult {
  const status = useSyncExternalStore<TrackingConsentStatus>(subscribeTrackingConsent, getTrackingConsentStatus, () => 'unknown')

  const accept = useCallback(() => {
    setTrackingConsentStatus('accepted')
  }, [])

  const reject = useCallback(() => {
    setTrackingConsentStatus('rejected')
  }, [])

  return {
    status,
    accept,
    reject,
  }
}
