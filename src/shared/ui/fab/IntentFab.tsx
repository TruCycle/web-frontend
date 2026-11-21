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
    <nav aria-label="Item actions" className="flex shrink-0 justify-center gap-2 border-t border-tc-brand-line bg-white px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:fixed lg:bottom-6 lg:right-6 lg:z-[80] lg:flex-col lg:gap-3 lg:border-t-0 lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-0">
      {actions.map(({ key, label, description, path, icon: Icon }) => (
        <Link key={key} to={path} aria-label={description}
          className="tc-fab-bob relative flex min-h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-tc-md px-3 text-sm font-semibold text-tc-brand-body transition max-lg:!animate-none max-lg:hover:bg-tc-brand-soft max-lg:aria-[current=page]:bg-tc-brand-mintSoft max-lg:aria-[current=page]:text-tc-brand-deep sm:max-w-44 lg:h-14 lg:w-14 lg:flex-none lg:rounded-full lg:px-0 lg:shadow-tc-raised lg:transition-[scale,box-shadow] lg:duration-200 lg:hover:shadow-tc-float lg:hover:[animation-play-state:paused] lg:hover:[scale:1.06] lg:focus-visible:[animation-play-state:paused] lg:focus-visible:[scale:1.06] lg:first:border lg:first:border-tc-brand-control lg:first:bg-tc-brand-soft lg:first:text-tc-brand-deep lg:[&:nth-child(2)]:bg-tc-brand-mint lg:[&:nth-child(2)]:text-tc-brand-onMint lg:[&:nth-child(2)]:[animation-delay:0.4s] lg:last:bg-tc-brand-deep lg:last:text-white lg:last:[animation-delay:0.8s] lg:[&>span]:pointer-events-none lg:[&>span]:absolute lg:[&>span]:right-[68px] lg:[&>span]:top-1/2 lg:[&>span]:-translate-y-1/2 lg:[&>span]:translate-x-1.5 lg:[&>span]:whitespace-nowrap lg:[&>span]:rounded-full lg:[&>span]:bg-tc-brand-deep lg:[&>span]:px-3 lg:[&>span]:py-1.5 lg:[&>span]:text-xs lg:[&>span]:font-semibold lg:[&>span]:text-white lg:[&>span]:opacity-0 lg:[&>span]:shadow-tc-card lg:[&>span]:transition lg:[&:hover>span]:translate-x-0 lg:[&:hover>span]:opacity-100 lg:[&:focus-visible>span]:translate-x-0 lg:[&:focus-visible>span]:opacity-100"
          aria-current={pathname === path ? 'page' : undefined}>
          <Icon size={20} aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  )
}
