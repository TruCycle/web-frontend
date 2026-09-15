import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthSession } from '@/shared/context/useAuthSession'
import { env } from '@/shared/lib/config/env'
import {
  type GoogleCredentialResponse,
  loadGsiScript,
} from '@/shared/lib/google/googleIdentity'
import { ApiError } from '@/shared/types/network'
import { useToast } from '@/shared/ui/toast/useToast'

interface UseGoogleOneTapOptions {
  /** Where to redirect after successful Google One Tap sign-in. Defaults to '/dashboard'. */
  readonly redirectTo?: string
  /** Set to true to disable One Tap prompt (e.g. when already authenticated). */
  readonly disabled?: boolean
  /** Google One Tap prompt context. */
  readonly context?: 'signin' | 'signup' | 'use'
  /** Automatically select the account if only one is logged into Google. */
  readonly autoSelect?: boolean
  /** Dismiss the prompt when the user clicks outside. Defaults to true. */
  readonly cancelOnTapOutside?: boolean
}

/**
 * Automatically displays Google's native One Tap sign-in prompt on the page.
 * Safely skips when VITE_GOOGLE_CLIENT_ID is missing or when disabled is true.
 */
export function useGoogleOneTap({
  redirectTo = '/dashboard',
  disabled = false,
  context = 'signin',
  autoSelect = false,
  cancelOnTapOutside = true,
}: UseGoogleOneTapOptions = {}) {
  const navigate = useNavigate()
  const { loginWithGoogle, isAuthenticated } = useAuthSession()
  const { success, error } = useToast()

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
    if (!clientId || disabled || isAuthenticated) {
      return
    }

    let cancelled = false

    void loadGsiScript()
      .then(() => {
        if (cancelled) {
          return
        }
        const accountsId = window.google?.accounts?.id
        if (!accountsId) {
          return
        }

        accountsId.initialize({
          client_id: clientId,
          callback: handleCredential,
          auto_select: autoSelect,
          cancel_on_tap_outside: cancelOnTapOutside,
          context,
        })

        accountsId.prompt((notification) => {
          if (import.meta.env.DEV) {
            if (notification.isNotDisplayed()) {
              console.debug(
                '[Google One Tap] Not displayed:',
                notification.getNotDisplayedReason(),
              )
            } else if (notification.isSkippedMoment()) {
              console.debug(
                '[Google One Tap] Skipped:',
                notification.getSkippedReason(),
              )
            } else if (notification.isDismissedMoment()) {
              console.debug(
                '[Google One Tap] Dismissed:',
                notification.getDismissedReason(),
              )
            }
          }
        })
      })
      .catch((err) => {
        if (import.meta.env.DEV) {
          console.warn('[Google One Tap] Failed to initialize:', err)
        }
      })

    return () => {
      cancelled = true
      window.google?.accounts?.id?.cancel()
    }
  }, [
    autoSelect,
    cancelOnTapOutside,
    context,
    disabled,
    handleCredential,
    isAuthenticated,
  ])
}
