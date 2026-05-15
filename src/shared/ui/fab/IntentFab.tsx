import { Camera, PlusCircle, Truck } from 'lucide-react'
import { useIntentSwitch } from '@/shared/hooks/useIntentSwitch'

type IntentAction = {
  key: string
  label: string
  icon: typeof Camera
  gradient: string
  ring: string
  onClick: () => void
}

export function IntentFab() {
  const { runWithRole } = useIntentSwitch()

  const actions: IntentAction[] = [
    {
      key: 'spot',
      label: 'Spot',
      icon: Camera,
      gradient: 'from-emerald-400 to-lime-500',
      ring: 'ring-emerald-300/50',
      onClick: () => runWithRole('spotter', { path: '/found-items/post' }),
    },
    {
      key: 'list',
      label: 'List',
      icon: PlusCircle,
      gradient: 'from-amber-400 to-orange-500',
      ring: 'ring-amber-300/50',
      onClick: () => runWithRole('donor', { path: '/listings' }),
    },
    {
      key: 'rescue',
      label: 'Rescue',
      icon: Truck,
      gradient: 'from-sky-400 to-indigo-500',
      ring: 'ring-sky-300/50',
      onClick: () => runWithRole('collector', { path: '/map' }),
    },
  ]

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-40 flex flex-col items-center gap-3 sm:bottom-8 sm:right-8">
      {actions.map((action, index) => {
        const Icon = action.icon
        return (
          <button
            key={action.key}
            type="button"
            onClick={action.onClick}
            aria-label={action.label}
            title={action.label}
            className={`group pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${action.gradient} text-white shadow-lg ring-4 ${action.ring} transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-offset-2 motion-safe:tc-fab-bob`}
            style={{ animationDelay: `${index * 0.25}s` }}
          >
            <Icon size={22} strokeWidth={2.25} />
            <span className="sr-only">{action.label}</span>
          </button>
        )
      })}
    </div>
  )
}
