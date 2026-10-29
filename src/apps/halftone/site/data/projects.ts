export type ArtKind = 'dashboard' | 'brand' | 'mobile' | 'site' | 'type' | 'orb'
export type Category = 'Brand' | 'Product' | 'Web'

export type Project = {
  slug: string
  client: string
  title: string
  category: Category
  year: string
  services: string[]
  timeline: string
  summary: string
  challenge: string
  approach: { title: string; body: string }[]
  outcome: string
  metrics: { value: string; label: string }[]
  /** Unsplash photo ids — cover + two gallery shots. */
  cover: string
  gallery: [string, string]
  art: ArtKind
  /** Two colors that drive the generated artwork. */
  palette: [string, string]
  quote?: { text: string; name: string; role: string }
}

export const projects: Project[] = [
  {
    slug: 'quillon',
    cover: 'photo-1551288049-bebda4e38f71',
    gallery: ['photo-1460925895917-afdab827c52f', 'photo-1542744173-05336fcc7ad4'],
    client: 'Quillon',
    title: 'A ledger that finance teams actually like opening',
    category: 'Product',
    year: '2026',
    services: ['Product design', 'Design system', 'Brand refresh'],
    timeline: '14 weeks',
    summary: 'Redesigning a B2B accounting platform around one idea: every number should be one click from its source.',
    challenge:
      'Quillon had grown from a reconciliation tool into a full ledger, and the interface showed every year of that growth. Power users had 40 keyboard shortcuts memorised; new users churned in week two.',
    approach: [
      { title: 'Trace every number', body: 'We made provenance a first-class UI pattern — hover any figure to see the transactions behind it.' },
      { title: 'One system, three densities', body: 'A token-driven design system with compact, default and presentation densities, switchable per view.' },
      { title: 'Ship behind flags', body: 'We paired with Quillon engineers and shipped 31 screens incrementally, never a big-bang redesign.' },
    ],
    outcome: 'Week-two churn fell by more than half, and the design system now powers three products.',
    metrics: [
      { value: '−58%', label: 'Week-two churn' },
      { value: '3.1×', label: 'Faster month-end close' },
      { value: '214', label: 'Components in system' },
    ],
    art: 'dashboard',
    palette: ['#c8f53c', '#8e7cff'],
    quote: {
      text: 'Halftone didn’t hand us a Figma file and leave. They sat in our standups and shipped with us. Our engineers still quote their naming conventions.',
      name: 'Ines Carvalho',
      role: 'VP Product, Quillon',
    },
  },
  {
    slug: 'orbitly',
    cover: 'photo-1607799279861-4dd421887fb3',
    gallery: ['photo-1636247499180-13285c86be9b', 'photo-1619410283995-43d9134e7656'],
    client: 'Orbitly',
    title: 'Making continuous integration feel calm',
    category: 'Brand',
    year: '2026',
    services: ['Brand identity', 'Website', 'Launch'],
    timeline: '8 weeks',
    summary: 'A full rebrand and launch site for a CI platform that wanted to stand apart from a sea of neon dev tools.',
    challenge:
      'Every competitor shouted. Orbitly’s product was genuinely quieter — fewer flaky builds, fewer pages at 3am — but its brand looked like everyone else’s.',
    approach: [
      { title: 'A brand built on orbits', body: 'A mark drawn from a single elliptical path, animated to show builds circling to completion.' },
      { title: 'Quiet confidence', body: 'Muted midnight palette, generous spacing, and copy that promised less drama instead of more speed.' },
      { title: 'Launch as an event', body: 'Launch film, interactive build visualiser, and a Product Hunt kit — #1 Product of the Day.' },
    ],
    outcome: 'Orbitly closed its Series B six weeks after launch and doubled inbound demo requests.',
    metrics: [
      { value: '#1', label: 'Product of the Day' },
      { value: '2.2×', label: 'Inbound demo requests' },
      { value: '$38M', label: 'Series B, 6 weeks later' },
    ],
    art: 'brand',
    palette: ['#8e7cff', '#5ad1ff'],
    quote: {
      text: 'We asked for a logo. We got a point of view. Investors brought up the brand before they brought up the metrics.',
      name: 'Daniel Okafor',
      role: 'Co-founder & CEO, Orbitly',
    },
  },
  {
    slug: 'mendwell',
    cover: 'photo-1649751361457-01d3a696c7e6',
    gallery: ['photo-1551650975-87deedd944c3', 'photo-1541976844346-f18aeac57b06'],
    client: 'Mendwell',
    title: 'Physical therapy that fits in your pocket',
    category: 'Product',
    year: '2025',
    services: ['Product design', 'Motion', 'Research'],
    timeline: '12 weeks',
    summary: 'A patient app that turns prescribed exercises into short, guided sessions with real-time form feedback.',
    challenge:
      'Patients forgot their home exercises within days. Clinicians had no visibility until the next appointment — usually too late.',
    approach: [
      { title: 'Ten-minute sessions', body: 'Programs broken into short, playlist-like sessions with clear progress and gentle streaks.' },
      { title: 'Motion as instruction', body: 'We built a library of 180 looped 3D demonstrations, readable at a glance mid-exercise.' },
      { title: 'Clinician view', body: 'A lightweight dashboard flags patients who are slipping before it becomes a setback.' },
    ],
    outcome: 'Adherence to home programs nearly doubled in the pilot across 14 clinics.',
    metrics: [
      { value: '1.9×', label: 'Program adherence' },
      { value: '4.8★', label: 'App Store rating' },
      { value: '14', label: 'Clinics in pilot' },
    ],
    art: 'mobile',
    palette: ['#5fd39a', '#c8f53c'],
  },
  {
    slug: 'fieldnote',
    cover: 'photo-1483546416237-76fd26bbcdd1',
    gallery: ['photo-1654124803453-5bb8819e1524', 'photo-1498075702571-ecb018f3752d'],
    client: 'Fieldnote',
    title: 'A launch site that reads like a manifesto',
    category: 'Web',
    year: '2026',
    services: ['Website', 'Copywriting', 'Motion'],
    timeline: '5 weeks',
    summary: 'Launch website for an AI research notebook — written, designed and built in production Next.js in five weeks.',
    challenge: 'Fieldnote had a remarkable product and a waitlist page. Launch was five weeks out, with a keynote slot already booked.',
    approach: [
      { title: 'Write first', body: 'We wrote the page before we designed it — a long-form argument for slower, better research.' },
      { title: 'Editorial layout', body: 'Serif display type, wide margins and footnotes. It looks like a journal because it is one.' },
      { title: 'Built to be edited', body: 'Every section lives in Sanity, so their team ships updates without opening a PR.' },
    ],
    outcome: 'The site converted 11% of visitors to signups on launch day and still averages over four minutes on page.',
    metrics: [
      { value: '11%', label: 'Launch-day conversion' },
      { value: '4:12', label: 'Avg. time on page' },
      { value: '99', label: 'Lighthouse performance' },
    ],
    art: 'site',
    palette: ['#f4efe6', '#c8f53c'],
    quote: {
      text: 'Five weeks, keynote deadline, zero drama. The site went live during the talk and nobody on our team had to touch it.',
      name: 'Maya Lindqvist',
      role: 'Founder, Fieldnote',
    },
  },
  {
    slug: 'parallax',
    cover: 'photo-1724597500306-a4cbb7d1324e',
    gallery: ['photo-1699588999949-e25959a59550', 'photo-1526628953301-3e589a6a8b74'],
    client: 'Parallax Freight',
    title: 'Air traffic control for container logistics',
    category: 'Product',
    year: '2025',
    services: ['Product design', 'Data visualisation'],
    timeline: '16 weeks',
    summary: 'A live operations console that lets a five-person team track 30,000 containers across four oceans.',
    challenge: 'Dispatchers juggled six tools and a wall of spreadsheets. Delays were discovered by customers before the team.',
    approach: [
      { title: 'Exceptions first', body: 'The default view shows only what’s going wrong, ranked by cost of delay.' },
      { title: 'A map that earns its space', body: 'Vessel paths, port congestion and weather on one canvas, legible at a glance.' },
      { title: 'Keyboard-native', body: 'Every action reachable from a command bar — dispatchers rarely touch the mouse.' },
    ],
    outcome: 'Parallax now spots 87% of delays before the customer does, with the same team size.',
    metrics: [
      { value: '87%', label: 'Delays caught early' },
      { value: '6 → 1', label: 'Tools consolidated' },
      { value: '30k', label: 'Containers tracked live' },
    ],
    art: 'orb',
    palette: ['#ff8a5b', '#8e7cff'],
  },
  {
    slug: 'kinsound',
    cover: 'photo-1599669454699-248893623440',
    gallery: ['photo-1585298723682-7115561c51b7', 'photo-1520170350707-b2da59970118'],
    client: 'Kinsound',
    title: 'An identity you can hear',
    category: 'Brand',
    year: '2024',
    services: ['Brand identity', 'Packaging', 'Sonic branding'],
    timeline: '10 weeks',
    summary: 'Visual and sonic identity for a spatial-audio hardware startup, from wordmark to unboxing chime.',
    challenge: 'Kinsound’s headphones sounded remarkable. Their brand looked like a placeholder.',
    approach: [
      { title: 'Type from waveforms', body: 'A custom display face whose letterforms are drawn from the shapes of sound waves.' },
      { title: 'Sonic logo', body: 'A four-note signature, composed with an audio designer, plays on power-on and in every ad.' },
      { title: 'Packaging as ritual', body: 'A slow, layered unboxing that ends with the chime — filmed thousands of times on TikTok.' },
    ],
    outcome: 'The launch batch sold out in 36 hours, and the unboxing became the brand’s best marketing channel.',
    metrics: [
      { value: '36 hrs', label: 'Launch batch sell-out' },
      { value: '12M', label: 'Organic unboxing views' },
      { value: '1', label: 'Custom typeface' },
    ],
    art: 'type',
    palette: ['#ff6bb5', '#c8f53c'],
  },
]

export const getProject = (slug?: string) => projects.find((p) => p.slug === slug)
