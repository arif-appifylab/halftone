import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { CaseArt } from '../components/art/CaseArt'
import { CTA } from '../components/sections/CTA'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Photo } from '../components/ui/Photo'
import { Reveal, RevealGroup, RevealItem } from '../components/ui/Reveal'
import { getProject, projects } from '../data/projects'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export function CaseStudy() {
  const { slug } = useParams()
  const project = getProject(slug)
  useDocumentTitle(project?.client)
  if (!project) return <Navigate to="/work" replace />

  const idx = projects.indexOf(project)
  const next = projects[(idx + 1) % projects.length]

  return (
    <>
      <section className="pb-10 pt-32 md:pt-40">
        <div className="container-x">
          <Reveal className="flex flex-col items-start gap-6">
            <Link to="/work" className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors duration-200 hover:text-fg">
              <ArrowLeft className="size-3.5" /> All work
            </Link>
            <Eyebrow>{project.client} · {project.category}</Eyebrow>
            <h1 className="text-gradient max-w-4xl text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.04em] md:text-6xl lg:text-7xl">{project.title}</h1>
            <p className="max-w-2xl text-pretty text-lg leading-relaxed text-muted md:text-xl">{project.summary}</p>
          </Reveal>

          <Reveal delay={0.1}>
            <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/[0.06] shadow-card md:grid-cols-4">
              {[
                ['Client', project.client],
                ['Year', project.year],
                ['Timeline', project.timeline],
                ['Services', project.services.join(', ')],
              ].map(([k, v]) => (
                <div key={k} className="bg-elevated p-5">
                  <dt className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">{k}</dt>
                  <dd className="mt-1.5 text-sm text-fg">{v}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>
      </section>

      <Reveal className="container-x">
        <Photo
          src={project.cover}
          alt={`${project.client} — ${project.title}`}
          sizes="100vw"
          priority
          className="group aspect-[16/10] rounded-2xl shadow-window md:aspect-[16/8]"
        />
      </Reveal>

      <section className="py-16 md:py-24">
        <div className="container-x grid gap-12 lg:grid-cols-[16rem_1fr] lg:gap-20">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent lg:sticky lg:top-28 lg:self-start">The challenge</h2>
          <Reveal>
            <p className="max-w-3xl text-pretty text-2xl font-medium leading-snug tracking-[-0.02em] text-fg md:text-3xl">{project.challenge}</p>
          </Reveal>

          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent lg:sticky lg:top-28 lg:self-start">Our approach</h2>
          <RevealGroup className="grid gap-px overflow-hidden rounded-2xl bg-white/[0.06] shadow-card md:grid-cols-3">
            {project.approach.map((a, i) => (
              <RevealItem key={a.title} className="flex flex-col gap-3 bg-elevated p-6">
                <span className="font-mono text-xs text-muted">0{i + 1}</span>
                <h3 className="text-lg font-semibold tracking-[-0.02em] text-fg">{a.title}</h3>
                <p className="text-sm leading-relaxed text-muted">{a.body}</p>
              </RevealItem>
            ))}
          </RevealGroup>

          <h2 className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent lg:sticky lg:top-28 lg:self-start">The outcome</h2>
          <div>
            <Reveal>
              <p className="max-w-3xl text-pretty text-lg leading-relaxed text-muted md:text-xl">{project.outcome}</p>
            </Reveal>
            <RevealGroup className="mt-10 grid gap-4 sm:grid-cols-3">
              {project.metrics.map((m) => (
                <RevealItem key={m.label} className="rounded-2xl bg-gradient-to-b from-white/[0.05] to-white/[0.015] p-6 shadow-card">
                  <p className="text-4xl font-semibold tracking-[-0.04em] text-accent md:text-5xl">{m.value}</p>
                  <p className="mt-2 text-sm text-muted">{m.label}</p>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </div>
      </section>

      <Reveal className="container-x">
        <div className="grid gap-4 md:grid-cols-2">
          {project.gallery.map((src, i) => (
            <Photo key={src} src={src} alt={`${project.client} project detail ${i + 1}`} className="group aspect-[4/3] rounded-2xl shadow-card" />
          ))}
          {/* The deliverable itself, rendered as a product mock */}
          <figure className="md:col-span-2">
            <div className="aspect-[16/10] overflow-hidden rounded-2xl shadow-window md:aspect-[16/8]">
              <CaseArt project={project} />
            </div>
            <figcaption className="mt-3 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
              {project.services[0]} — final {project.category === 'Brand' ? 'identity system' : project.category === 'Web' ? 'site' : 'interface'}
            </figcaption>
          </figure>
        </div>
      </Reveal>

      {project.quote && (
        <section className="py-16 md:py-24">
          <Reveal className="container-x max-w-4xl text-center">
            <span aria-hidden className="font-serif text-7xl leading-none text-accent/80">“</span>
            <blockquote className="mt-2 text-balance text-2xl font-medium leading-snug tracking-[-0.025em] text-fg md:text-4xl">{project.quote.text}</blockquote>
            <p className="mt-8 text-sm text-fg">{project.quote.name}</p>
            <p className="text-sm text-muted">{project.quote.role}</p>
          </Reveal>
        </section>
      )}

      <section className="border-t border-white/[0.05] py-12">
        <div className="container-x">
          <Link to={`/work/${next.slug}`} className="group flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">Next case study</p>
              <p className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-fg transition-colors duration-200 group-hover:text-accent md:text-5xl">{next.client}</p>
            </div>
            <span className="inline-flex items-center gap-2 text-muted transition-colors duration-200 group-hover:text-fg">
              {next.title} <ArrowRight className="size-4 transition-transform duration-300 ease-expo group-hover:translate-x-1" />
            </span>
          </Link>
        </div>
      </section>
      <CTA />
    </>
  )
}
