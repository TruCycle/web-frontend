import { ChevronLeft, ChevronRight } from 'lucide-react'
import { classNames } from '@/shared/utils/classNames'

type PaginationToken = number | 'ellipsis-left' | 'ellipsis-right'

interface PaginationControlsProps {
  readonly currentPage: number
  readonly totalPages: number
  readonly onPageChange: (page: number) => void
  readonly onPrevious: () => void
  readonly onNext: () => void
  readonly canGoPrevious?: boolean
  readonly canGoNext?: boolean
  readonly className?: string
}

function buildPaginationTokens(currentPage: number, totalPages: number): PaginationToken[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 'ellipsis-right', totalPages]
  }

  if (currentPage >= totalPages - 2) {
    return [1, 'ellipsis-left', totalPages - 2, totalPages - 1, totalPages]
  }

  return [
    1,
    'ellipsis-left',
    currentPage - 1,
    currentPage,
    currentPage + 1,
    'ellipsis-right',
    totalPages,
  ]
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
  onPrevious,
  onNext,
  canGoPrevious = currentPage > 1,
  canGoNext = currentPage < totalPages,
  className,
}: PaginationControlsProps) {
  if (totalPages < 1) {
    return null
  }

  const paginationTokens = buildPaginationTokens(currentPage, totalPages)

  return (
    <div className={classNames('flex flex-wrap items-center justify-between gap-2 pt-4', className)}>
      <button
        type="button"
        disabled={!canGoPrevious}
        onClick={onPrevious}
        className="inline-flex min-h-11 items-center gap-1 rounded-tc-md border border-tc-brand-control bg-white px-3 py-2 text-sm font-semibold text-tc-brand-deep transition hover:bg-tc-brand-soft disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft size={20} />
        Previous
      </button>

      <div className="flex items-center gap-4 max-md:order-last max-md:w-full max-md:justify-center max-md:gap-1">
        {paginationTokens.map((token, index) =>
          token === 'ellipsis-left' || token === 'ellipsis-right' ? (
            <span key={`${token}-${index}`} className="text-xl text-tc-brand-muted max-md:text-lg">
              ...
            </span>
          ) : (
            <button
              key={`page-${token}`}
              type="button"
              onClick={() => onPageChange(token)}
              className={
                token === currentPage
                  ? 'inline-flex h-11 w-11 items-center justify-center rounded-tc-md bg-tc-brand-deep px-3 text-sm font-semibold text-white max-md:w-9 max-md:px-0'
                  : 'inline-flex h-11 w-11 items-center justify-center rounded-tc-md px-3 text-sm font-medium text-tc-brand-body transition hover:bg-tc-brand-soft max-md:w-9 max-md:px-0'
              }
              aria-current={token === currentPage ? 'page' : undefined}
            >
              {token}
            </button>
          ),
        )}
      </div>

      <button
        type="button"
        disabled={!canGoNext}
        onClick={onNext}
        className="inline-flex min-h-11 items-center gap-1 rounded-tc-md border border-tc-brand-control bg-white px-3 py-2 text-sm font-semibold text-tc-brand-deep transition hover:bg-tc-brand-soft disabled:cursor-not-allowed disabled:opacity-50 max-md:px-4"
      >
        Next
        <ChevronRight size={20} />
      </button>
    </div>
  )
}
