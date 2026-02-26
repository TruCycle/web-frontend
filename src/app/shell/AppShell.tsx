import { type ReactNode } from 'react'
import { classNames } from '@/shared/utils/classNames'
import { NavLink, type NavLinkRenderProps, useLocation, useNavigate } from 'react-router-dom'
import {
  FileText,
  Users,
  Settings,
  HelpCircle
} from 'lucide-react'
import { useNotifications } from '@/features/notifications/hooks/useNotifications'
import logo from '@/assets/logo.svg'
import { useUserRole } from '@/shared/context/useUserRole'

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
  return classNames(
    'group flex items-center gap-3.5 rounded-lg px-4 py-2 text-[0.9rem] font-medium text-white transition [&>svg]:text-white',
    isActive
      ? 'bg-tc-shell-active text-white opacity-100 [&>span]:font-semibold [&>svg]:text-tc-shell-accent'
      : 'opacity-60 hover:opacity-100',
  )
}

export function AppShell({ children }: AppShellProps) {
  const { unreadCount, isLoading } = useNotifications()
  const { role, setRole } = useUserRole()
  const location = useLocation()
  const navigate = useNavigate()

  function onRoleChange(nextRole: 'collector' | 'donor') {
    setRole(nextRole)

    if (location.pathname.startsWith('/support')) {
      navigate(`/support/${nextRole}`)
    }
  }

  return (
    <div className="flex min-h-screen bg-tc-app-canvas text-tc-app-text max-md:flex-col max-md:p-2">
      <aside className="sticky top-4 z-10 my-4 ml-4 mr-0 flex h-[calc(100vh-2rem)] w-[250px] shrink-0 flex-col rounded-[25px] bg-tc-shell-bg px-4 py-5 max-[1024px]:w-[220px] max-md:relative max-md:top-auto max-md:m-0 max-md:mb-2 max-md:h-auto max-md:w-full">
        <div className="px-3 pb-4 pt-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center">
              <img src={logo} alt="TruCycle Logo" width="34" height="34" />
            </div>
            <span className="text-2xl font-bold tracking-[-0.01em] text-white">TruCycle</span>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-2 overflow-visible">
          <div className="flex flex-col gap-1">
            <NavLink className={navLinkClassName} to="/">
              <DashboardIcon />
              <span>Dashboard</span>
            </NavLink>
            {role === 'collector' ? (
              <>
                <NavLink className={navLinkClassName} to="/browse">
                  <FileText size={20} />
                  <span>Browse Items</span>
                </NavLink>
                <NavLink className={navLinkClassName} to="/collected">
                  <Users size={20} />
                  <span>My Selected Items</span>
                </NavLink>
              </>
            ) : (
              <>
                <NavLink className={navLinkClassName} to="/listings">
                  <FileText size={20} />
                  <span>My Listed Items</span>
                </NavLink>
                <NavLink className={navLinkClassName} to="/partner-shops">
                  <Users size={20} />
                  <span>Partner Shops</span>
                </NavLink>
              </>
            )}
            <NavLink className={navLinkClassName} to="/messages">
              <MessageIcon />
              <span>Messages</span>
            </NavLink>
          </div>

          <div className="-mx-4 my-4 h-px bg-tc-shell-divider" />

          <div className="flex flex-col gap-1">
            <NavLink className={navLinkClassName} to="/notifications">
              {({ isActive }) => (
                <>
                  <div className="relative flex items-center justify-center">
                    <BellIcon />
                    {!isLoading && unreadCount > 0 && (
                      <span
                        className={classNames(
                          'absolute -right-1.5 top-0 inline-block h-2 w-2 rounded-full border-[1.5px] bg-tc-shell-notify',
                          isActive
                            ? 'border-tc-shell-active'
                            : 'border-tc-shell-bg',
                        )}
                      />
                    )}
                  </div>
                  <span>Notifications</span>
                </>
              )}
            </NavLink>
            <NavLink className={navLinkClassName} to="/settings">
              <Settings size={20} />
              <span>Settings</span>
            </NavLink>
            <NavLink className={navLinkClassName} to={`/support/${role}`}>
              <HelpCircle size={20} />
              <span>Support & FAQs</span>
            </NavLink>
          </div>

          <div className="mt-auto flex justify-center pb-2 pt-3">
            <div className="flex h-[50px] w-fit items-center gap-1 rounded-[10px] border border-tc-shell-accent bg-tc-shell-toggle p-1">
              <button
                className={classNames(
                  'h-full flex-1 rounded-[5px] px-4 text-[0.85rem] font-bold transition',
                  role === 'collector'
                    ? 'bg-tc-shell-accent text-tc-shell-roleActiveText shadow-tc-role-active'
                    : 'bg-transparent text-tc-shell-roleText',
                )}
                onClick={() => onRoleChange('collector')}
              >
                Collector
              </button>
              <button
                className={classNames(
                  'h-full flex-1 rounded-[5px] px-4 text-[0.85rem] font-bold transition',
                  role === 'donor'
                    ? 'bg-tc-shell-accent text-tc-shell-roleActiveText shadow-tc-role-active'
                    : 'bg-transparent text-tc-shell-roleText',
                )}
                onClick={() => onRoleChange('donor')}
              >
                Donor
              </button>
            </div>
          </div>
        </nav>
      </aside>

      <main className="flex h-screen flex-1 flex-col overflow-x-hidden bg-transparent max-md:h-auto max-md:rounded-2xl">
        <header className="sticky top-0 z-[100] flex h-[72px] w-full items-center justify-end border-b border-tc-header-border bg-white px-6">
          <div className="flex items-center gap-4">
            <button className="relative flex items-center justify-center p-2 text-tc-app-text opacity-80 transition hover:opacity-100">
              <BellIcon />
              {!isLoading && unreadCount > 0 && (
                <span className="absolute right-[3px] top-[6px] inline-block h-2 w-2 rounded-full border-[1.5px] border-white bg-tc-shell-notify" />
              )}
            </button>
            <div className="mx-1 h-6 w-px bg-tc-header-divider" />
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-tc-header-avatar text-[0.85rem] font-bold text-white">
              <span>P</span>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto px-8 pb-8 pt-6 max-md:px-4 max-md:pb-6">{children}</div>
      </main>
    </div>
  )
}
