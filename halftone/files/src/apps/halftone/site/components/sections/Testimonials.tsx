import { testimonials } from '../../data/testimonials'
import { Card } from '../ui/Card'
import { Photo } from '../ui/Photo'
import { RevealGroup, RevealItem } from '../ui/Reveal'
import { Accent, SectionHeader } from '../ui/SectionHeader'

export function Testimonials() {
  const [featured, ...rest] = testimonials
  return (
    <section className="border-t border-white/[0.05] py-16 md:py-24 lg:py-32">
      <div className="container-x">
        <SectionHeader align="center" eyebrow="Testimonials" title={<>Founders say it <Accent>better.</Accent></>} />
        <RevealGroup className="grid gap-4 md:grid-cols-6">
          <RevealItem className="md:col-span-6 lg:col-span-4 lg:row-span-2">
            <Card variant="accent" className="flex h-full flex-col justify-between gap-10 p-6 md:p-10">
              <span aria-hidden className="font-serif text-8xl leading-none text-accent/80">“</span>
              <blockquote className="text-balance text-2xl font-medium leading-snug tracking-[-0.025em] text-fg md:text-4xl">
                {featured.quote}
              </blockquote>
              <Person {...featured} />
            </Card>
          </RevealItem>
          {rest.map((t) => (
            <RevealItem key={t.name} className="md:col-span-3 lg:col-span-2">
              <Card className="flex h-full flex-col justify-between gap-8 p-6">
                <blockquote className="text-pretty leading-relaxed text-fg/90">“{t.quote}”</blockquote>
                <Person {...t} />
              </Card>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}

function Person({ name, role, photo }: { name: string; role: string; photo: string }) {
  return (
    <figcaption className="flex items-center gap-3">
      <Photo src={photo} alt="" sizes="40px" tone="natural" className="size-10 shrink-0 rounded-full ring-1 ring-white/15" imgClassName="grayscale-[0.3]" />
      <span>
        <span className="block text-sm font-medium text-fg">{name}</span>
        <span className="block text-xs text-muted">{role}</span>
      </span>
    </figcaption>
  )
}
