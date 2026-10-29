export type Plan = {
  id: 'sprint' | 'partner' | 'embedded'
  name: string
  price: number
  cadence: string
  blurb: string
  features: string[]
  featured?: boolean
}

export const plans: Plan[] = [
  {
    id: 'sprint',
    name: 'Sprint',
    price: 9500,
    cadence: 'per 2-week sprint',
    blurb: 'A fixed-scope burst for one clear problem — a landing page, an audit, a brand refresh.',
    features: ['One senior designer', 'Fixed scope & date', 'Two review rounds', 'Figma + source files'],
  },
  {
    id: 'partner',
    name: 'Partner',
    price: 14000,
    cadence: 'per month',
    blurb: 'Ongoing design capacity for teams shipping every week. Pause or cancel any month.',
    features: ['Lead designer + partner oversight', 'Unlimited requests, one at a time', 'Weekly reviews & Slack', 'Design-to-code handoff'],
    featured: true,
  },
  {
    id: 'embedded',
    name: 'Embedded',
    price: 24000,
    cadence: 'per month',
    blurb: 'A small Halftone team inside your company — brand, product and engineering in one.',
    features: ['Design + engineering pod', 'Parallel workstreams', 'Joins your standups', 'Quarterly brand reviews'],
  },
]

export const addOns = [
  { id: 'engineering', label: 'Front-end engineering', price: 6500 },
  { id: 'motion', label: 'Motion & 3D', price: 3200 },
  { id: 'copy', label: 'Copywriting', price: 2400 },
  { id: 'research', label: 'User research', price: 2800 },
] as const

export const commitments = [
  { id: 'monthly', label: 'Monthly', discount: 0 },
  { id: 'quarterly', label: 'Quarterly', discount: 0.08 },
  { id: 'annual', label: 'Annual', discount: 0.15 },
] as const

export type AddOnId = (typeof addOns)[number]['id']
export type CommitmentId = (typeof commitments)[number]['id']

/** Each extra designer seat adds 70% of the plan base. */
export function estimate(planId: Plan['id'], seats: number, addOnIds: AddOnId[], commitment: CommitmentId) {
  const plan = plans.find((p) => p.id === planId)!
  const base = plan.price * (1 + (seats - 1) * 0.7)
  const extras = addOns.filter((a) => addOnIds.includes(a.id)).reduce((sum, a) => sum + a.price, 0)
  const discount = commitments.find((c) => c.id === commitment)!.discount
  const subtotal = base + extras
  const total = Math.round((subtotal * (1 - discount)) / 50) * 50
  return { plan, subtotal, total, savings: subtotal - total }
}

export const usd = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
