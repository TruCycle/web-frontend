export type TrackingConsentStatus = 'accepted' | 'rejected' | 'unknown'

type StoredTrackingConsent = {
  readonly status: Exclude<TrackingConsentStatus, 'unknown'>
  readonly updatedAt: number
}

const STORAGE_KEY = 'tc-tracking-consent'
const REJECT_REPROMPT_INTERVAL_MS = 20 * 24 * 60 * 60 * 1000
const CONSENT_CHANGED_EVENT = 'tc:tracking-consent-changed'
let sessionConsent: StoredTrackingConsent | null = null
let useSessionChoice = false

function parseStoredTrackingConsent(value: string | null): StoredTrackingConsent | null {
  if (!value) {
    return null
  }

  try {
    const parsed = JSON.parse(value) as Partial<StoredTrackingConsent>

    if (
      (parsed.status === 'accepted' || parsed.status === 'rejected') &&
      typeof parsed.updatedAt === 'number' && Number.isFinite(parsed.updatedAt)
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
  if (typeof window === 'undefined') return 'unknown'
  let storedConsent = sessionConsent
  if (!useSessionChoice) {
    try {
      storedConsent = parseStoredTrackingConsent(window.localStorage.getItem(STORAGE_KEY))
    } catch {
      // With blocked storage, explicit choices last for this document only.
    }
  }

  if (!storedConsent) {
    return 'unknown'
  }

  if (storedConsent.status === 'accepted') {
    return 'accepted'
  }

  if (now - storedConsent.updatedAt < REJECT_REPROMPT_INTERVAL_MS) {
    return 'rejected'
  }

  return 'unknown'
}

export function setTrackingConsentStatus(
  status: Exclude<TrackingConsentStatus, 'unknown'>,
  now = Date.now(),
): void {
  if (typeof window === 'undefined') return

  const storedConsent: StoredTrackingConsent = {
    status,
    updatedAt: now,
  }

  sessionConsent = storedConsent
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storedConsent))
    useSessionChoice = false
  } catch {
    useSessionChoice = true
    // Keep a session-only explicit choice; never infer consent from an error.
  }
  window.dispatchEvent(new Event(CONSENT_CHANGED_EVENT))
}

export function subscribeTrackingConsent(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return
    sessionConsent = parseStoredTrackingConsent(event.newValue)
    useSessionChoice = false
    onChange()
  }
  window.addEventListener(CONSENT_CHANGED_EVENT, onChange)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(CONSENT_CHANGED_EVENT, onChange)
    window.removeEventListener('storage', onStorage)
  }
}
