import { type ReactNode } from 'react'
import { NavLink, type NavLinkRenderProps } from 'react-router-dom'
import {
  FileText,
  Users,
  Settings,
  HelpCircle
} from 'lucide-react'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import logo from '@/assets/logo.svg'
import { useUserRole } from '@/shared/context/UserRoleContext'
import './AppShell.css'

const DashboardIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.1667 11.6667V16.6667M11.6667 14.1667H16.6667M5 8.33333H6.66667C7.58714 8.33333 8.33333 7.58714 8.33333 6.66667V5C8.33333 4.07952 7.58714 3.33333 6.66667 3.33333H5C4.07952 3.33333 3.33333 4.07952 3.33333 5V6.66667C3.33333 7.58714 4.07952 8.33333 5 8.33333ZM13.3333 8.33333H15C15.9205 8.33333 16.6667 7.58714 16.6667 6.66667V5C16.6667 4.07952 15.9205 3.33333 15 3.33333H13.3333C12.4129 3.33333 11.6667 4.07952 11.6667 5V6.66667C11.6667 7.58714 12.4129 8.33333 13.3333 8.33333ZM5 16.6667H6.66667C7.58714 16.6667 8.33333 15.9205 8.33333 15V13.3333C8.33333 12.4129 7.58714 11.6667 6.66667 11.6667H5C4.07952 11.6667 3.33333 12.4129 3.33333 13.3333V15C3.33333 15.9205 4.07952 16.6667 5 16.6667Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
)

const MessageIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.1667 11V12.6667C10.1667 12.8877 10.0789 13.0996 9.92259 13.2559C9.76631 13.4122 9.55435 13.5 9.33333 13.5H3.5L1 16V7.66667C1 7.44565 1.0878 7.23369 1.24408 7.07741C1.40036 6.92113 1.61232 6.83333 1.83333 6.83333H3.5M16 10.1667L13.5 7.66667H7.66667C7.44565 7.66667 7.23369 7.57887 7.07741 7.42259C6.92113 7.26631 6.83333 7.05435 6.83333 6.83333V1.83333C6.83333 1.61232 6.92113 1.40036 7.07741 1.24408C7.23369 1.0878 7.44565 1 7.66667 1H15.1667C15.3877 1 15.5996 1.0878 15.7559 1.24408C15.9122 1.40036 16 1.61232 16 1.83333V10.1667Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
)

const BellIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size + 4} viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.01383 0.768566C5.62189 0.768566 2.86529 3.52516 2.86529 6.9171V9.87864C2.86529 10.5037 2.59886 11.4568 2.28118 11.9896L1.10271 13.9469C0.375137 15.1561 0.877267 16.4986 2.20945 16.9495C6.62615 18.4251 11.3913 18.4251 15.808 16.9495C17.0479 16.5396 17.591 15.0742 16.9147 13.9469L15.7362 11.9896C15.4288 11.4568 15.1624 10.5037 15.1624 9.87864V6.9171C15.1624 3.53541 12.3955 0.768566 9.01383 0.768566Z" stroke="currentColor" stroke-width="1.53713" stroke-miterlimit="10" stroke-linecap="round" />
    <path d="M12.0881 17.3184C12.0881 19.0092 10.7047 20.3926 9.01384 20.3926C8.17354 20.3926 7.39473 20.0442 6.84136 19.4908C6.28799 18.9375 5.93958 18.1587 5.93958 17.3184" stroke="currentColor" stroke-width="1.53713" stroke-miterlimit="10" />
  </svg>
)

interface AppShellProps {
  readonly children: ReactNode
}

function navLinkClassName({ isActive }: NavLinkRenderProps): string {
  return isActive ? 'shell-nav-link shell-nav-link-active' : 'shell-nav-link'
}

export function AppShell({ children }: AppShellProps) {
  const { unreadCount } = useNotifications()
  const { role, setRole } = useUserRole()

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
              <DashboardIcon />
              <span>Dashboard</span>
            </NavLink>
            <NavLink className={navLinkClassName} to="/">
              <FileText size={20} />
              <span>Browse Items</span>
            </NavLink>
            {role === 'collector' ? (
              <NavLink className={navLinkClassName} to="/collected">
                <Users size={20} />
                <span>My Selected Items</span>
              </NavLink>
            ) : (
              <NavLink className={navLinkClassName} to="/listings">
                <Users size={20} />
                <span>My Listings</span>
              </NavLink>
            )}
            <NavLink className={navLinkClassName} to="/messages">
              <MessageIcon />
              <span>Messages</span>
            </NavLink>
          </div>

          <div className="nav-divider" />

          <div className="nav-group">
            <NavLink className={navLinkClassName} to="/notifications">
              <div className="nav-icon-wrapper">
                <BellIcon />
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
                onClick={() => setRole('collector')}
              >
                Collector
              </button>
              <button
                className={`role-btn ${role === 'donor' ? 'active' : ''}`}
                onClick={() => setRole('donor')}
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
              <BellIcon />
              {unreadCount > 0 && <span className="notification-dot" />}
            </button>
            <div className="header-divider" />
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
