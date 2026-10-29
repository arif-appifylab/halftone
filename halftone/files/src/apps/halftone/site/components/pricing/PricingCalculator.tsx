import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, Minus, Plus } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { addOns, commitments, estimate, plans, usd, type AddOnId, type CommitmentId, type Plan } from '../../data/pricing'
import { cn } from '../../lib/cn'
import { EASE } from '../../lib/motion'
import { ButtonLink } from '../ui/Button'

/**
 * Live estimate: plan × seats + add-ons − commitment discount.
 * "Send this estimate" pre-fills the contact form via query params.
 */
export function PricingCalculator() {
  const [planId, setPlanId] = useState<Plan['id']>('partner')
  const [seats, setSeats] = useState(1)
  const [extras, setExtras] = useState<AddOnId[]>(['engineering'])
  const [commitment, setCommitment] = useState<CommitmentId>('quarterly')

  const result = useMemo(() => estimate(planId, seats, extras, commitment), [planId, seats, extras, commitment])
  const toggle = (id: AddOnId) => setExtras((xs) => (xs.includes(id) ? xs.filter((x) => x !== id) : [...xs, id]))

  const params = new URLSearchParams({
    plan: result.plan.name,
    seats: String(seats),
    addons: extras.join(','),
    commitment,
    estimate: String(result.total),
  })

  return (
    <div className="grid overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.05] to-white/[0.015] shadow-card lg:grid-cols-[1fr_24rem]">
      {/* Controls */}
      <div className="flex flex-col gap-8 p-5 md:p-8">
        <fieldset>
          <legend className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">1 · Engagement</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {plans.map((p) => (
              <label
                key={p.id}
                className={cn(
                  'relative flex cursor-pointer flex-col gap-1 rounded-xl border p-4 transition-all duration-200 ease-expo',
                  'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent/60',
                  planId === p.id
                    ? 'border-accent/60 bg-accent/[0.07] shadow-[0_0_30px_rgb(200_245_60/0.08)]'
                    : 'border-white/[0.07] bg-white/[0.02] hover:border-white/15',
                )}
              >
                <input type="radio" name="plan" value={p.id} checked={planId === p.id} onChange={() => setPlanId(p.id)} className="sr-only" />
                <span className="flex items-center justify-between">
                  <span className="font-medium text-fg">{p.name}</span>
                  {p.featured && <span className="rounded-full bg-glow/15 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-glow-bright">Popular</span>}
                </span>
                <span className="text-sm text-muted">
                  {usd(p.price)} <span className="text-xs">{p.cadence}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">2 · Senior designers</legend>
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center rounded-xl border border-white/[0.08] bg-field p-1">
              <StepBtn label="Remove a designer" onClick={() => setSeats((s) => Math.max(1, s - 1))} disabled={seats === 1}>
                <Minus className="size-4" />
              </StepBtn>
              <span className="w-12 text-center text-lg font-semibold tabular-nums text-fg" aria-live="polite">
                {seats}
              </span>
              <StepBtn label="Add a designer" onClick={() => setSeats((s) => Math.min(4, s + 1))} disabled={seats === 4}>
                <Plus className="size-4" />
              </StepBtn>
            </div>
            <div className="flex gap-1.5" aria-hidden>
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={i} className={cn('size-2.5 rounded-full transition-all duration-300 ease-expo', i < seats ? 'bg-accent shadow-[0_0_8px_var(--color-accent)]' : 'bg-white/10')} />
              ))}
            </div>
            <span className="ml-auto hidden text-xs text-muted sm:block">+70% per extra seat</span>
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">3 · Add-ons</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {addOns.map((a) => {
              const on = extras.includes(a.id)
              return (
                <button
                  key={a.id}
                  type="button"
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggle(a.id)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200 ease-expo',
                    on ? 'border-accent/50 bg-accent/[0.06]' : 'border-white/[0.07] bg-white/[0.02] hover:border-white/15',
                  )}
                >
                  <span className={cn('flex size-5 items-center justify-center rounded-md border transition-colors duration-200', on ? 'border-accent bg-accent text-accent-ink' : 'border-white/20')}>
                    {on && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                  <span className="flex-1 text-sm text-fg">{a.label}</span>
                  <span className="font-mono text-xs text-muted">+{usd(a.price)}</span>
                </button>
              )
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">4 · Commitment</legend>
          <div className="relative inline-grid grid-cols-3 rounded-xl border border-white/[0.08] bg-field p-1">
            {commitments.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={commitment === c.id}
                onClick={() => setCommitment(c.id)}
                className={cn('relative rounded-lg px-4 py-2 text-sm transition-colors duration-200', commitment === c.id ? 'text-fg' : 'text-muted hover:text-fg')}
              >
                {commitment === c.id && (
                  <motion.span layoutId="commit-pill" className="absolute inset-0 rounded-lg bg-white/[0.08] shadow-inset" transition={{ duration: 0.3, ease: EASE }} />
                )}
                <span className="relative">
                  {c.label}
                  {c.discount > 0 && <span className="ml-1.5 font-mono text-[10px] text-accent">−{c.discount * 100}%</span>}
                </span>
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {/* Summary */}
      <aside className="relative flex flex-col overflow-hidden border-t border-white/[0.06] bg-base/50 p-5 md:p-8 lg:border-l lg:border-t-0">
        <div aria-hidden className="bg-halftone absolute -right-16 -top-16 size-72 text-accent/35 [mask-image:radial-gradient(circle_at_70%_30%,#000,transparent_65%)]" />
        <p className="relative font-mono text-[11px] uppercase tracking-[0.16em] text-muted">Your estimate</p>
        <div className="relative mt-4 h-16 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.p
              key={result.total}
              initial={{ y: 24, opacity: 0, filter: 'blur(4px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              exit={{ y: -24, opacity: 0, filter: 'blur(4px)' }}
              transition={{ duration: 0.35, ease: EASE }}
              className="text-gradient text-5xl font-semibold tabular-nums tracking-[-0.045em] md:text-6xl"
            >
              {usd(result.total)}
            </motion.p>
          </AnimatePresence>
        </div>
        <p className="relative text-sm text-muted">{result.plan.cadence}</p>

        <dl className="relative mt-8 flex flex-col gap-3 border-t border-white/[0.06] pt-6 text-sm">
          <Row label={`${result.plan.name} × ${seats} seat${seats > 1 ? 's' : ''}`} value={usd(result.plan.price * (1 + (seats - 1) * 0.7))} />
          <Row label={`Add-ons (${extras.length})`} value={usd(addOns.filter((a) => extras.includes(a.id)).reduce((s, a) => s + a.price, 0))} />
          {result.savings > 0 && <Row label="Commitment discount" value={`−${usd(result.savings)}`} accent />}
        </dl>

        <ul className="relative mt-6 flex flex-col gap-2 text-sm text-muted">
          {result.plan.features.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <Check className="size-3.5 text-accent" /> {f}
            </li>
          ))}
        </ul>

        <ButtonLink to={`/contact?${params}`} size="lg" className="relative mt-8 w-full">
          Send this estimate <ArrowRight className="size-4" />
        </ButtonLink>
        <p className="relative mt-3 text-center text-xs text-muted">No commitment — it just pre-fills the brief.</p>
      </aside>
    </div>
  )
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted">{label}</dt>
      <dd className={cn('font-mono tabular-nums', accent ? 'text-accent' : 'text-fg')}>{value}</dd>
    </div>
  )
}

function StepBtn({ label, children, ...props }: { label: string; children: ReactNode; onClick: () => void; disabled: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors duration-200 hover:bg-white/[0.06] hover:text-fg disabled:opacity-30"
      {...props}
    >
      {children}
    </button>
  )
}
