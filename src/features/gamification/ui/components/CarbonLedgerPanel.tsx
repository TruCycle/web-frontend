import { useCallback, useState } from 'react'
import { Download, LoaderCircle } from 'lucide-react'
import { fetchPointHistory } from '../../api/gamificationApi'
import { downloadCsv, toCsv } from '@/shared/utils/csv'

const PAGE_SIZE = 100
const MAX_PAGES = 50

interface CarbonLedgerPanelProps {
  readonly co2eTotalKg: number | null
  readonly impactPoints: number | null
}

export function CarbonLedgerPanel({ co2eTotalKg, impactPoints }: CarbonLedgerPanelProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = useCallback(async () => {
    setIsDownloading(true)
    setError(null)
    try {
      const rows: Array<Array<string | number>> = [
        ['Date', 'Reason', 'Action type', 'Action ID', 'Points'],
      ]

      for (let page = 1; page <= MAX_PAGES; page += 1) {
        const { transactions, pagination } = await fetchPointHistory(page, PAGE_SIZE)
        for (const tx of transactions) {
          rows.push([
            new Date(tx.createdAt).toISOString(),
            tx.reason,
            tx.actionType,
            tx.actionId ?? '',
            tx.points,
          ])
        }
        if (pagination.page >= pagination.totalPages) break
        if (page === MAX_PAGES) throw new Error('Export exceeds supported size')
      }

      const stamp = new Date().toISOString().split('T')[0]
      downloadCsv(`trucycle-points-ledger-${stamp}.csv`, toCsv(rows))
    } catch {
      setError('Could not export your ledger right now.')
    } finally {
      setIsDownloading(false)
    }
  }, [])

  return (
    <div className="min-w-0 rounded-tc-lg border border-tc-brand-line bg-white p-6 lg:col-span-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold leading-7 tracking-[-0.015em] text-tc-brand-ink">Points ledger</h3>
          <p className="text-[13px] leading-5 text-tc-brand-muted">Your recorded activity points. CO2e is an estimate for items marked picked up.</p>
        </div>
        <button
          type="button"
          disabled={isDownloading}
          onClick={() => void handleDownload()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-tc-md border border-tc-brand-control bg-white px-4 py-3 text-sm font-semibold text-tc-brand-deep transition hover:bg-tc-brand-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDownloading ? <LoaderCircle size={14} className="animate-spin" /> : <Download size={14} />}
          {isDownloading ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="min-w-0 rounded-tc-md bg-tc-brand-soft p-4">
          <p className="text-xs font-semibold uppercase leading-4 tracking-[0.06em] text-tc-brand-muted">Estimated CO2e</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.02em] tabular-nums text-tc-brand-ink [overflow-wrap:anywhere]">{co2eTotalKg === null ? 'Unavailable' : `${co2eTotalKg.toFixed(1)} kg`}</p>
        </div>
        <div className="min-w-0 rounded-tc-md bg-tc-brand-soft p-4">
          <p className="text-xs font-semibold uppercase leading-4 tracking-[0.06em] text-tc-brand-muted">Earned activity points</p>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.02em] tabular-nums text-tc-brand-ink [overflow-wrap:anywhere]">{impactPoints === null ? 'Unavailable' : `${impactPoints.toLocaleString()} pts`}</p>
        </div>
      </div>
      {error ? <p className="mt-3 text-sm text-tc-brand-danger">{error}</p> : null}
    </div>
  )
}
