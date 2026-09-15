const GSI_SRC = 'https://accounts.google.com/gsi/client'

export interface GoogleCredentialResponse {
  readonly credential?: string
  readonly select_by?: string
}

export interface GooglePromptNotification {
  isNotDisplayed: () => boolean
  isSkippedMoment: () => boolean
  isDismissedMoment: () => boolean
  getNotDisplayedReason: () => string
  getSkippedReason: () => string
  getDismissedReason: () => string
  getMomentType: () => string
}

export interface GoogleAccountsId {
  initialize: (config: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
    prompt_parent_id?: string
    itp_support?: boolean
    use_fedcm_for_prompt?: boolean
    context?: 'signin' | 'signup' | 'use'
  }) => void
  renderButton: (
    parent: HTMLElement,
    options: Record<string, string | number | boolean>,
  ) => void
  prompt: (momentListener?: (notification: GooglePromptNotification) => void) => void
  cancel: () => void
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId
      }
    }
  }
}

let scriptPromise: Promise<void> | null = null

export function loadGsiScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve()
  }
  if (window.google?.accounts?.id) {
    return Promise.resolve()
  }
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`)
      if (existing) {
        existing.addEventListener('load', () => resolve())
        existing.addEventListener('error', () => reject(new Error('Failed to load Google script')))
        return
      }
      const script = document.createElement('script')
      script.src = GSI_SRC
      script.async = true
      script.defer = true
      script.onload = () => resolve()
      script.onerror = () => {
        scriptPromise = null
        reject(new Error('Failed to load Google script'))
      }
      document.head.appendChild(script)
    })
  }
  return scriptPromise
}
