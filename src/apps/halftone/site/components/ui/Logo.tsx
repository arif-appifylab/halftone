import { cn } from '../../lib/cn'

// 3×3 dot screen whose dots shrink toward the bottom-right — a halftone ramp.
const DOTS = [0, 1, 2].flatMap((row) => [0, 1, 2].map((col) => ({ x: 6 + col * 10, y: 6 + row * 10, r: Math.max(0.6, 4 - (row + col) * 0.85) })))

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn('size-6', className)} aria-hidden>
      {DOTS.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={d.r} className="fill-accent" />
      ))}
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark className="transition-transform duration-300 ease-expo group-hover/logo:rotate-90" />
      <span className="text-[17px] font-semibold tracking-[-0.035em] text-fg">halftone</span>
    </span>
  )
}
