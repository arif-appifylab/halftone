import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useRef, type ReactNode } from 'react'
import { typedWords } from '../../data/site'
import { EASE } from '../../lib/motion'
import { useAvailability } from '../../lib/queries'
import { useTypewriter } from '../../lib/useTypewriter'
import { HalftoneOrb } from '../art/HalftoneOrb'
import { useBooking } from '../booking/BookingContext'
import { Button, ButtonLink } from '../ui/Button'
import { LivePill } from '../ui/Eyebrow'
import { Accent } from '../ui/SectionHeader'

const rise = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: EASE, delay },
})

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const booking = useBooking()
  const typed = useTypewriter(typedWords)
  const availability = useAvailability()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  // Parallax: fade, shrink and sink over the first half of the hero's exit.
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95])
  const y = useTransform(scrollYProgress, [0, 0.5], [0, 100])
  const orbY = useTransform(scrollYProgress, [0, 1], [0, -60])

  return (
    <section ref={ref} className="relative overflow-hidden pb-16 pt-28 md:pb-28 md:pt-36">
      <motion.div style={reduce ? undefined : { opacity, scale, y }} className="container-x grid items-center gap-8 lg:grid-cols-[1.15fr_1fr] lg:gap-4">
        <div className="relative z-10 flex flex-col items-start">
          <motion.div {...rise(0)}>
            <LivePill>{availability}</LivePill>
          </motion.div>

          <motion.h1
            {...rise(0.08)}
            className="text-gradient mt-7 text-balance text-[2.9rem] font-semibold leading-[0.95] tracking-[-0.045em] sm:text-6xl md:text-7xl xl:text-[5.75rem]"
          >
            Design that makes software feel <Accent>inevitable.</Accent>
          </motion.h1>

          <motion.p {...rise(0.16)} className="mt-7 max-w-xl text-pretty text-base leading-relaxed text-muted md:text-xl">
            Halftone is an independent studio crafting{' '}
            <span className="whitespace-nowrap font-mono text-[0.92em] text-fg" aria-hidden>
              {typed}
              <span className="ml-px inline-block h-[1.05em] w-[2px] translate-y-[3px] animate-blink bg-accent" />
            </span>
            <span className="sr-only">brand systems, product interfaces, websites and design systems</span>{' '}
            for ambitious software companies.
          </motion.p>

          <motion.div {...rise(0.24)} className="mt-9 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <ButtonLink to="/contact" size="lg">
              Start a project <ArrowRight className="size-4 transition-transform duration-200 ease-expo group-hover:translate-x-0.5" />
            </ButtonLink>
            <Button variant="secondary" size="lg" onClick={booking.open}>
              Book a 30-min intro
            </Button>
          </motion.div>

          <motion.dl {...rise(0.32)} className="mt-12 grid w-full max-w-lg grid-cols-3 gap-6 border-t border-white/[0.06] pt-6">
            {[
              ['64', 'products shipped'],
              ['6 wks', 'median to launch'],
              ['4', 'clients at a time'],
            ].map(([v, l]) => (
              <div key={l}>
                <dt className="sr-only">{l}</dt>
                <dd className="text-2xl font-semibold tracking-[-0.03em] text-fg">{v}</dd>
                <dd className="mt-1 text-xs text-muted">{l}</dd>
              </div>
            ))}
          </motion.dl>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: EASE, delay: 0.2 }}
          style={reduce ? undefined : { y: orbY }}
          className="relative mx-auto aspect-square w-full max-w-[22rem] sm:max-w-md lg:max-w-none"
        >
          <div aria-hidden className="absolute inset-[18%] rounded-full bg-accent/10 blur-[80px]" />
          <HalftoneOrb className="relative" />
          <OrbChip className="left-0 top-[14%]" delay={1}>
            <span className="size-1.5 rounded-full bg-accent" /> Brand
          </OrbChip>
          <OrbChip className="right-[2%] top-[42%]" delay={1.15}>
            <span className="size-1.5 rounded-full bg-glow" /> Product
          </OrbChip>
          <OrbChip className="bottom-[12%] left-[12%]" delay={1.3}>
            <span className="size-1.5 rounded-full bg-fg" /> Web
          </OrbChip>
        </motion.div>
      </motion.div>
    </section>
  )
}

function OrbChip({ children, className, delay }: { children: ReactNode; className: string; delay: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE, delay }}
      className={`absolute hidden items-center gap-2 rounded-full border border-white/[0.08] bg-elevated/80 px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-fg shadow-[0_8px_30px_rgb(0_0_0/0.5)] backdrop-blur-xl sm:inline-flex ${className}`}
    >
      {children}
    </motion.span>
  )
}
