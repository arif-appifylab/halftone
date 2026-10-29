import type { Block } from '../../shared/markdown'

/** Seed content — the live journal is served from the API and edited in /admin. */
export type SeedPost = {
  slug: string
  title: string
  excerpt: string
  category: 'Process' | 'Craft' | 'Studio' | 'Notes'
  date: string
  readingTime: string
  author: string
  palette: [string, string]
  cover: string
  body: Block[]
}

export const seedPosts: SeedPost[] = [
  {
    slug: 'design-in-the-browser',
    cover: 'photo-1619410283995-43d9134e7656',
    title: 'Why we stopped handing off designs',
    excerpt: 'The handoff is where good design goes to die. Here’s what we do instead — and why our engineers are happier for it.',
    category: 'Process',
    date: 'Oct 08, 2026',
    readingTime: '6 min',
    author: 'Ana Ribeiro',
    palette: ['#c8f53c', '#8e7cff'],
    body: [
      { type: 'p', text: 'For years our process ended with a beautiful Figma file and a hopeful Loom. Six weeks later, we’d see the shipped product and quietly wince. Spacing drifted, states were missing, motion was gone entirely.' },
      { type: 'p', text: 'None of that was the engineers’ fault. A static file can’t answer the hundred small questions that come up when a design meets real data, real latency and real edge cases.' },
      { type: 'h2', text: 'Design is finished in code' },
      { type: 'p', text: 'So we changed where “done” lives. Every product engagement now includes a designer who writes production React. They sit in the same pull requests as your engineers, and the design is finished when it ships — not when it’s approved.' },
      { type: 'quote', text: 'A design file is a hypothesis. The pull request is the experiment.' },
      { type: 'p', text: 'The result is less beautiful Figma and more beautiful software. We’ll take that trade every time.' },
    ],
  },
  {
    slug: 'dark-mode-is-a-brand-decision',
    cover: 'photo-1666027092835-7e668416b7c8',
    title: 'Dark mode is a brand decision',
    excerpt: 'Inverting your colors isn’t a dark theme. A short guide to designing light — not just removing it.',
    category: 'Craft',
    date: 'Sep 22, 2026',
    readingTime: '8 min',
    author: 'Jonah Weiss',
    palette: ['#8e7cff', '#5ad1ff'],
    body: [
      { type: 'p', text: 'The fastest way to spot a bolted-on dark mode is to look at the shadows. On a dark canvas, drop shadows disappear — and with them, every sense of depth the light theme worked so hard to build.' },
      { type: 'h2', text: 'Light sources, not colors' },
      { type: 'p', text: 'We design dark interfaces the way a cinematographer lights a night scene: a few soft sources, a little haze, and surfaces that catch the light at their edges. Borders become 1px highlights. Elevation becomes glow.' },
      { type: 'quote', text: 'In a dark UI, you’re not choosing colors. You’re placing lamps.' },
      { type: 'p', text: 'Get the lighting right, and the brand color barely needs to appear. When it does, it lands.' },
    ],
  },
  {
    slug: 'four-engagements',
    cover: 'photo-1581091877018-dac6a371d50f',
    title: 'Why we only take four clients at a time',
    excerpt: 'Saying no is the most important thing we do for the clients we say yes to.',
    category: 'Studio',
    date: 'Aug 30, 2026',
    readingTime: '4 min',
    author: 'Ana Ribeiro',
    palette: ['#ff8a5b', '#c8f53c'],
    body: [
      { type: 'p', text: 'Halftone has eleven people. We could take on twelve projects. We take four.' },
      { type: 'p', text: 'Every engagement is led by a founding partner who is in the work every day — not reviewing it on Fridays. That doesn’t scale, and it isn’t supposed to.' },
      { type: 'h2', text: 'What it costs us' },
      { type: 'p', text: 'Revenue, obviously. A waitlist that sometimes runs four months. Occasionally a dream client who can’t wait. What we get back is work we’re proud of and clients who return — 92% of them, at last count.' },
    ],
  },
  {
    slug: 'naming-a-product',
    cover: 'photo-1533226458520-6f71cffeaa6a',
    title: 'Notes on naming a product in 2026',
    excerpt: 'Every good .com is taken. Here’s the process we use to find names that are ownable, sayable and still available.',
    category: 'Notes',
    date: 'Jul 14, 2026',
    readingTime: '7 min',
    author: 'Lior Ben-David',
    palette: ['#ff6bb5', '#8e7cff'],
    body: [
      { type: 'p', text: 'We generate around 600 candidates for every naming project. Roughly three survive. The funnel matters more than the brainstorm.' },
      { type: 'h2', text: 'The four filters' },
      { type: 'p', text: 'Can you say it over a bad phone line? Can you spell it after hearing it once? Can you own it — trademark, domain, handle? And does it still feel right when written in lowercase in a terminal?' },
      { type: 'quote', text: 'If a name only works in the logo, it doesn’t work.' },
      { type: 'p', text: 'That last test eliminates more names than any other, and it’s the one most studios skip.' },
    ],
  },
]
