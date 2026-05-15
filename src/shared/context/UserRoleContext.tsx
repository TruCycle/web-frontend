import { useEffect, useState, type ReactNode } from 'react'
import { type UserRole, UserRoleContext } from './useUserRole'

const STORAGE_KEY = 'tc.activeRole'
const ROLE_CYCLE: readonly UserRole[] = ['spotter', 'collector', 'donor']

function readPersistedRole(): UserRole | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === 'spotter' || raw === 'collector' || raw === 'donor') {
      return raw
    }
  } catch {
    // localStorage may be unavailable (Safari private mode); ignore.
  }
  return null
}

function persistRole(role: UserRole): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, role)
  } catch {
    // Ignore quota / privacy errors.
  }
}

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(() => readPersistedRole() ?? 'collector')

  useEffect(() => {
    persistRole(role)
  }, [role])

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole)
  }

  const toggleRole = () => {
    setRoleState((prev) => {
      const index = ROLE_CYCLE.indexOf(prev)
      return ROLE_CYCLE[(index + 1) % ROLE_CYCLE.length]
    })
  }

  const isDonorMode = role === 'donor'
  const isSpotterMode = role === 'spotter'
  const isCollectorMode = role === 'collector'

  return (
    <UserRoleContext.Provider
      value={{ role, isDonorMode, isSpotterMode, isCollectorMode, setRole, toggleRole }}
    >
      {children}
    </UserRoleContext.Provider>
  )
}
