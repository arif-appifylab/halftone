import { useState } from 'react'
import { cn } from '../../lib/cn'
import { formatDate } from '../../lib/format'

/**
 * Single-series daily bars (no legend — the panel title names the series).
 * Thin bars, 4px rounded tops anchored to the baseline, 2px gaps, violet
 * fill (validated for the dark surface), full-height hover targets, and a
 * visually hidden table for screen readers.
 */
export function BarChart({ data, label }: { data: { date: string; count: number }[]; label: string }) {
  const [hover, setHover] = useState<number | null>(null)
  // Headroom: never let a quiet fortnight fill the plot to the ceiling.
  const max = Math.max(4, Math.ceil(Math.max(...data.map((d) => d.count)) * 1.2))
  const ticks = [0, Math.round(max / 2), max]

  return (
    <figure>
      <div className="relative flex h-44 gap-3">
        {/* y-axis */}
        <div aria-hidden className="relative w-5 shrink-0 font-mono text-[10px] text-muted/70">
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ bottom: `${(t / max) * 100}%` }}>
              {t}
            </span>
          ))}
        </div>
        <div className="relative flex-1">
          {ticks.map((t) => (
            <span key={t} aria-hidden className={cn('absolute inset-x-0 h-px', t === 0 ? 'bg-white/15' : 'bg-white/[0.04]')} style={{ bottom: `${(t / max) * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end gap-[2px]" onMouseLeave={() => setHover(null)}>
            {data.map((d, i) => (
              <div
                key={d.date}
                className="relative flex h-full flex-1 cursor-default items-end justify-center"
                onMouseEnter={() => setHover(i)}
                aria-hidden
              >
                <div
                  className={cn('w-full max-w-5 rounded-t-[4px] transition-colors duration-200', hover === i ? 'bg-glow-bright' : 'bg-glow')}
                  style={{ height: d.count ? `${(d.count / max) * 100}%` : 0 }}
                />
                {hover === i && (
                  <div className="pointer-events-none absolute bottom-full z-10 mb-2 whitespace-nowrap rounded-lg border border-white/10 bg-base/95 px-2.5 py-1.5 text-xs shadow-window">
                    <span className="text-muted">{formatDate(d.date + 'T12:00:00', { month: 'short', day: 'numeric' })}</span>
                    <span className="ml-2 font-medium tabular-nums text-fg">
                      {d.count} {d.count === 1 ? 'inquiry' : 'inquiries'}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div aria-hidden className="ml-8 mt-2 flex justify-between font-mono text-[10px] text-muted/70">
        <span>{formatDate(data[0]?.date + 'T12:00:00', { month: 'short', day: 'numeric' })}</span>
        <span>Today</span>
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Inquiries</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.date}>
              <td>{d.date}</td>
              <td>{d.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  )
}
