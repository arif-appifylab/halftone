import { Check } from 'lucide-react'
import { capabilities } from '../../data/services'
import { cn } from '../../lib/cn'
import { Card } from '../ui/Card'
import { RevealGroup, RevealItem } from '../ui/Reveal'
import { Accent, SectionHeader } from '../ui/SectionHeader'

// Bento spans on a 6-col grid: hero tile 4×2, then a deliberate mix.
const spans = ['md:col-span-4 md:row-span-2', 'md:col-span-2', 'md:col-span-2', 'md:col-span-3', 'md:col-span-3', 'md:col-span-6']

export function Capabilities() {
  return (
    <section id="services" className="border-t border-white/[0.05] py-16 md:py-24 lg:py-32">
      <div className="container-x">
        <SectionHeader
          eyebrow="Capabilities"
          title={<>One studio, from the first sketch to <Accent>production.</Accent></>}
          lead="Brand, product and engineering under one roof — so nothing gets lost between the logo and the login screen."
        />
        <RevealGroup className="grid gap-4 md:auto-rows-[minmax(200px,auto)] md:grid-cols-6">
          {capabilities.map((c, i) => {
            const Icon = c.icon
            const hero = i === 0
            const wide = i === 5
            return (
              <RevealItem key={c.id} className={spans[i]}>
                <Card variant={hero ? 'accent' : 'default'} className={cn('flex h-full flex-col p-6 md:p-8', wide && 'md:flex-row md:items-center md:gap-10')}>
                  {hero && <BrandSpecimen />}
                  <div className={cn('flex flex-col gap-4', hero && 'mt-auto', wide && 'md:max-w-md')}>
                    <span className="inline-flex size-11 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] shadow-[inset_0_1px_0_rgb(255_255_255/0.1),0_4px_14px_rgb(0_0_0/0.4)]">
                      <Icon className="size-5 text-accent" strokeWidth={1.6} />
                    </span>
                    <h3 className={cn('font-semibold tracking-[-0.025em] text-fg', hero ? 'text-2xl md:text-3xl' : 'text-xl')}>{c.name}</h3>
                    <p className="max-w-md text-sm leading-relaxed text-muted md:text-[15px]">{c.blurb}</p>
                  </div>
                  <ul className={cn('mt-6 flex flex-wrap gap-2', wide && 'md:mt-0 md:ml-auto md:justify-end')}>
                    {c.deliverables.map((d) => (
                      <li key={d} className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-xs text-muted">
                        <Check className="size-3 text-accent" /> {d}
                      </li>
                    ))}
                  </ul>
                </Card>
              </RevealItem>
            )
          })}
        </RevealGroup>
      </div>
    </section>
  )
}

/** Visual for the hero tile: a type + color specimen sheet. */
function BrandSpecimen() {
  return (
    <div aria-hidden className="relative mb-8 hidden min-h-52 flex-1 overflow-hidden rounded-xl border border-white/[0.06] bg-base/60 md:block">
      <div className="bg-halftone-lg absolute -right-10 -top-10 size-72 text-glow/50 [mask-image:radial-gradient(circle_at_70%_30%,#000,transparent_65%)]" />
      <div className="absolute left-6 top-5 font-serif text-[7rem] italic leading-none tracking-[-0.04em] text-fg">Aa</div>
      <div className="absolute bottom-5 left-6 flex gap-2">
        {['bg-accent', 'bg-glow', 'bg-fg', 'bg-elevated border border-white/10'].map((c) => (
          <span key={c} className={cn('size-9 rounded-lg', c)} />
        ))}
      </div>
      <div className="absolute bottom-5 right-6 text-right font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-muted">
        Geist / 600 / −4.5%
        <br />
        Instrument Serif / Italic
      </div>
    </div>
  )
}
