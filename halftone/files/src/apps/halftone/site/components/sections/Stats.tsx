import { stats } from '../../data/site'
import { Counter } from '../ui/Counter'
import { RevealGroup, RevealItem } from '../ui/Reveal'

export function Stats() {
  return (
    <section aria-label="Studio in numbers" className="py-12 md:py-16">
      <div className="container-x">
        <RevealGroup className="grid grid-cols-2 overflow-hidden rounded-2xl bg-white/[0.02] shadow-card lg:grid-cols-4">
          {stats.map((s, i) => (
            <RevealItem
              key={s.label}
              className={`relative p-6 md:p-8 ${i % 2 === 0 ? 'border-r' : ''} ${i < 2 ? 'border-b lg:border-b-0' : ''} border-white/[0.06] lg:border-r lg:last:border-r-0`}
            >
              <p className="text-gradient text-4xl font-semibold tracking-[-0.04em] md:text-5xl">
                <Counter value={s.value} decimals={s.decimals} prefix={s.prefix} suffix={s.suffix} />
              </p>
              <p className="mt-2 text-sm text-muted">{s.label}</p>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  )
}
