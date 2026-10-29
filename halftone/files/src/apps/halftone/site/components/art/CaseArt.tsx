import { useId, type JSX } from 'react'
import type { Project } from '../../data/projects'
import { cn } from '../../lib/cn'

/**
 * Generated artwork for each case study — all SVG, all on-palette.
 * Drawn on an 800×520 canvas and scaled with `slice`, so it fills any card.
 */
export function CaseArt({ project, className }: { project: Pick<Project, 'art' | 'palette' | 'client'>; className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const [a, b] = project.palette
  const Art = ARTS[project.art]

  return (
    <svg viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice" className={cn('block size-full', className)} aria-hidden>
      <defs>
        <radialGradient id={`${uid}-wash`} cx="25%" cy="20%" r="85%">
          <stop offset="0" stopColor={a} stopOpacity="0.2" />
          <stop offset="0.55" stopColor={b} stopOpacity="0.06" />
          <stop offset="1" stopColor="#08080a" stopOpacity="0" />
        </radialGradient>
        <pattern id={`${uid}-dots`} width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx="5" cy="5" r="1.4" fill={b} />
        </pattern>
        <radialGradient id={`${uid}-fade`} cx="85%" cy="90%" r="55%">
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={`${uid}-mask`}>
          <rect width="800" height="520" fill={`url(#${uid}-fade)`} />
        </mask>
        <linearGradient id={`${uid}-ab`} x1="0" x2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect width="800" height="520" fill="#0b0b0e" />
      <rect width="800" height="520" fill={`url(#${uid}-wash)`} />
      <rect width="800" height="520" fill={`url(#${uid}-dots)`} mask={`url(#${uid}-mask)`} opacity="0.55" />
      <Art a={a} b={b} uid={uid} client={project.client} />
    </svg>
  )
}

type ArtProps = { a: string; b: string; uid: string; client: string }

const panel = { fill: '#111115', stroke: 'rgb(255 255 255 / 0.08)' }
const line = (o = 0.08) => `rgb(255 255 255 / ${o})`

function Dashboard({ a, b, uid }: ArtProps) {
  const chart = 'M40 150 C 90 140, 120 90, 170 100 S 250 60, 300 70 S 380 30, 430 40'
  return (
    <g transform="translate(110 70)">
      <rect width="640" height="420" rx="14" {...panel} />
      <rect width="130" height="420" rx="14" fill="#0d0d10" />
      <circle cx="26" cy="28" r="7" fill={a} />
      {[70, 100, 130, 160, 190].map((y, i) => (
        <rect key={y} x="22" y={y} width={i === 1 ? 86 : 70} height="8" rx="4" fill={i === 1 ? a : line(0.1)} opacity={i === 1 ? 0.9 : 1} />
      ))}
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${150 + i * 160} 24)`}>
          <rect width="148" height="72" rx="10" fill="#0d0d10" stroke={line(0.06)} />
          <rect x="14" y="16" width="50" height="6" rx="3" fill={line(0.15)} />
          <rect x="14" y="34" width={70 + i * 10} height="16" rx="4" fill={i === 0 ? a : line(0.3)} />
        </g>
      ))}
      <g transform="translate(150 112)">
        <rect width="468" height="190" rx="10" fill="#0d0d10" stroke={line(0.06)} />
        {[50, 90, 130].map((y) => (
          <line key={y} x1="20" x2="448" y1={y} y2={y} stroke={line(0.05)} />
        ))}
        <defs>
          <linearGradient id={`${uid}-area`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={a} stopOpacity="0.35" />
            <stop offset="1" stopColor={a} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${chart} L430 170 L40 170 Z`} fill={`url(#${uid}-area)`} />
        <path d={chart} fill="none" stroke={a} strokeWidth="2.5" />
        <path d="M40 160 C 120 150, 200 140, 280 120 S 380 110, 430 95" fill="none" stroke={b} strokeWidth="2" strokeDasharray="4 6" />
        <circle cx="300" cy="70" r="5" fill={a} />
        <rect x="270" y="30" width="72" height="24" rx="6" fill="#1a1a20" stroke={line(0.1)} />
        <rect x="280" y="39" width="52" height="6" rx="3" fill={line(0.5)} />
      </g>
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(150 ${322 + i * 30})`}>
          <rect width="468" height="22" rx="5" fill={i === 0 ? 'rgb(255 255 255 / 0.03)' : 'transparent'} />
          <circle cx="12" cy="11" r="4" fill={i === 2 ? b : a} opacity="0.8" />
          <rect x="26" y="8" width="120" height="6" rx="3" fill={line(0.18)} />
          <rect x="380" y="8" width="70" height="6" rx="3" fill={line(0.12)} />
        </g>
      ))}
    </g>
  )
}

function Brand({ a, b, client }: ArtProps) {
  const word = client.toLowerCase()
  return (
    <g>
      <g transform="translate(400 230)">
        <ellipse rx="150" ry="62" fill="none" stroke={a} strokeWidth="3" transform="rotate(-24)" />
        <ellipse rx="150" ry="62" fill="none" stroke={b} strokeWidth="1.5" opacity="0.5" transform="rotate(36)" />
        <circle r="46" fill={a} />
        <circle cx="137" cy="-61" r="9" fill={b} />
      </g>
      <text x="400" y="400" textAnchor="middle" fontFamily="Geist, sans-serif" fontWeight="600" fontSize="56" letterSpacing="-2.5" fill="#ededef">
        {word}
      </text>
      {[a, b, '#ededef', '#16161b'].map((c, i) => (
        <g key={c} transform={`translate(${280 + i * 64} 440)`}>
          <rect width="48" height="48" rx="10" fill={c} stroke={line(0.12)} />
        </g>
      ))}
    </g>
  )
}

function Mobile({ a, b }: ArtProps) {
  const Phone = ({ x, rot, variant }: { x: number; rot: number; variant: 0 | 1 }) => (
    <g transform={`translate(${x} 60) rotate(${rot} 110 220)`}>
      <rect width="220" height="440" rx="34" fill="#0d0d10" stroke={line(0.14)} strokeWidth="2" />
      <rect x="80" y="14" width="60" height="16" rx="8" fill="#000" />
      {variant === 0 ? (
        <>
          <circle cx="110" cy="150" r="62" fill="none" stroke={line(0.08)} strokeWidth="12" />
          <circle cx="110" cy="150" r="62" fill="none" stroke={a} strokeWidth="12" strokeLinecap="round" strokeDasharray="300 400" transform="rotate(-90 110 150)" />
          <text x="110" y="160" textAnchor="middle" fontFamily="Geist, sans-serif" fontWeight="600" fontSize="30" fill="#ededef">78%</text>
          {[250, 304, 358].map((y, i) => (
            <g key={y}>
              <rect x="20" y={y} width="180" height="44" rx="12" fill="rgb(255 255 255 / 0.04)" stroke={line(0.06)} />
              <circle cx="44" cy={y + 22} r="10" fill={i === 0 ? a : line(0.15)} />
              <rect x="64" y={y + 14} width="90" height="6" rx="3" fill={line(0.3)} />
              <rect x="64" y={y + 26} width="60" height="5" rx="2.5" fill={line(0.12)} />
            </g>
          ))}
        </>
      ) : (
        <>
          <rect x="20" y="56" width="180" height="210" rx="18" fill={b} opacity="0.14" />
          <path d="M110 90 q 22 40 0 80 q -22 40 0 80" stroke={b} strokeWidth="5" fill="none" strokeLinecap="round" />
          <circle cx="110" cy="96" r="14" fill={b} />
          <rect x="20" y="286" width="120" height="10" rx="5" fill={line(0.4)} />
          <rect x="20" y="306" width="160" height="6" rx="3" fill={line(0.14)} />
          <rect x="20" y="370" width="180" height="44" rx="14" fill={a} />
          <rect x="72" y="388" width="76" height="8" rx="4" fill="#0b0d03" opacity="0.7" />
        </>
      )}
    </g>
  )
  return (
    <g>
      <Phone x={190} rot={-6} variant={0} />
      <Phone x={400} rot={5} variant={1} />
    </g>
  )
}

function Site({ a, b }: ArtProps) {
  return (
    <g transform="translate(90 60)">
      <rect width="620" height="440" rx="12" {...panel} />
      <rect width="620" height="34" rx="12" fill="#0d0d10" />
      {[18, 34, 50].map((x) => (
        <circle key={x} cx={x} cy="17" r="4.5" fill={line(0.14)} />
      ))}
      <rect x="220" y="10" width="180" height="14" rx="7" fill={line(0.05)} />
      <rect x="40" y="62" width="60" height="8" rx="4" fill={a} opacity="0.85" />
      {[460, 500, 540].map((x) => (
        <rect key={x} x={x} y="62" width="30" height="6" rx="3" fill={line(0.18)} />
      ))}
      <text x="40" y="170" fontFamily="'Instrument Serif', serif" fontSize="78" fill={a} letterSpacing="-1">
        Research,
      </text>
      <text x="40" y="244" fontFamily="'Instrument Serif', serif" fontStyle="italic" fontSize="78" fill={b} letterSpacing="-1">
        slowly.
      </text>
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x="40" y={286 + i * 18} width={[300, 280, 310, 180][i]} height="7" rx="3.5" fill={line(0.14)} />
      ))}
      <rect x="40" y="376" width="130" height="36" rx="8" fill={b} />
      <rect x="62" y="390" width="86" height="8" rx="4" fill="#0b0b0e" opacity="0.7" />
      <g transform="translate(420 120)">
        <rect width="160" height="220" rx="6" fill="#16161b" stroke={line(0.08)} />
        {Array.from({ length: 9 }).map((_, i) => (
          <rect key={i} x="18" y={24 + i * 20} width={i % 3 === 2 ? 80 : 124} height="5" rx="2.5" fill={line(i === 0 ? 0.4 : 0.12)} />
        ))}
        <text x="18" y="214" fontFamily="'Geist Mono', monospace" fontSize="10" fill={a}>¹ fn. 14</text>
      </g>
    </g>
  )
}

function Type({ a, b, uid }: ArtProps) {
  const wave = Array.from({ length: 80 }, (_, i) => {
    const x = 40 + i * 9.5
    const amp = Math.sin(i * 0.35) * Math.sin(i * 0.08) * 70
    return `${i === 0 ? 'M' : 'L'}${x} ${400 + amp}`
  }).join(' ')
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-t`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={a} stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <text x="400" y="300" textAnchor="middle" fontFamily="'Instrument Serif', serif" fontStyle="italic" fontSize="300" fill={`url(#${uid}-t)`} letterSpacing="-10">
        Kk
      </text>
      <path d={wave} fill="none" stroke={b} strokeWidth="3" strokeLinecap="round" />
      {Array.from({ length: 40 }, (_, i) => (
        <rect key={i} x={44 + i * 19} y={470 - Math.abs(Math.sin(i * 0.6)) * 30} width="8" height={Math.abs(Math.sin(i * 0.6)) * 30 + 4} rx="4" fill={line(0.18)} />
      ))}
      <text x="40" y="60" fontFamily="'Geist Mono', monospace" fontSize="14" fill={line(0.5)} letterSpacing="2">KINSOUND DISPLAY — 72PT</text>
    </g>
  )
}

