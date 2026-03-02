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
    <div className={classNames('flex items-center justify-between pt-4', className)}>
      <button
        type="button"
        disabled={!canGoPrevious}
        onClick={onPrevious}
        className="inline-flex items-center gap-1 rounded-lg border border-[#64748B40] bg-white px-3 py-2 text-base font-medium text-[#12121299] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft size={20} />
        Previous
      </button>

      <div className="flex items-center gap-5">
        {paginationTokens.map((token, index) =>
          token === 'ellipsis-left' || token === 'ellipsis-right' ? (
            <span key={`${token}-${index}`} className="text-2xl text-[#12121299] max-md:text-xl">
              ...
            </span>
          ) : (
            <button
              key={`page-${token}`}
              type="button"
              onClick={() => onPageChange(token)}
              className={
                token === currentPage
                  ? 'inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#17A61A] px-3 text-base font-semibold text-white'
                  : 'inline-flex h-10 w-10 items-center justify-center rounded-lg px-3 text-base font-medium text-[#12121299] hover:bg-slate-100'
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
        className="inline-flex items-center gap-1 rounded-lg border border-[#64748B40] bg-white px-3 py-2 text-base font-medium text-[#12121299] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 max-md:px-4"
      >
        Next
        <ChevronRight size={20} />
      </button>
    </div>
  )
}
