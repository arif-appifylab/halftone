import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { PageHero } from '../components/layout/PageHero'
import { CTA } from '../components/sections/CTA'
import { Accent } from '../components/ui/SectionHeader'
import { CaseCard } from '../components/work/CaseCard'
import { projects, type Category } from '../data/projects'
import { cn } from '../lib/cn'
import { EASE } from '../lib/motion'
import { useDocumentTitle } from '../lib/useDocumentTitle'

const filters: ('All' | Category)[] = ['All', 'Brand', 'Product', 'Web']

export function Work() {
  useDocumentTitle('Work')
  const [filter, setFilter] = useState<(typeof filters)[number]>('All')
  const list = filter === 'All' ? projects : projects.filter((p) => p.category === filter)

  return (
    <>
      <PageHero
        eyebrow="Work"
        title={<>Case studies, with the <Accent>receipts.</Accent></>}
        lead="Every project here shipped. Every one lists the metric we were hired to move and what happened to it."
      />
      <section className="pb-16 md:pb-24">
        <div className="container-x">
          <div role="group" aria-label="Filter by discipline" className="mb-8 flex flex-wrap gap-2">
            {filters.map((f) => {
              const count = f === 'All' ? projects.length : projects.filter((p) => p.category === f).length
              return (
                <button
                  key={f}
                  type="button"
                  aria-pressed={filter === f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'relative rounded-full px-4 py-2 text-sm transition-colors duration-200',
                    filter === f ? 'text-accent-ink' : 'text-muted shadow-inset hover:text-fg',
                  )}
                >
                  {filter === f && <motion.span layoutId="work-filter" className="absolute inset-0 rounded-full bg-accent shadow-accent" transition={{ duration: 0.3, ease: EASE }} />}
                  <span className="relative">
                    {f} <span className="ml-1 font-mono text-[11px] opacity-60">{count}</span>
                  </span>
                </button>
              )
            })}
          </div>
          <motion.div layout className="grid gap-4 md:grid-cols-2 md:gap-5">
            <AnimatePresence mode="popLayout">
              {list.map((p) => (
                <motion.div
                  key={p.slug}
                  layout
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.35, ease: EASE }}
                >
                  <CaseCard project={p} className="h-full" />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>
      <CTA />
    </>
  )
}
