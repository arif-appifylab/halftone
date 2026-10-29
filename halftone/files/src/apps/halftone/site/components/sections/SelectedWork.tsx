import { ArrowRight } from 'lucide-react'
import { projects } from '../../data/projects'
import { ButtonLink } from '../ui/Button'
import { RevealGroup, RevealItem } from '../ui/Reveal'
import { Accent, SectionHeader } from '../ui/SectionHeader'
import { CaseCard } from '../work/CaseCard'

/** Asymmetric 6-col case-study grid: one hero tile, three supporting. */
export function SelectedWork() {
  const [hero, ...rest] = projects
  return (
    <section className="py-16 md:py-24 lg:py-32">
      <div className="container-x">
        <SectionHeader
          eyebrow="Selected work"
          title={<>Work that moved the <Accent>number.</Accent></>}
          lead="A few recent engagements. Every case study lists the metric the client hired us to move — and what happened to it."
          action={
            <ButtonLink to="/work" variant="secondary">
              All case studies <ArrowRight className="size-4" />
            </ButtonLink>
          }
        />
        <RevealGroup className="grid gap-4 md:grid-cols-6 md:gap-5">
          <RevealItem className="md:col-span-4 md:row-span-2">
            <CaseCard project={hero} large className="h-full" />
          </RevealItem>
          <RevealItem className="md:col-span-2">
            <CaseCard project={rest[0]} className="h-full" />
          </RevealItem>
          <RevealItem className="md:col-span-2">
            <CaseCard project={rest[1]} className="h-full" />
          </RevealItem>
          <RevealItem className="md:col-span-3">
            <CaseCard project={rest[2]} className="h-full" />
          </RevealItem>
          <RevealItem className="md:col-span-3">
            <CaseCard project={rest[3]} className="h-full" />
          </RevealItem>
        </RevealGroup>
      </div>
    </section>
  )
}
