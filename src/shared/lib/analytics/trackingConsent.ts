export type TrackingConsentStatus = 'accepted' | 'rejected' | 'unknown'

type StoredTrackingConsent = {
  readonly status: Exclude<TrackingConsentStatus, 'unknown'>
  readonly updatedAt: number
}

const STORAGE_KEY = 'tc-tracking-consent'
const REJECT_REPROMPT_INTERVAL_MS = 20 * 24 * 60 * 60 * 1000

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function parseStoredTrackingConsent(value: string | null): StoredTrackingConsent | null {
  if (!value) {
    return null
  }

  try {
    const parsed = JSON.parse(value) as Partial<StoredTrackingConsent>

    if (
      (parsed.status === 'accepted' || parsed.status === 'rejected') &&
      typeof parsed.updatedAt === 'number'
    ) {
      return {
        status: parsed.status,
        updatedAt: parsed.updatedAt,
      }
    }
  } catch {
    return null
  }

  return null
}

export function getTrackingConsentStatus(now = Date.now()): TrackingConsentStatus {
  if (!canUseStorage()) {
    return 'unknown'
  }

  const storedConsent = parseStoredTrackingConsent(window.localStorage.getItem(STORAGE_KEY))

  if (!storedConsent) {
    return 'unknown'
  }

  if (storedConsent.status === 'accepted') {
    return 'accepted'
  }

  if (now - storedConsent.updatedAt < REJECT_REPROMPT_INTERVAL_MS) {
    return 'rejected'
  }

  window.localStorage.removeItem(STORAGE_KEY)
  return 'unknown'
}

export function setTrackingConsentStatus(
  status: Exclude<TrackingConsentStatus, 'unknown'>,
  now = Date.now(),
): void {
  if (!canUseStorage()) {
    return
  }

  const storedConsent: StoredTrackingConsent = {
    status,
    updatedAt: now,
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storedConsent))
}