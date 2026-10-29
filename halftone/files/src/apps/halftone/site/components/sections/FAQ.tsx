import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useId, useState } from 'react'
import { faqs } from '../../data/faqs'
import { cn } from '../../lib/cn'
import { EASE } from '../../lib/motion'
import { useBooking } from '../booking/BookingContext'
import { Button } from '../ui/Button'
import { Reveal } from '../ui/Reveal'
import { Accent, SectionHeader } from '../ui/SectionHeader'

export function FAQ() {
  const booking = useBooking()
  return (
    <section className="border-t border-white/[0.05] py-16 md:py-24 lg:py-32">
      <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.4fr] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <SectionHeader eyebrow="FAQ" title={<>Good <Accent>questions.</Accent></>} lead="Still unsure? A 30-minute call usually answers everything." className="md:mb-8" />
          <Reveal>
            <Button variant="secondary" onClick={booking.open}>
              Book an intro call
            </Button>
          </Reveal>
        </div>
        <Reveal className="divide-y divide-white/[0.06] border-y border-white/[0.06]">
          {faqs.map((f, i) => (
            <Item key={f.q} q={f.q} a={f.a} defaultOpen={i === 0} />
          ))}
        </Reveal>
      </div>
    </section>
  )
}

function Item({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen)
  const id = useId()
  return (
    <div>
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="group flex w-full items-center justify-between gap-6 py-5 text-left md:py-6"
        >
          <span className={cn('text-base font-medium tracking-[-0.015em] transition-colors duration-200 md:text-lg', open ? 'text-fg' : 'text-fg/80 group-hover:text-fg')}>{q}</span>
          <span
            className={cn(
              'flex size-8 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ease-expo',
              open ? 'rotate-45 border-accent bg-accent text-accent-ink' : 'border-white/10 text-muted group-hover:border-white/20 group-hover:text-fg',
            )}
          >
            <Plus className="size-4" />
          </span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden"
          >
            <p className="max-w-2xl pb-6 pr-12 leading-relaxed text-muted">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
