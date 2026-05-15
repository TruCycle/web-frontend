import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserRole } from '@/shared/context/useUserRole'
import type { UserRole } from '@/shared/context/useUserRole'
import { useToast } from '@/shared/ui/toast/useToast'

const roleLabel: Record<UserRole, string> = {
  spotter: 'Spotter',
  collector: 'Collector',
  donor: 'Donor',
}

interface RunWithRoleOptions {
  readonly path?: string
  readonly onSwitched?: () => void
}

/**
 * Intent-aware role switching: ensures the user is in the requested role before
 * running an action (e.g. tapping "Spot" auto-switches to Spotter mode and
 * surfaces a toast confirmation so the context change is never silent).
 */
export function useIntentSwitch() {
  const { role, setRole } = useUserRole()
  const navigate = useNavigate()
  const { info } = useToast()

  const runWithRole = useCallback(
    (targetRole: UserRole, options: RunWithRoleOptions = {}) => {
      if (role !== targetRole) {
        setRole(targetRole)
        info(`Switched to ${roleLabel[targetRole]} mode`, 'You can change this in the sidebar.')
      }

      if (options.path) {
        navigate(options.path)
      }
      options.onSwitched?.()
    },
    [info, navigate, role, setRole],
  )

  return { runWithRole, currentRole: role }
}
