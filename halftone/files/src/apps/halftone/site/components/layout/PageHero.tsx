import type { ReactNode } from 'react'
import { Eyebrow } from '../ui/Eyebrow'
import { Reveal } from '../ui/Reveal'

/** Compact hero for inner pages. */
export function PageHero({ eyebrow, title, lead, children }: { eyebrow: string; title: ReactNode; lead?: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative pb-12 pt-36 md:pb-20 md:pt-48">
      <div className="container-x">
        <Reveal className="flex max-w-3xl flex-col items-start gap-6">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="text-gradient text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.035em] md:text-6xl">{title}</h1>
          {lead && <p className="max-w-2xl text-pretty text-base leading-relaxed text-muted md:text-xl">{lead}</p>}
          {children}
        </Reveal>
      </div>
    </section>
  )
}
