import { useCallback, useState } from 'react'
import {
  getTrackingConsentStatus,
  setTrackingConsentStatus,
  type TrackingConsentStatus,
} from '@/shared/lib/analytics/trackingConsent'

type UseTrackingConsentResult = {
  readonly status: TrackingConsentStatus
  readonly accept: () => void
  readonly reject: () => void
}

export function useTrackingConsent(): UseTrackingConsentResult {
  const [status, setStatus] = useState<TrackingConsentStatus>(() => getTrackingConsentStatus())

  const accept = useCallback(() => {
    setTrackingConsentStatus('accepted')
    setStatus('accepted')
  }, [])

  const reject = useCallback(() => {
    setTrackingConsentStatus('rejected')
    setStatus('rejected')
  }, [])

  return {
    status,
    accept,
    reject,
  }
}