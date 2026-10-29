import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { process } from '../../data/services'
import { cn } from '../../lib/cn'
import { EASE } from '../../lib/motion'
import { Reveal } from '../ui/Reveal'
import { Accent, SectionHeader } from '../ui/SectionHeader'

const DURATION = 6000

/** Auto-advancing process slider. Pauses on hover/focus or when off-screen. */
export function Process() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { amount: 0.4 })
  const reduce = useReducedMotion()
  const running = inView && !paused && !reduce

  useEffect(() => {
    if (!running) return
    const t = setTimeout(() => setActive((i) => (i + 1) % process.length), DURATION)
    return () => clearTimeout(t)
  }, [active, running])

  const step = process[active]

  return (
    <section className="border-t border-white/[0.05] py-16 md:py-24 lg:py-32">
      <div className="container-x">
        <SectionHeader
          eyebrow="Process"
          title={<>Six weeks, no <Accent>surprises.</Accent></>}
          lead="The same four phases on every engagement. You’ll always know what we’re doing this week and what you’ll see on Friday."
        />
        <Reveal>
          <div
            ref={ref}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
            className="grid overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.05] to-white/[0.015] shadow-card lg:grid-cols-[22rem_1fr]"
          >
            <div role="tablist" aria-label="Process steps" className="flex overflow-x-auto border-b border-white/[0.06] no-scrollbar lg:flex-col lg:border-b-0 lg:border-r">
              {process.map((p, i) => (
                <button
                  key={p.step}
                  role="tab"
                  id={`step-tab-${i}`}
                  aria-selected={active === i}
                  aria-controls="step-panel"
                  onClick={() => setActive(i)}
                  className={cn(
                    'relative flex min-w-44 flex-1 flex-col items-start gap-1 p-5 text-left transition-colors duration-200 lg:min-w-0 lg:flex-none lg:p-6',
                    'border-r border-white/[0.06] last:border-r-0 lg:border-b lg:border-r-0',
                    active === i ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]',
                  )}
                >
                  <span className={cn('font-mono text-[11px] tracking-[0.16em]', active === i ? 'text-accent' : 'text-muted')}>
                    {p.step} · {p.duration.toUpperCase()}
                  </span>
                  <span className={cn('text-lg font-semibold tracking-[-0.02em]', active === i ? 'text-fg' : 'text-muted')}>{p.title}</span>
                  {/* progress */}
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-white/[0.04]">
                    {active === i && (
                      <motion.span
                        key={`${active}-${running}`}
                        className="absolute inset-0 origin-left bg-accent shadow-[0_0_10px_var(--color-accent)]"
                        initial={{ scaleX: running ? 0 : 1 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: running ? DURATION / 1000 : 0, ease: 'linear' }}
                        style={{ transformOrigin: 'left' }}
                      />
                    )}
                  </span>
                </button>
              ))}
            </div>

            <div id="step-panel" role="tabpanel" aria-labelledby={`step-tab-${active}`} className="relative min-h-[22rem] overflow-hidden p-6 md:p-10">
              <div aria-hidden className="bg-halftone-lg absolute -bottom-16 -right-16 size-[26rem] text-accent/30 [mask-image:radial-gradient(circle_at_75%_75%,#000,transparent_62%)]" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="relative flex h-full flex-col"
                >
                  <span className="font-serif text-8xl italic leading-none text-white/[0.09] md:text-[9rem]">{step.step}</span>
                  <h3 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-fg md:text-4xl">{step.title}</h3>
                  <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted md:text-lg">{step.body}</p>
                  <ul className="mt-8 flex flex-wrap gap-2">
                    {step.output.map((o) => (
                      <li key={o} className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-base/60 px-3 py-2 text-sm text-fg backdrop-blur">
                        <Check className="size-3.5 text-accent" /> {o}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
