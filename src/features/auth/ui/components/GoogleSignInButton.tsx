import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { env } from '@/shared/lib/config/env'
import { ApiError } from '@/shared/types/network'
import { useToast } from '@/shared/ui/toast/useToast'

const GSI_SRC = 'https://accounts.google.com/gsi/client'

interface GoogleCredentialResponse {
  readonly credential?: string
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
  }) => void
  renderButton: (
    parent: HTMLElement,
    options: Record<string, string | number>,
  ) => void
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

function loadGsiScript(): Promise<void> {
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

interface GoogleSignInButtonProps {
  /** Where to go after a successful sign-in. Defaults to /dashboard. */
  readonly redirectTo?: string
  readonly text?: 'signin_with' | 'signup_with' | 'continue_with'
}

/**
 * Renders Google's official "Sign in with Google" button. On success it
 * exchanges the ID token for a TruCycle session and navigates on.
 * Renders nothing when VITE_GOOGLE_CLIENT_ID is not configured.
 */
export function GoogleSignInButton({
  redirectTo = '/dashboard',
  text = 'continue_with',
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const navigate = useNavigate()
  const { loginWithGoogle } = useAuthSession()
  const { success, error } = useToast()
  const [isReady, setIsReady] = useState(false)

  const handleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!response.credential) {
        error('Google sign-in failed', 'No credential was returned. Please try again.')
        return
      }
      try {
        await loginWithGoogle(response.credential)
        success('Signed in', 'Welcome to TruCycle.')
        navigate(redirectTo)
      } catch (caughtError) {
        const message =
          caughtError instanceof ApiError
            ? caughtError.message
            : 'Unable to sign in with Google right now. Please try again.'
        error('Google sign-in failed', message)
      }
    },
    [error, loginWithGoogle, navigate, redirectTo, success],
  )

  useEffect(() => {
    const clientId = env.googleClientId
    if (!clientId) {
      return
    }

    let cancelled = false
    void loadGsiScript()
      .then(() => {
        if (cancelled || !containerRef.current) {
          return
        }
        const accountsId = window.google?.accounts?.id
        if (!accountsId) {
          return
        }
        accountsId.initialize({ client_id: clientId, callback: handleCredential })
        containerRef.current.replaceChildren()
        accountsId.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text,
          shape: 'pill',
          logo_alignment: 'left',
          width: 320,
        })
        setIsReady(true)
      })
      .catch(() => {
        if (!cancelled) {
          setIsReady(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [handleCredential, text])

  if (!env.googleClientId) {
    return null
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-wide text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <div ref={containerRef} className="flex justify-center" aria-busy={!isReady} />
    </div>
  )
}
