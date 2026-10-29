/** Types shared by the API server and the React client. */
import type { LocationType, QuestionMode } from './booking'
import type { RichDoc } from './richtext'

export type InquiryStatus = 'new' | 'contacted' | 'proposal' | 'won' | 'lost'
export const INQUIRY_STATUSES: InquiryStatus[] = ['new', 'contacted', 'proposal', 'won', 'lost']

export type Estimate = {
  plan: string
  seats?: string | null
  commitment?: string | null
  estimate?: number | null
  extras?: string[]
}

export type Inquiry = {
  id: number
  name: string
  email: string
  company: string
  budget: string
  services: string[]
  message: string
  estimate: Estimate | null
  status: InquiryStatus
  notes: string
  createdAt: string
  updatedAt: string
}

export type BookingStatus = 'confirmed' | 'completed' | 'cancelled'


export type Booking = {
  id: number
  date: string // YYYY-MM-DD, host timezone
  time: string // HH:MM, host timezone
  duration: number // minutes
  name: string
  email: string
  phone: string
  company: string
  note: string
  status: BookingStatus
  locationType: LocationType
  /** Join link (the custom link, or one the studio set by hand). */
  meetingUrl: string
  /** For in-person meetings. */
  address: string
  guestTz: string
  createdAt: string
}

/** Everything the public booking modal needs to render. */
export type PublicBookingPage = {
  name: string
  description: string
  durations: number[]
  duration: number
  timezone: string
  timezoneLabel: string
  location: { type: LocationType; label: string; address: string }
  questions: { phone: QuestionMode; company: QuestionMode; notes: QuestionMode }
  acceptingBookings: boolean
  days: { date: string; slots: { time: string; available: boolean }[] }[]
}

/** What the booking modal gets back after a successful booking. */
export type BookingConfirmation = {
  date: string
  time: string
  duration: number
  timezoneLabel: string
  locationType: LocationType
  locationLabel: string
  meetingUrl: string
  address: string
  calendarUrl: string
}

export type PostCategory = 'Process' | 'Craft' | 'Studio' | 'Notes'
export const POST_CATEGORIES: PostCategory[] = ['Process', 'Craft', 'Studio', 'Notes']

export type Post = {
  id: number
  slug: string
  title: string
  excerpt: string
  category: PostCategory
  author: string
  readingTime: string
  palette: [string, string]
  cover: string
  /** TipTap / ProseMirror JSON, sanitised on save (see shared/richtext.ts). */
  body: RichDoc
  published: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export type PublicSettings = {
  availability: string
}

export type Stats = {
  inquiries: { total: number; new: number; last7: number }
  bookings: { upcoming: number; today: number }
  pipeline: number
  posts: { published: number; drafts: number }
  series: { date: string; count: number }[]
  recentInquiries: Inquiry[]
  upcomingBookings: Booking[]
}
