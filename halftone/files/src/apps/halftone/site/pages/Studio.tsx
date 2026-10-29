import { PageHero } from '../components/layout/PageHero'
import { CTA } from '../components/sections/CTA'
import { Stats } from '../components/sections/Stats'
import { Card } from '../components/ui/Card'
import { Photo } from '../components/ui/Photo'
import { Reveal, RevealGroup, RevealItem } from '../components/ui/Reveal'
import { Accent, SectionHeader } from '../components/ui/SectionHeader'
import { principles, recognition, studioPhotos, team } from '../data/team'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export function Studio() {
  useDocumentTitle('Studio')
  return (
    <>
      <PageHero
        eyebrow="Studio"
        title={<>Eleven people. Four clients. <Accent>No juniors.</Accent></>}
        lead="Halftone was founded in 2018 by a product designer and a brand designer who were tired of watching great work die in the handoff. We stay small on purpose."
      />

      <Reveal className="container-x">
        <div className="grid gap-4 md:grid-cols-[1.4fr_1fr] md:grid-rows-2">
          <Photo src={studioPhotos[0].src} alt={studioPhotos[0].alt} priority sizes="(min-width: 768px) 60vw, 100vw" className="group aspect-[4/3] rounded-2xl shadow-card md:row-span-2 md:aspect-auto" />
          <Photo src={studioPhotos[1].src} alt={studioPhotos[1].alt} sizes="(min-width: 768px) 40vw, 100vw" className="group aspect-[16/10] rounded-2xl shadow-card" />
          <Photo src={studioPhotos[2].src} alt={studioPhotos[2].alt} sizes="(min-width: 768px) 40vw, 100vw" className="group aspect-[16/10] rounded-2xl shadow-card" />
        </div>
      </Reveal>

      <Stats />

      <section className="py-16 md:py-24">
        <div className="container-x">
          <SectionHeader eyebrow="Principles" title={<>How we <Accent>work.</Accent></>} />
          <RevealGroup className="grid gap-4 md:grid-cols-2">
            {principles.map((p, i) => (
              <RevealItem key={p.title}>
                <Card className="flex h-full gap-6 p-6 md:p-8">
                  <span className="font-serif text-5xl italic leading-none text-accent/80">{i + 1}</span>
                  <div>
                    <h3 className="text-xl font-semibold tracking-[-0.025em] text-fg">{p.title}</h3>
                    <p className="mt-2 leading-relaxed text-muted">{p.body}</p>
                  </div>
                </Card>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section className="border-t border-white/[0.05] py-16 md:py-24">
        <div className="container-x">
          <SectionHeader eyebrow="Team" title={<>The people on your <Accent>project.</Accent></>} lead="Not a bench. These are the people who will be in your Slack." />
          <RevealGroup className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {team.map((m) => (
              <RevealItem key={m.name}>
                <Card className="group overflow-hidden">
                  <div className="relative aspect-[4/5]">
                    <Photo src={m.photo} alt={`Portrait of ${m.name}`} sizes="(min-width: 768px) 33vw, 50vw" className="absolute inset-0" imgClassName="group-hover:scale-[1.03]" />
                    <span className="absolute left-3 top-3 rounded-full bg-base/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted backdrop-blur">{m.city}</span>
                  </div>
                  <div className="p-4 md:p-5">
                    <p className="font-medium text-fg">{m.name}</p>
                    <p className="text-sm text-muted">{m.role}</p>
                  </div>
                </Card>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section className="border-t border-white/[0.05] py-16 md:py-24">
        <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.4fr]">
          <SectionHeader eyebrow="Recognition" title={<>Nice things, <Accent>occasionally.</Accent></>} className="md:mb-0" />
          <RevealGroup className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
            {recognition.map((r) => (
              <RevealItem key={r.award} className="flex items-baseline justify-between gap-4 py-5">
                <span className="text-lg font-medium tracking-[-0.02em] text-fg">{r.award}</span>
                <span className="flex-1 text-right text-sm text-muted md:text-left md:pl-8">{r.detail}</span>
                <span className="hidden font-mono text-xs text-muted md:block">{r.year}</span>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>
      <CTA />
    </>
  )
}
