import { useState } from 'react'
import { ChevronRight, Heart, PackageCheck, ScanLine, ShoppingBag } from 'lucide-react'
import { PartnerScanDialog } from '@/features/partner/ui/components/PartnerScanDialog'
import { Button } from '@/shared/ui/button/Button'

type ActivityStatus = 'Pending dropoff' | 'Awaiting collection' | 'Collected'

interface ActivityItem {
  readonly id: string
  readonly itemName: string
  readonly dateListed: string
  readonly category: string
  readonly dateCollected: string
  readonly status: ActivityStatus
}

const activityRows: readonly ActivityItem[] = [
  {
    id: 'desk',
    itemName: 'Desk',
    dateListed: 'Jan 19',
    category: 'Furniture',
    dateCollected: '-',
    status: 'Pending dropoff',
  },
  {
    id: 'iphone-12-pro',
    itemName: 'iPhone 12Pro',
    dateListed: 'Jan 12',
    category: 'Gadget',
    dateCollected: '-',
    status: 'Awaiting collection',
  },
  {
    id: 'bookshelf',
    itemName: 'Bookshelf',
    dateListed: 'Jan 11',
    category: 'Furniture',
    dateCollected: 'Jan 15',
    status: 'Collected',
  },
]

function activityStatusClassName(status: ActivityStatus): string {
  if (status === 'Pending dropoff') {
    return 'bg-amber-50 text-amber-600'
  }

  if (status === 'Awaiting collection') {
    return 'bg-violet-50 text-violet-600'
  }

  return 'bg-emerald-50 text-emerald-600'
}

export default function PartnerConsolePage() {
  const [isScanDialogOpen, setIsScanDialogOpen] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-tc-header-text">Welcome back, Pearl!</h1>
          <p className="text-tc-header-labelText">Monitor your inventory and track recent activity</p>
        </div>
        <Button
          variant="highlight"
          className="h-[42px] rounded-xl px-6 text-sm font-semibold"
          onClick={() => setIsScanDialogOpen(true)}
        >
          Start Scan
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl bg-white p-5">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#2FC7491A] text-[#2FC749]">
            <PackageCheck size={20} />
          </span>
          <div>
            <p className="text-3xl font-semibold text-tc-header-text">0</p>
            <p className="text-sm text-tc-header-labelText">Active Listings</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-white p-5">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#2FC7491A] text-[#2FC749]">
            <ScanLine size={20} />
          </span>
          <div>
            <p className="text-3xl font-semibold text-tc-header-text">2</p>
            <p className="text-sm text-tc-header-labelText">Drop-offs This Week</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-white p-5">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#2FC7491A] text-[#2FC749]">
            <Heart size={20} />
          </span>
          <div>
            <p className="text-3xl font-semibold text-tc-header-text">0</p>
            <p className="text-sm text-tc-header-labelText">Pickups Scheduled</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl bg-white p-5">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#2FC7491A] text-[#2FC749]">
            <ShoppingBag size={20} />
          </span>
          <div>
            <p className="text-3xl font-semibold text-tc-header-text">2</p>
            <p className="text-sm text-tc-header-labelText">Avg Items Per Shop</p>
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <h2 className="text-3xl font-semibold text-tc-app-secondary">Recent Activity</h2>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-sm text-tc-header-labelText transition hover:text-tc-app-secondary"
          >
            View All <ChevronRight size={16} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 text-sm text-tc-header-labelText">
                <th className="px-6 py-4 font-medium">Item Name</th>
                <th className="px-6 py-4 font-medium">Date Listed</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Date Collected</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {activityRows.map((activity) => (
                <tr key={activity.id} className="border-b border-slate-100 text-sm text-tc-app-secondary">
                  <td className="px-6 py-5">{activity.itemName}</td>
                  <td className="px-6 py-5">{activity.dateListed}</td>
                  <td className="px-6 py-5">{activity.category}</td>
                  <td className="px-6 py-5">{activity.dateCollected}</td>
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${activityStatusClassName(activity.status)}`}
                    >
                      {activity.status}
                    </span>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan={5} className="h-52 px-6 py-5" />
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <PartnerScanDialog
        isOpen={isScanDialogOpen}
        onClose={() => setIsScanDialogOpen(false)}
        shopName="Fixit Shop"
      />
    </div>
  )
}
