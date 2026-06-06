import { useCallback, useState } from 'react'
import { Download, LoaderCircle } from 'lucide-react'
import { fetchPointHistory } from '../../api/gamificationApi'
import { downloadCsv, toCsv } from '@/shared/utils/csv'

const PAGE_SIZE = 100
const MAX_PAGES = 50

interface CarbonLedgerPanelProps {
  readonly co2eTotalKg: number
  readonly impactPoints: number
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
      }

      const stamp = new Date().toISOString().split('T')[0]
      downloadCsv(`trucycle-carbon-ledger-${stamp}.csv`, toCsv(rows))
    } catch {
      setError('Could not export your ledger right now.')
    } finally {
      setIsDownloading(false)
    }
  }, [])

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Carbon ledger</h3>
          <p className="text-sm text-slate-500">A verifiable record of every action that earned you points.</p>
        </div>
        <button
          type="button"
          disabled={isDownloading}
          onClick={() => void handleDownload()}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {isDownloading ? <LoaderCircle size={14} className="animate-spin" /> : <Download size={14} />}
          {isDownloading ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-emerald-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">CO2e total</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-emerald-900">{co2eTotalKg.toFixed(1)} kg</p>
        </div>
        <div className="rounded-xl bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Lifetime impact</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-amber-900">{impactPoints.toLocaleString()} pts</p>
        </div>
      </div>
      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
    </div>
  )
}
