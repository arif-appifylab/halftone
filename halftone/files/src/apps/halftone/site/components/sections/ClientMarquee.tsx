import { clients } from '../../data/site'

/** Infinite wordmark strip; pauses on hover, edges masked. */
export function ClientMarquee() {
  const row = [...clients, ...clients]
  return (
    <section aria-label="Selected clients" className="relative border-y border-white/[0.05] py-8">
      <p className="container-x mb-6 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
        Trusted by teams who ship
      </p>
      <div className="group overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_12%,#000_88%,transparent)]">
        <ul className="flex w-max animate-marquee items-center gap-14 pr-14 group-hover:[animation-play-state:paused]">
          {row.map((c, i) => (
            <li
              key={i}
              aria-hidden={i >= clients.length}
              className="flex items-center gap-2.5 text-xl font-semibold tracking-[-0.04em] text-white/35 transition-colors duration-300 hover:text-fg"
            >
              <Glyph i={i % clients.length} />
              {c.toLowerCase()}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** Tiny invented logomarks so the strip reads as real brands. */
function Glyph({ i }: { i: number }) {
  const shapes = [
    <circle key="c" cx="10" cy="10" r="7" fill="none" stroke="currentColor" strokeWidth="2.5" />,
    <ellipse key="e" cx="10" cy="10" rx="8" ry="4" fill="none" stroke="currentColor" strokeWidth="2.2" transform="rotate(-25 10 10)" />,
    <path key="p" d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="3" />,
    <path key="t" d="M10 3 17 16H3Z" fill="currentColor" />,
    <rect key="r" x="3" y="3" width="14" height="14" rx="4" fill="currentColor" />,
  ]
  return (
    <svg viewBox="0 0 20 20" className="size-5" aria-hidden>
      {shapes[i % shapes.length]}
    </svg>
  )
}
