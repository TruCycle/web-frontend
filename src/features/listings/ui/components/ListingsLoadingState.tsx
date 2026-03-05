import { classNames } from '@/shared/utils/classNames'

interface ListingsLoadingStateProps {
  readonly count?: number
  readonly showHeading?: boolean
  readonly className?: string
}

export function ListingsLoadingState({
  count = 3,
  showHeading = false,
  className,
}: ListingsLoadingStateProps) {
  return (
    <div className={classNames('space-y-3', className)}>
      {showHeading ? <span className="tc-shimmer-block block h-7 w-40 rounded-md" /> : null}
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`listing-loading-row-${index}`}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"
        >
          <div className="flex items-center gap-3">
            <span className="tc-shimmer-block block h-16 w-16 rounded-lg" />
            <div className="space-y-2">
              <span className="tc-shimmer-block block h-5 w-44 rounded-md" />
              <span className="tc-shimmer-block block h-4 w-52 rounded-md" />
            </div>
          </div>
          <div className="flex gap-2">
            <span className="tc-shimmer-block block h-9 w-24 rounded-xl" />
            <span className="tc-shimmer-block block h-9 w-24 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}
