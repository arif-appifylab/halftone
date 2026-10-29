import settings from '../../settings.json'

/** Words and links come from settings.json (the file owners customise). */
export const site = {
  name: settings.name,
  tagline: settings.tagline,
  email: settings.email,
  locations: settings.locations,
  availability: settings.availability,
  socials: settings.socials,
}

export const nav = [
  { label: 'Work', to: '/work' },
  { label: 'Studio', to: '/studio' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Journal', to: '/journal' },
  { label: 'Contact', to: '/contact' },
]

export const clients = settings.clients

export const stats = [
  { value: 64, prefix: '', suffix: '', label: 'Products launched since 2018' },
  { value: 6, suffix: ' wks', label: 'Median kickoff → launch' },
  { value: 1.4, prefix: '$', suffix: 'B', label: 'Raised by clients post-launch', decimals: 1 },
  { value: 92, suffix: '%', label: 'Clients who come back' },
]

export const typedWords = settings.typedWords
