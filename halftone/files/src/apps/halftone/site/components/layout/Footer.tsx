import { ArrowUpRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { capabilities } from '../../data/services'
import { nav, site } from '../../data/site'
import { useAvailability } from '../../lib/queries'
import { Logo } from '../ui/Logo'

export function Footer() {
  const availability = useAvailability()
  return (
    <footer className="relative mt-24 border-t border-white/[0.06] bg-deep">
      <div aria-hidden className="hairline absolute inset-x-0 -top-px h-px" />
      <div className="container-x grid gap-12 py-16 md:grid-cols-12 md:py-20">
        <div className="flex flex-col gap-5 md:col-span-4">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            An independent brand, product and web studio for software companies. Senior people, small teams, shipped in code.
          </p>
          <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            <span className="size-1.5 rounded-full bg-ok" /> {availability}
          </p>
        </div>

        <FooterCol title="Capabilities" className="md:col-span-3">
          {capabilities.map((c) => (
            <span key={c.id} className="text-sm text-muted">{c.name}</span>
          ))}
        </FooterCol>

        <FooterCol title="Studio" className="md:col-span-2">
          {nav.map((n) => (
            <FooterLink key={n.to} to={n.to}>{n.label}</FooterLink>
          ))}
        </FooterCol>

        <FooterCol title="Elsewhere" className="md:col-span-3">
          <a href={`mailto:${site.email}`} className="text-lg font-medium tracking-[-0.02em] text-fg transition-colors duration-200 hover:text-accent">
            {site.email}
          </a>
          {site.socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-1 text-sm text-muted transition-colors duration-200 hover:text-fg">
              {s.label}
              <ArrowUpRight className="size-3 opacity-50 transition-all duration-200 ease-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:opacity-100" />
            </a>
          ))}
        </FooterCol>
      </div>

      <div className="border-t border-white/[0.05]">
        <div className="container-x flex flex-col gap-3 py-6 text-xs text-muted/70 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Halftone Studio, Lda. All rights reserved.</p>
          <p className="font-mono uppercase tracking-[0.14em]">{site.locations.join(' · ')}</p>
        </div>
      </div>

      {/* oversized wordmark, dissolving into a dot screen */}
      <div aria-hidden className="pointer-events-none relative overflow-hidden">
        <p className="container-x -mb-[0.24em] select-none bg-gradient-to-b from-white/[0.08] to-transparent bg-clip-text text-[25vw] font-semibold leading-none tracking-[-0.07em] text-transparent md:text-[19rem]">
          halftone
        </p>
      </div>
    </footer>
  )
}

function FooterCol({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[0.18em] text-muted/70">{title}</h3>
      <div className="flex flex-col items-start gap-2.5">{children}</div>
    </div>
  )
}

function FooterLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="text-sm text-muted transition-colors duration-200 hover:text-fg">
      {children}
    </Link>
  )
}
