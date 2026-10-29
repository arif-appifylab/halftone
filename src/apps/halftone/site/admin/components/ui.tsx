import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import type { BookingStatus, InquiryStatus } from '../../../shared/types'
import { cn } from '../../lib/cn'
import { EASE } from '../../lib/motion'

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-fg md:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  )
}

/** Flat panel for app surfaces — quieter than the marketing Card. */
export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('relative rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.015] shadow-card', className)}>
      <span aria-hidden className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      {children}
    </div>
  )
}

const inquiryTone: Record<InquiryStatus, string> = {
  new: 'border-accent/40 bg-accent/10 text-accent',
  contacted: 'border-glow/40 bg-glow/10 text-glow-bright',
  proposal: 'border-sky-400/30 bg-sky-400/10 text-sky-300',
  won: 'border-ok/40 bg-ok/10 text-ok',
  lost: 'border-white/10 bg-white/[0.04] text-muted',
}
const bookingTone: Record<BookingStatus, string> = {
  confirmed: 'border-accent/40 bg-accent/10 text-accent',
  completed: 'border-ok/40 bg-ok/10 text-ok',
  cancelled: 'border-white/10 bg-white/[0.04] text-muted line-through',
}

export function StatusBadge({ status }: { status: InquiryStatus | BookingStatus }) {
  const tone = (inquiryTone as Record<string, string>)[status] ?? (bookingTone as Record<string, string>)[status]
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]', tone)}>
      <span aria-hidden className="size-1 rounded-full bg-current" />
      {status}
    </span>
  )
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center">
      <span aria-hidden className="bg-halftone absolute inset-0 text-white/[0.06] [mask-image:radial-gradient(circle_at_50%_40%,#000,transparent_60%)]" />
      <p className="relative font-medium text-fg">{title}</p>
      {body && <p className="relative mt-1 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="relative mt-5">{action}</div>}
    </div>
  )
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('size-4 animate-spin text-muted', className)} aria-label="Loading" />
}

/** Two-step destructive action: first click arms, second confirms. Disarms after 3s. */
export function ConfirmButton({ onConfirm, children, className, disabled }: { onConfirm: () => void; children: ReactNode; className?: string; disabled?: boolean }) {
  const [armed, setArmed] = useState(false)
  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(t)
  }, [armed])
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => (armed ? (setArmed(false), onConfirm()) : setArmed(true))}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium transition-colors duration-200 disabled:opacity-50',
        armed ? 'bg-alert text-white' : 'text-muted hover:bg-alert/10 hover:text-alert',
        className,
      )}
    >
      {armed ? 'Click again to confirm' : children}
    </button>
  )
}

/** Right-hand sheet for detail views. Esc / backdrop close. */
export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50">
          <motion.div className="absolute inset-0 bg-deep/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: 32, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 32, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col border-l border-white/[0.08] bg-elevated shadow-window"
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">{title}</p>
              <button type="button" onClick={onClose} aria-label="Close" className="inline-flex size-8 items-center justify-center rounded-lg text-muted hover:bg-white/[0.06] hover:text-fg">
                <X className="size-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  )
}

/** Segmented tabs used for status filters. */
export function Segmented<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string; count?: number }[]; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-white/[0.07] bg-field p-1">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'relative inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] capitalize transition-colors duration-200',
            value === o.value ? 'text-fg' : 'text-muted hover:text-fg',
          )}
        >
          {value === o.value && <motion.span layoutId={`seg-${label}`} className="absolute inset-0 rounded-lg bg-white/[0.08] shadow-inset" transition={{ duration: 0.25, ease: EASE }} />}
          <span className="relative">{o.label}</span>
          {o.count !== undefined && <span className="relative font-mono text-[10px] text-muted">{o.count}</span>}
        </button>
      ))}
    </div>
  )
}

/** Accessible on/off switch. */
export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-200 ease-expo',
        checked ? 'border-accent/60 bg-accent' : 'border-white/10 bg-white/[0.06]',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'size-3.5 rounded-full shadow-[0_1px_3px_rgb(0_0_0/0.4)] transition-transform duration-200 ease-expo',
          checked ? 'translate-x-[18px] bg-accent-ink' : 'translate-x-[2px] bg-fg/70',
        )}
      />
    </button>
  )
}
