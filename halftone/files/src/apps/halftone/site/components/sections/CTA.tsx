import { ArrowRight } from 'lucide-react'
import { useAvailability } from '../../lib/queries'
import { HalftoneOrb } from '../art/HalftoneOrb'
import { useBooking } from '../booking/BookingContext'
import { Button, ButtonLink } from '../ui/Button'
import { LivePill } from '../ui/Eyebrow'
import { Reveal } from '../ui/Reveal'
import { Accent } from '../ui/SectionHeader'

export function CTA() {
  const booking = useBooking()
  const availability = useAvailability()
  return (
    <section className="py-16 md:py-24">
      <div className="container-x">
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-3xl border border-white/[0.07] bg-elevated px-6 pb-40 pt-16 text-center shadow-window md:px-12 md:pb-52 md:pt-24">
            <span aria-hidden className="pointer-events-none absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
            <div aria-hidden className="absolute left-1/2 top-full -z-10 size-[44rem] -translate-x-1/2 -translate-y-[24%] opacity-60">
              <HalftoneOrb spacing={11} />
            </div>
            <div aria-hidden className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgb(142_124_255/0.16),transparent_70%)]" />
            <LivePill>{availability}</LivePill>
            <h2 className="text-gradient mx-auto mt-6 max-w-3xl text-balance text-4xl font-semibold leading-[1] tracking-[-0.045em] md:text-7xl">
              Let’s make something <Accent>unmistakable.</Accent>
            </h2>
            <p className="mx-auto mt-6 max-w-lg text-pretty text-muted md:text-lg">
              Tell us what you’re building. We reply within one business day — usually with questions, never with a deck.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
              <ButtonLink to="/contact" size="lg">
                Start a project <ArrowRight className="size-4" />
              </ButtonLink>
              <Button variant="secondary" size="lg" onClick={booking.open}>
                Book a call
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
