import { Check } from 'lucide-react'
import { PageHero } from '../components/layout/PageHero'
import { PricingCalculator } from '../components/pricing/PricingCalculator'
import { FAQ } from '../components/sections/FAQ'
import { ButtonLink } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Reveal, RevealGroup, RevealItem } from '../components/ui/Reveal'
import { Accent, SectionHeader } from '../components/ui/SectionHeader'
import { plans, usd } from '../data/pricing'
import { cn } from '../lib/cn'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export function Pricing() {
  useDocumentTitle('Pricing')
  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title={<>Transparent pricing for <Accent>serious</Accent> work.</>}
        lead="Three ways to work together. Pause or cancel monthly plans anytime — most clients don’t."
      />
      <section className="pb-16 md:pb-24">
        <div className="container-x">
          <RevealGroup className="grid gap-4 lg:grid-cols-3">
            {plans.map((p) => (
              <RevealItem key={p.id}>
                <Card variant={p.featured ? 'accent' : 'default'} className={cn('flex h-full flex-col p-6 md:p-8', p.featured && 'shadow-[0_0_0_1px_rgb(200_245_60/0.3),0_8px_40px_rgb(0_0_0/0.5),0_0_80px_rgb(200_245_60/0.08)]')}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold tracking-[-0.02em] text-fg">{p.name}</h2>
                    {p.featured && <span className="rounded-full bg-accent px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-accent-ink">Most popular</span>}
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{p.blurb}</p>
                  <p className="mt-8 flex items-baseline gap-2">
                    <span className="text-gradient text-5xl font-semibold tracking-[-0.045em]">{usd(p.price)}</span>
                    <span className="text-sm text-muted">{p.cadence}</span>
                  </p>
                  <ul className="mt-8 flex flex-col gap-3 border-t border-white/[0.06] pt-6 text-sm">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-fg/90">
                        <Check className="size-4 text-accent" /> {f}
                      </li>
                    ))}
                  </ul>
                  <ButtonLink to={`/contact?plan=${p.name}`} variant={p.featured ? 'primary' : 'secondary'} className="mt-10 w-full" size="lg">
                    Choose {p.name}
                  </ButtonLink>
                </Card>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>
      <section className="border-t border-white/[0.05] py-16 md:py-24">
        <div className="container-x">
          <SectionHeader eyebrow="Calculator" title={<>Build your <Accent>engagement.</Accent></>} lead="Adjust seats, add-ons and commitment. Send the result straight to us as a pre-filled brief." />
          <Reveal>
            <PricingCalculator />
          </Reveal>
        </div>
      </section>
      <FAQ />
    </>
  )
}
