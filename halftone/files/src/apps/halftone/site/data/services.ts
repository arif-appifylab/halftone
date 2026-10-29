import type { LucideIcon } from 'lucide-react'
import { Code2, Component, Fingerprint, LayoutPanelTop, Rocket, Sparkles } from 'lucide-react'

export type Capability = {
  id: string
  name: string
  blurb: string
  icon: LucideIcon
  deliverables: string[]
}

export const capabilities: Capability[] = [
  {
    id: 'brand',
    name: 'Brand identity',
    blurb: 'Naming, logo systems, type and color that hold up from favicon to billboard — and in a terminal.',
    icon: Fingerprint,
    deliverables: ['Strategy & positioning', 'Logo & wordmark', 'Type & color system', 'Brand guidelines'],
  },
  {
    id: 'product',
    name: 'Product design',
    blurb: 'Interfaces for complex software, designed in the browser with your engineers, not handed over the wall.',
    icon: LayoutPanelTop,
    deliverables: ['UX audits', 'Flows & prototypes', 'High-fidelity UI', 'Usability testing'],
  },
  {
    id: 'web',
    name: 'Websites',
    blurb: 'Marketing sites built in production code. Fast, accessible, and editable by your team on day one.',
    icon: Code2,
    deliverables: ['Next.js & Framer builds', 'CMS setup', 'Core Web Vitals > 95', 'Analytics & SEO'],
  },
  {
    id: 'systems',
    name: 'Design systems',
    blurb: 'Tokens, components and docs that let a team of three ship like a team of thirty.',
    icon: Component,
    deliverables: ['Design tokens', 'Figma libraries', 'React components', 'Documentation'],
  },
  {
    id: 'motion',
    name: 'Motion & 3D',
    blurb: 'Product films, interaction specs and launch visuals that make a feature feel like an event.',
    icon: Sparkles,
    deliverables: ['Launch films', 'UI motion specs', '3D product renders', 'Lottie & Rive'],
  },
  {
    id: 'launch',
    name: 'Launch',
    blurb: 'Everything for launch day — announcement pages, social kits, deck, and a Product Hunt plan.',
    icon: Rocket,
    deliverables: ['Launch pages', 'Pitch & sales decks', 'Social kits', 'Press assets'],
  },
]

export const process = [
  {
    step: '01',
    title: 'Diagnose',
    duration: 'Week 1',
    body: 'We interview your founders, customers and sales team, audit what exists, and write a one-page brief everyone signs.',
    output: ['Stakeholder interviews', 'Competitive teardown', 'Signed creative brief'],
  },
  {
    step: '02',
    title: 'Direction',
    duration: 'Week 2',
    body: 'Two or three distinct territories, each shown on real surfaces — your homepage, your app, your pitch deck. You pick one.',
    output: ['2–3 creative territories', 'Applied mockups', 'Direction workshop'],
  },
  {
    step: '03',
    title: 'Design sprints',
    duration: 'Weeks 3–6',
    body: 'Weekly sprints with a live Figma and a staging URL. You see progress every Friday and can redirect us any day.',
    output: ['Weekly Loom reviews', 'Live staging site', 'Shared Slack channel'],
  },
  {
    step: '04',
    title: 'Ship & support',
    duration: 'Week 6+',
    body: 'We launch with you, hand over files your team can actually use, and stay on call for 30 days after go-live.',
    output: ['Launch-day support', 'Handover & training', '30 days of fixes'],
  },
]
