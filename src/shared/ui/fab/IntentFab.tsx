import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Camera, PlusCircle, Truck } from 'lucide-react'
import { useIntentSwitch } from '@/shared/hooks/useIntentSwitch'

type IntentAction = {
  key: string
  label: string
  icon: typeof Camera
  surface: string
  iconColor: string
  ring: string
  hideOn: (pathname: string) => boolean
  onClick: () => void
}

const SHOW_STEP_MS = 250
const VISIBLE_HOLD_MS = 2500
const HIDE_STEP_MS = 200

export function IntentFab() {
  const { runWithRole } = useIntentSwitch()
  const { pathname } = useLocation()

  const allActions: IntentAction[] = [
    {
      key: 'spot',
      label: 'Spot an item',
      icon: Camera,
      surface: 'bg-tc-app-primary',
      iconColor: 'text-tc-app-text',
      ring: 'ring-tc-app-primary/35',
      hideOn: (p) => p.startsWith('/found-items/post'),
      onClick: () => runWithRole('spotter', { path: '/found-items/post' }),
    },
    {
      key: 'list',
      label: 'List an item',
      icon: PlusCircle,
      surface: 'bg-tc-auth-link',
      iconColor: 'text-white',
      ring: 'ring-tc-auth-link/25',
      hideOn: (p) => p.startsWith('/listings'),
      onClick: () => runWithRole('donor', { path: '/listings' }),
    },
    {
      key: 'rescue',
      label: 'Rescue an item',
      icon: Truck,
      surface: 'bg-tc-shell-bg',
      iconColor: 'text-white',
      ring: 'ring-tc-shell-divider',
      hideOn: (p) => p.startsWith('/map'),
      onClick: () => runWithRole('collector', { path: '/map' }),
    },
  ]

  const actions = useMemo(
    () => allActions.filter((action) => !action.hideOn(pathname)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathname],
  )

  const count = actions.length
  const [autoVisible, setAutoVisible] = useState<boolean[]>(() => actions.map(() => false))
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  useEffect(() => {
    setAutoVisible(new Array(count).fill(false))
    const timers: ReturnType<typeof setTimeout>[] = []

    for (let i = 0; i < count; i += 1) {
      timers.push(
        setTimeout(() => {
          setAutoVisible((prev) => {
            const next = [...prev]
            next[i] = true
            return next
          })
        }, i * SHOW_STEP_MS),
      )
    }

    const allShownAt = (count - 1) * SHOW_STEP_MS
    for (let i = 0; i < count; i += 1) {
      const fromBottomIndex = count - 1 - i
      timers.push(
        setTimeout(
          () => {
            setAutoVisible((prev) => {
              const next = [...prev]
              next[fromBottomIndex] = false
              return next
            })
          },
          allShownAt + VISIBLE_HOLD_MS + i * HIDE_STEP_MS,
        ),
      )
    }

    return () => {
      for (const t of timers) clearTimeout(t)
    }
  }, [count])

  if (count === 0) return null

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 sm:bottom-8 sm:right-8">
      {actions.map((action, index) => {
        const Icon = action.icon
        const tooltipVisible = hoverIndex === index || autoVisible[index]
        return (
          <div key={action.key} className="flex items-center gap-3">
            <span
              role="tooltip"
              aria-hidden={!tooltipVisible}
              className={`pointer-events-none inline-block whitespace-nowrap rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold leading-none text-white shadow-lg ring-1 ring-black/10 transition-all duration-300 ease-out ${
                tooltipVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
              }`}
            >
              {action.label}
            </span>
            <button
              type="button"
              onClick={action.onClick}
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex((prev) => (prev === index ? null : prev))}
              onFocus={() => setHoverIndex(index)}
              onBlur={() => setHoverIndex((prev) => (prev === index ? null : prev))}
              aria-label={action.label}
              className={`group pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full ${action.surface} ${action.iconColor} shadow-lg ring-4 ${action.ring} transition-transform duration-300 ease-out hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-offset-2 motion-safe:tc-fab-bob`}
              style={{ animationDelay: `${index * 0.25}s` }}
            >
              <Icon size={22} strokeWidth={2.25} />
              <span className="sr-only">{action.label}</span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
