import { useRef, type ComponentPropsWithoutRef, type MouseEvent } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'default' | 'glass' | 'accent'

const variants: Record<Variant, string> = {
  default: 'bg-gradient-to-b from-white/[0.06] to-white/[0.015]',
  glass: 'bg-white/[0.03] backdrop-blur-xl',
  accent: 'bg-[radial-gradient(120%_80%_at_0%_0%,rgb(200_245_60/0.1),transparent_60%),linear-gradient(to_bottom,rgb(255_255_255/0.06),rgb(255_255_255/0.015))]',
}

/**
 * The system's elevated surface.
 * - Mouse-tracking spotlight (accent, 15% → 0) follows the cursor via CSS vars.
 * - Gradient border fades in on hover.
 * - Hairline highlight along the top edge.
 */
export function Card({
  variant = 'default',
  spotlight = true,
  interactive = true,
  className,
  children,
  onMouseMove,
  ...props
}: ComponentPropsWithoutRef<'div'> & { variant?: Variant; spotlight?: boolean; interactive?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (el) {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    onMouseMove?.(e)
  }

  return (
    <div
      ref={ref}
      onMouseMove={spotlight ? handleMove : onMouseMove}
      className={cn(
        'group/card relative isolate overflow-hidden rounded-2xl shadow-card',
        'transition-[box-shadow,transform] duration-300 ease-expo',
        interactive && 'hover:-translate-y-1 hover:shadow-card-hover',
        variants[variant],
        className,
      )}
      {...props}
    >
      {/* top edge highlight */}
      <span aria-hidden className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      {/* hover gradient border */}
      {interactive && (
        <span aria-hidden className="border-glow opacity-0 transition-opacity duration-300 ease-expo group-hover/card:opacity-100" />
      )}
      {/* cursor spotlight */}
      {spotlight && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 ease-expo group-hover/card:opacity-100"
          style={{
            background:
              'radial-gradient(300px circle at var(--mx, 50%) var(--my, 50%), rgb(200 245 60 / 0.13), transparent 70%)',
          }}
        />
      )}
      {children}
    </div>
  )
}
