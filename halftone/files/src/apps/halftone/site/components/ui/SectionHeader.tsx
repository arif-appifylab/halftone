import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Eyebrow } from './Eyebrow'
import { Reveal } from './Reveal'

export function SectionHeader({
  eyebrow,
  title,
  lead,
  align = 'left',
  className,
  action,
}: {
  eyebrow: string
  title: ReactNode
  lead?: ReactNode
  align?: 'left' | 'center'
  className?: string
  action?: ReactNode
}) {
  const centered = align === 'center'
  return (
    <Reveal
      className={cn(
        'mb-12 flex flex-col gap-5 md:mb-16',
        centered ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between',
        className,
      )}
    >
      <div className={cn('flex flex-col gap-5', centered ? 'items-center' : 'items-start')}>
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="text-gradient max-w-3xl text-balance text-3xl font-semibold leading-[1.05] tracking-[-0.03em] md:text-5xl">
          {title}
        </h2>
        {lead && <p className={cn('max-w-xl text-pretty text-base leading-relaxed text-muted md:text-lg', centered && 'mx-auto')}>{lead}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </Reveal>
  )
}

/** Serif italic accent for one or two words inside a headline. */
export function Accent({ children }: { children: ReactNode }) {
  return <em className="text-accent-shimmer pr-1 font-serif font-normal tracking-[-0.01em] italic">{children}</em>
}
