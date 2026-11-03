import { Link, useLocation } from 'react-router-dom'
import { Camera, PlusCircle, Truck } from 'lucide-react'

const actions = [
  { key: 'spot', label: 'Spot', description: 'Spot an item', path: '/found-items/post', icon: Camera },
  { key: 'list', label: 'List', description: 'List an item', path: '/listings', icon: PlusCircle },
  { key: 'rescue', label: 'Rescue', description: 'Rescue an item', path: '/map', icon: Truck },
] as const

/** Navigation is independent of the selected dashboard mode. */
export function IntentFab() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/found-items/post')) return null

  return (
    <nav aria-label="Item actions" className="flex shrink-0 justify-center gap-2 border-t border-slate-200 bg-white px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      {actions.map(({ key, label, description, path, icon: Icon }) => (
        <Link key={key} to={path} aria-label={description}
          className="flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-tc-app-secondary transition hover:bg-tc-app-primary/20 sm:max-w-44"
          aria-current={pathname === path ? 'page' : undefined}>
          <Icon size={20} aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  )
}
