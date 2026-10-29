import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/** Mono uppercase label — section tags and metadata. */
export function Eyebrow({ children, className, dot = true }: { children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/[0.06] px-3 py-1',
        'font-mono text-[11px] uppercase tracking-[0.18em] text-accent',
        className,
      )}
    >
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]" />}
      {children}
    </span>
  )
}

/** Live status pill with a soft green ping. */
export function LivePill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-muted backdrop-blur',
        className,
      )}
    >
      <span className="relative flex size-2">
        <span className="absolute inset-0 animate-ping-soft rounded-full bg-ok" />
        <span className="relative size-2 rounded-full bg-ok" />
      </span>
      {children}
    </span>
  )
}
