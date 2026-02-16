import type { ReactNode } from 'react'
import { NavLink, type NavLinkRenderProps } from 'react-router-dom'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import { NotificationBadge } from '@/features/notifications/ui/NotificationBadge'
import './AppShell.css'

interface AppShellProps {
  readonly children: ReactNode
}

function navLinkClassName({ isActive }: NavLinkRenderProps): string {
  return isActive ? 'shell-nav-link shell-nav-link-active' : 'shell-nav-link'
}

export function AppShell({ children }: AppShellProps) {
  const { unreadCount, isLoading } = useNotifications()

  return (
    <div className="app-shell">
      <header className="shell-header">
        <div>
          <p className="shell-title">TruCycle</p>
          <p className="shell-subtitle">Feature-first frontend starter</p>
        </div>
        <nav className="shell-nav" aria-label="Primary navigation">
          <NavLink className={navLinkClassName} to="/">
            Home
          </NavLink>
          <NavLink className={navLinkClassName} to="/messages">
            Messages
          </NavLink>
          <NavLink className={navLinkClassName} to="/notifications">
            Notifications
            <NotificationBadge isLoading={isLoading} unreadCount={unreadCount} />
          </NavLink>
        </nav>
      </header>
      <main className="shell-main">{children}</main>
    </div>
  )
}
