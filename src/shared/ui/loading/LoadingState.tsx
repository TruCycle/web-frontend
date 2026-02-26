import { classNames } from '@/shared/utils/classNames'
import logoSrc from '@/assets/logo.svg'

interface LoadingStateProps {
  readonly label?: string
  readonly size?: 'sm' | 'md' | 'lg'
  readonly variant?: 'page' | 'section'
}

export function LoadingState({
  label = 'Loading...',
  size = 'md',
  variant = 'section',
}: LoadingStateProps) {
  const containerClass =
    variant === 'page'
      ? 'min-h-[60vh] w-full rounded-2xl border border-slate-200 bg-white'
      : 'min-h-[160px] w-full rounded-xl border border-slate-200 bg-white'

  const logoClass =
    size === 'sm'
      ? 'h-8 w-8'
      : size === 'lg'
        ? 'h-16 w-16'
        : 'h-11 w-11'

  if (variant === 'section') {
    return (
      <div
        className={classNames(
          'flex items-center justify-center p-6 text-slate-600',
          containerClass,
        )}
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="w-full max-w-[34rem] space-y-3">
          <span className="tc-shimmer-block block h-4 w-28 rounded-md" />
          <span className="tc-shimmer-block block h-10 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
            <span className="tc-shimmer-block block h-20 rounded-xl" />
            <span className="tc-shimmer-block block h-20 rounded-xl" />
          </div>
          <span className="sr-only">{label}</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className={classNames(
        'flex flex-col items-center justify-center gap-3 p-6 text-slate-600',
        containerClass,
      )}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={classNames('tc-loading-logo-stage', logoClass)} aria-hidden>
        <span className="tc-loading-logo-flipper">
          <img src={logoSrc} alt="" className="tc-loading-logo-face" />
          <img
            src={logoSrc}
            alt=""
            className="tc-loading-logo-face tc-loading-logo-face--back"
          />
        </span>
      </div>
      {label ? <span className="text-sm font-medium">{label}</span> : null}
    </div>
  )
}
