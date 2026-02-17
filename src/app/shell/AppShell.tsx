import { type ReactNode, useState } from 'react'
import { NavLink, type NavLinkRenderProps } from 'react-router-dom'
import {
  FileText,
  Users,
  Settings,
  HelpCircle
} from 'lucide-react'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import logo from '@/assets/logo.svg'
import bellIcon from '@/assets/icons/bell-icons.svg'
import dashboardIcon from '@/assets/icons/dashboard.svg'
import messageIcon from '@/assets/icons/message-icon.svg'
import './AppShell.css'

interface AppShellProps {
  readonly children: ReactNode
}

function navLinkClassName({ isActive }: NavLinkRenderProps): string {
  return isActive ? 'shell-nav-link shell-nav-link-active' : 'shell-nav-link'
}

export function AppShell({ children }: AppShellProps) {
  const { unreadCount } = useNotifications()
  const [role, setRole] = useState<'collector' | 'donor'>('collector')

  const handleRoleChange = (newRole: 'collector' | 'donor') => {
    setRole(newRole)
  }

  return (
    <div className="app-shell">
      <aside className="shell-sidebar">
        <div className="shell-logo-container">
          <div className="shell-logo">
            <div className="logo-icon">
              <img src={logo} alt="TruCycle Logo" width="34" height="34" />
            </div>
            <span className="logo-text">TruCycle</span>
          </div>
        </div>

        <nav className="shell-sidebar-nav">
          <div className="nav-group">
            <NavLink className={navLinkClassName} to="/dashboard">
              <img src={dashboardIcon} alt="" aria-hidden width="20" height="20" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink className={navLinkClassName} to="/">
              <FileText size={20} />
              <span>Browse Items</span>
            </NavLink>
            <NavLink className={navLinkClassName} to="/collected">
              <Users size={20} />
              <span>My Collected Items</span>
            </NavLink>
            <NavLink className={navLinkClassName} to="/messages">
              <img src={messageIcon} alt="" aria-hidden width="20" height="20" />
              <span>Messages</span>
            </NavLink>
          </div>

          <div className="nav-divider" />

          <div className="nav-group">
            <NavLink className={navLinkClassName} to="/notifications">
              <div className="nav-icon-wrapper">
                <img src={bellIcon} alt="" aria-hidden width="20" height="20" />
                {unreadCount > 0 && <span className="notification-dot" />}
              </div>
              <span>Notifications</span>
            </NavLink>
            <NavLink className={navLinkClassName} to="/settings">
              <Settings size={20} />
              <span>Settings</span>
            </NavLink>
            <NavLink className={navLinkClassName} to="/support">
              <HelpCircle size={20} />
              <span>Support & FAQs</span>
            </NavLink>
          </div>

          <div className="role-toggle-container">
            <div className="role-toggle">
              <button
                className={`role-btn ${role === 'collector' ? 'active' : ''}`}
                onClick={() => handleRoleChange('collector')}
              >
                Collector
              </button>
              <button
                className={`role-btn ${role === 'donor' ? 'active' : ''}`}
                onClick={() => handleRoleChange('donor')}
              >
                Donor
              </button>
            </div>
          </div>
        </nav>
      </aside>

      <main className="shell-main-area">
        <header className="shell-top-header">
          <div className="header-right">
            <button className="icon-btn">
              <img src={bellIcon} alt="" aria-hidden width="20" height="20" />
              {unreadCount > 0 && <span className="notification-dot" />}
            </button>
            <div className="user-profile">
              <span className="user-initial">P</span>
            </div>
          </div>
        </header>
        <div className="shell-content">{children}</div>
      </main>
    </div>
  )
}
