import { useMemo, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'

interface Point {
  readonly x: number
  readonly y: number
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', '']
const IMPACT_VALUES = [52, 31, 56, 35, 23, 49, 13, 34, 67, 55, 72]
const Y_TICKS = [100, 80, 60, 40, 20, 0]
const HIGHLIGHTED_INDEXES = new Set([2, 3, 5, 7, 8])

function buildSmoothPath(points: readonly Point[]): string {
  if (points.length === 0) {
    return ''
  }

  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`
  }

  // Catmull-Rom to cubic Bezier conversion keeps a smooth curve that
  // still passes through every original point, so markers stay aligned.
  let path = `M ${points[0].x} ${points[0].y}`

  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index]
    const current = points[index]
    const next = points[index + 1]
    const following = points[index + 2] ?? next

    const controlPoint1X = current.x + (next.x - previous.x) / 6
    const controlPoint1Y = current.y + (next.y - previous.y) / 6
    const controlPoint2X = next.x - (following.x - current.x) / 6
    const controlPoint2Y = next.y - (following.y - current.y) / 6

    path += ` C ${controlPoint1X} ${controlPoint1Y} ${controlPoint2X} ${controlPoint2Y} ${next.x} ${next.y}`
  }

  return path
}

export function DonorEnvironmentalImpactCard() {
  const [isRangeMenuOpen, setIsRangeMenuOpen] = useState(false)

  const chart = useMemo(() => {
    const width = 1200
    const height = 320
    const padding = { top: 12, right: 12, bottom: 34, left: 42 }
    const maxY = 100
    const innerWidth = width - padding.left - padding.right
    const innerHeight = height - padding.top - padding.bottom
    const baselineY = padding.top + innerHeight

    const points = IMPACT_VALUES.map((value, index) => {
      const x = padding.left + (index / (IMPACT_VALUES.length - 1)) * innerWidth
      const y = padding.top + ((maxY - value) / maxY) * innerHeight
      return { x, y }
    })

    const linePath = buildSmoothPath(points)
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`
    const junePoint = points[5]

    return {
      width,
      height,
      padding,
      baselineY,
      points,
      linePath,
      areaPath,
      junePoint,
      innerWidth,
      innerHeight,
    }
  }, [])

  return (
    <section className="rounded-xl bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="text-lg font-bold text-[#4B5563]">Your Environmental Impact</h2>
        <div className="relative">
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#12121270] hover:bg-slate-100"
            onClick={() => setIsRangeMenuOpen((current) => !current)}
            aria-label="Open impact range options"
          >
            <MoreHorizontal size={50} />
          </button>
          {isRangeMenuOpen ? (
            <div className="absolute right-0 top-[calc(100%+0.35rem)] z-10 min-w-[110px] rounded-lg border border-slate-200 bg-white p-1 shadow-md">
              <button className="w-full rounded-md px-2.5 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50">
                Last 7 days
              </button>
              <button className="w-full rounded-md px-2.5 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50">
                Last 30 days
              </button>
              <button className="w-full rounded-md px-2.5 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-50">
                Last 1 year
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="h-auto w-full">
        <defs>
          <linearGradient id="donor-impact-area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34D399" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#34D399" stopOpacity="0.03" />
          </linearGradient>
          <linearGradient id="donor-impact-line-stroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#74FF78" />
            <stop offset="100%" stopColor="#15A119" />
          </linearGradient>
          <filter id="donor-impact-line-shadow" x="-10%" y="-20%" width="120%" height="150%">
            <feDropShadow dx="0" dy="4" stdDeviation="2" floodColor="#605BFF" floodOpacity="0.17" />
          </filter>
        </defs>

        {Y_TICKS.map((tickValue) => {
          const y = chart.padding.top + ((100 - tickValue) / 100) * chart.innerHeight
          return (
            <g key={`tick-${tickValue}`}>
              <line x1={chart.padding.left} y1={y} x2={chart.width - chart.padding.right} y2={y} stroke="#E5E7EB" />
              <text
                x={chart.padding.left - 18}
                y={y + 3}
                textAnchor="end"
                className="fill-[#12121270] text-sm"
              >
                {tickValue}
              </text>
            </g>
          )
        })}

        <path d={chart.areaPath} fill="url(#donor-impact-area-fill)" />

        <line
          x1={chart.junePoint.x}
          y1={chart.junePoint.y}
          x2={chart.junePoint.x}
          y2={chart.baselineY}
          stroke="#9AE6B4"
          strokeDasharray="3 6"
        />

        <path
          d={chart.linePath}
          fill="none"
          stroke="url(#donor-impact-line-stroke)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#donor-impact-line-shadow)"
        />

        {chart.points.map((point, index) =>
          HIGHLIGHTED_INDEXES.has(index) ? (
            <circle
              key={`point-${index}`}
              cx={point.x}
              cy={point.y}
              r={5}
              fill="#FFFFFF"
              stroke="#7EDC95"
              strokeWidth={3}
            />
          ) : null,
        )}

        {MONTH_LABELS.map((label, index) => {
          const x = chart.padding.left + (index / (MONTH_LABELS.length - 1)) * chart.innerWidth
          return (
            <text
              key={`month-${index}`}
              x={x}
              y={chart.height - 10}
              textAnchor="middle"
              className="fill-[#12121270] text-xs"
            >
              {label}
            </text>
          )
        })}
      </svg>
    </section>
  )
}
