import { createContext, useContext } from 'react'

export type UserRole = 'spotter' | 'collector' | 'donor'

interface UserRoleContextType {
  role: UserRole
  isDonorMode: boolean
  isSpotterMode: boolean
  isCollectorMode: boolean
  setRole: (role: UserRole) => void
  toggleRole: () => void
}

export const UserRoleContext = createContext<UserRoleContextType | undefined>(undefined)

export function useUserRole() {
  const context = useContext(UserRoleContext)
  if (context === undefined) {
    throw new Error('useUserRole must be used within a UserRoleProvider')
  }
  return context
}
