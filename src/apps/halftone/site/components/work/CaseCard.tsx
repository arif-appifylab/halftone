import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Project } from '../../data/projects'
import { cn } from '../../lib/cn'
import { Photo } from '../ui/Photo'

/** Case study tile: cover photo that warms to color on hover, meta underneath. */
export function CaseCard({ project, className, large = false }: { project: Project; className?: string; large?: boolean }) {
  return (
    <Link
      to={`/work/${project.slug}`}
      className={cn(
        'group group/case relative flex flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.05] to-white/[0.015] shadow-card',
        'transition-[box-shadow,transform] duration-300 ease-expo hover:-translate-y-1 hover:shadow-card-hover',
        className,
      )}
    >
      <span aria-hidden className="border-glow z-10 opacity-0 transition-opacity duration-300 ease-expo group-hover/case:opacity-100" />
      <div className={cn('relative min-h-0 flex-1 overflow-hidden', large ? 'aspect-[16/10] md:aspect-auto md:min-h-[26rem]' : 'aspect-[16/10]')}>
        <Photo
          src={project.cover}
          alt={`${project.client} — ${project.title}`}
          sizes={large ? '(min-width: 768px) 66vw, 100vw' : '(min-width: 768px) 33vw, 100vw'}
          className="absolute inset-0"
          imgClassName="group-hover/case:scale-[1.03]"
        />
        <span className="absolute left-4 top-4 z-10 rounded-full border border-white/10 bg-base/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted backdrop-blur">
          {project.category}
        </span>
      </div>
      <div className="flex items-start justify-between gap-4 border-t border-white/[0.06] p-5">
        <div className="min-w-0">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            {project.client} · {project.year}
          </p>
          <h3 className={cn('mt-1.5 text-pretty font-semibold tracking-[-0.02em] text-fg', large ? 'text-xl md:text-2xl' : 'text-lg')}>{project.title}</h3>
        </div>
        <span className="mt-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-muted transition-all duration-300 ease-expo group-hover/case:border-accent group-hover/case:bg-accent group-hover/case:text-accent-ink">
          <ArrowUpRight className="size-4 transition-transform duration-300 ease-expo group-hover/case:rotate-45" />
        </span>
      </div>
    </Link>
  )
}
