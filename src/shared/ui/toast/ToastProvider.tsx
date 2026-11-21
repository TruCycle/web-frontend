import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { classNames } from '@/shared/utils/classNames'
import { ToastContext, type ShowToastOptions, type ToastTone } from './context'

interface ToastItem {
  readonly id: number
  readonly title: string
  readonly message: string
  readonly tone: ToastTone
  readonly durationMs: number
}

interface ToastContextValue {
  showToast: (options: ShowToastOptions) => number
  dismissToast: (id: number) => void
  clearToasts: () => void
}

const maxVisibleToasts = 3
const defaultDurationMs = 3400

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const toastIdRef = useRef(0)
  const timeoutByIdRef = useRef<Map<number, number>>(new Map())

  const clearDismissTimeout = useCallback((id: number) => {
    const timeoutId = timeoutByIdRef.current.get(id)
    if (timeoutId === undefined) {
      return
    }

    window.clearTimeout(timeoutId)
    timeoutByIdRef.current.delete(id)
  }, [])

  const dismissToast = useCallback(
    (id: number) => {
      clearDismissTimeout(id)
      setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id))
    },
    [clearDismissTimeout],
  )

  const scheduleAutoDismiss = useCallback(
    (id: number, durationMs: number) => {
      clearDismissTimeout(id)
      const timeoutId = window.setTimeout(() => {
        dismissToast(id)
      }, durationMs)

      timeoutByIdRef.current.set(id, timeoutId)
    },
    [clearDismissTimeout, dismissToast],
  )

  const showToast = useCallback(
    (options: ShowToastOptions) => {
      const id = toastIdRef.current + 1
      toastIdRef.current = id

      const nextToast: ToastItem = {
        id,
        title: options.title,
        message: options.message,
        tone: options.tone ?? 'info',
        durationMs: options.durationMs ?? defaultDurationMs,
      }

      setToasts((currentToasts) => [...currentToasts, nextToast].slice(-maxVisibleToasts))
      scheduleAutoDismiss(id, nextToast.durationMs)
      return id
    },
    [scheduleAutoDismiss],
  )

  const clearToasts = useCallback(() => {
    timeoutByIdRef.current.forEach((timeoutId) => {
      window.clearTimeout(timeoutId)
    })
    timeoutByIdRef.current.clear()
    setToasts([])
  }, [])

  useEffect(() => {
    const visibleIds = new Set(toasts.map(toast => toast.id))
    for (const id of timeoutByIdRef.current.keys()) {
      if (!visibleIds.has(id)) clearDismissTimeout(id)
    }
  }, [clearDismissTimeout, toasts])

  useEffect(() => {
    const timeoutById = timeoutByIdRef.current
    return () => {
      timeoutById.forEach((timeoutId) => {
        window.clearTimeout(timeoutId)
      })
      timeoutById.clear()
    }
  }, [])

  const contextValue = useMemo<ToastContextValue>(
    () => ({
      showToast,
      dismissToast,
      clearToasts,
    }),
    [showToast, dismissToast, clearToasts],
  )

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {typeof document !== 'undefined' && createPortal(<div role="region" aria-label="Notifications" data-modal-feedback className="pointer-events-none fixed right-4 top-24 z-[1300] flex max-h-[calc(100dvh-7rem)] w-[min(calc(100vw-2rem),22rem)] flex-col gap-2 overflow-y-auto">
        {toasts.map((toast, index) => {
          const resolvedTone = toast.tone === 'error' ? 'danger' : toast.tone

          return (
            <article
              key={toast.id}
              role={toast.tone === 'error' ? 'alert' : 'status'}
              aria-atomic="true"
              onMouseEnter={() => clearDismissTimeout(toast.id)}
              onMouseLeave={(event) => {
                if (!event.currentTarget.contains(document.activeElement)) scheduleAutoDismiss(toast.id, toast.durationMs)
              }}
              onFocus={() => clearDismissTimeout(toast.id)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget) && !event.currentTarget.matches(':hover')) {
                  scheduleAutoDismiss(toast.id, toast.durationMs)
                }
              }}
              className={classNames(
                'pointer-events-auto relative shrink-0 overflow-hidden rounded-tc-lg border bg-tc-brand-deep py-3.5 pl-10 pr-4 text-sm shadow-tc-float motion-safe:animate-[pulse_0.55s_ease-out_1]',
                index % 2 === 0 ? 'rotate-0' : 'rotate-0',
                resolvedTone === 'success' && 'border-tc-brand-deepLine text-tc-brand-mint',
                resolvedTone === 'warning' && 'border-tc-brand-deepLine text-tc-shell-notify',
                resolvedTone === 'danger' && 'border-red-400 text-red-400',
                resolvedTone === 'info' && 'border-tc-brand-deepLine text-tc-brand-onDeep',
              )}
            >
              <span className="pointer-events-none absolute left-4 top-5 h-2 w-2 rounded-full bg-current" />
              <p className="m-0 text-sm leading-5 font-semibold text-white">{toast.title}</p>
              <p className="mb-0 mt-0.5 text-[13px] leading-5 text-tc-brand-onDeep">{toast.message}</p>
              <button
                className="mt-2 min-h-11 min-w-11 rounded-tc-sm border border-tc-brand-deepLine bg-tc-brand-hover px-3 py-1 text-xs font-semibold text-white transition hover:border-tc-brand-onDeep"
                onClick={() => dismissToast(toast.id)}
                type="button"
              >
                Dismiss
              </button>
            </article>
          )
        })}
      </div>, document.body)}
    </ToastContext.Provider>
  )
}
