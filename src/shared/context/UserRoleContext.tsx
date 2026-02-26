import { useState, type ReactNode } from 'react'
import { type UserRole, UserRoleContext } from './useUserRole'

export function UserRoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole>('collector')

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole)
  }

  const toggleRole = () => {
    setRoleState((prev) => (prev === 'collector' ? 'donor' : 'collector'))
  }

  const isDonorMode = role === 'donor'

  return (
    <UserRoleContext.Provider value={{ role, isDonorMode, setRole, toggleRole }}>
      {children}
    </UserRoleContext.Provider>
  )
}
