import { ArrowLeft } from 'lucide-react'
import { HalftoneOrb } from '../components/art/HalftoneOrb'
import { ButtonLink } from '../components/ui/Button'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export function NotFound() {
  useDocumentTitle('Not found')
  return (
    <section className="relative flex min-h-[85dvh] items-center pt-24">
      <div className="container-x grid items-center gap-8 md:grid-cols-2">
        <div>
          <p className="font-mono text-sm tracking-[0.2em] text-accent">404</p>
          <h1 className="text-gradient mt-4 text-5xl font-semibold leading-none tracking-[-0.045em] md:text-7xl">
            This page lost a few <span className="font-serif font-normal italic">dots.</span>
          </h1>
          <p className="mt-6 max-w-md text-muted md:text-lg">The link might be old, or we moved something. Either way, the good stuff is this way.</p>
          <ButtonLink to="/" size="lg" className="mt-8">
            <ArrowLeft className="size-4" /> Back home
          </ButtonLink>
        </div>
        <div className="mx-auto aspect-square w-full max-w-sm opacity-80">
          <HalftoneOrb spacing={14} />
        </div>
      </div>
    </section>
  )
}