function Orb({ a, b, uid }: ArtProps) {
  return (
    <g>
      <defs>
        <pattern id={`${uid}-sea`} width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="6" cy="6" r="2" fill={b} />
        </pattern>
        <radialGradient id={`${uid}-globe`} cx="38%" cy="35%" r="65%">
          <stop offset="0" stopColor="#fff" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.05" />
        </radialGradient>
        <mask id={`${uid}-gm`}>
          <circle cx="400" cy="270" r="210" fill={`url(#${uid}-globe)`} />
        </mask>
      </defs>
      <circle cx="400" cy="270" r="210" fill="#0d0d12" />
      <rect width="800" height="520" fill={`url(#${uid}-sea)`} mask={`url(#${uid}-gm)`} opacity="0.85" />
      <circle cx="400" cy="270" r="210" fill="none" stroke={line(0.12)} />
      {[
        'M250 200 Q 400 80 560 210',
        'M230 330 Q 380 260 590 340',
        'M300 420 Q 420 300 520 150',
      ].map((d, i) => (
        <g key={d}>
          <path d={d} fill="none" stroke={a} strokeWidth="2" strokeDasharray="5 7" opacity={0.9 - i * 0.2} />
        </g>
      ))}
      {[[250, 200], [560, 210], [230, 330], [590, 340], [300, 420], [520, 150]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="14" fill={a} opacity="0.15" />
          <circle cx={x} cy={y} r="5" fill={a} />
        </g>
      ))}
      <g transform="translate(560 410)">
        <rect width="170" height="64" rx="10" fill="#111115" stroke={line(0.1)} />
        <circle cx="20" cy="22" r="5" fill="#ff6b5b" />
        <rect x="34" y="18" width="100" height="7" rx="3.5" fill={line(0.4)} />
        <rect x="20" y="40" width="130" height="6" rx="3" fill={line(0.14)} />
      </g>
    </g>
  )
}

const ARTS: Record<Project['art'], (p: ArtProps) => JSX.Element> = {
  dashboard: Dashboard,
  brand: Brand,
  mobile: Mobile,
  site: Site,
  type: Type,
  orb: Orb,
}
