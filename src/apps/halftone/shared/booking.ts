import { addDays, dateInTz, weekdayOf, zonedToUtc } from './tz'

/**
 * The intro-call "booking link": what it is, when it can be booked, where it
 * happens and what we ask. One config, edited in /admin → Booking settings.
 */

/** Sunday-first, matching Date#getDay(). */
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
export const DURATION_OPTIONS = [15, 20, 30, 45, 60, 90, 120] as const

export type TimeRange = { start: string; end: string } // "HH:MM", end exclusive
export type DateOverride = { date: string; unavailable: boolean; ranges: TimeRange[] }
/** `later`: the studio sends the link itself (set per booking in /admin → Bookings). */
export type LocationType = 'later' | 'in_person' | 'custom'
export type QuestionMode = 'hidden' | 'optional' | 'required'

export type BookingSettings = {
  // Basics
  name: string
  description: string
  durations: number[]
  acceptingBookings: boolean
  // Availability
  timezone: string
  /** Index = weekday (0 = Sunday). Empty = unavailable that day. */
  weekly: TimeRange[][]
  overrides: DateOverride[]
  // Limits
  bufferBefore: number
  bufferAfter: number
  minNoticeHours: number
  windowDays: number
  /** null = no limit */
  maxPerDay: number | null
  /** Minutes between start times; null = the meeting's length. */
  slotInterval: number | null
  // Location
  location: { type: LocationType; customUrl: string; address: string }
  // Questions (name & email are always asked)
  questions: { phone: QuestionMode; company: QuestionMode; notes: QuestionMode }
}

const nineToFive: TimeRange[] = [{ start: '09:00', end: '17:00' }]

export const defaultBookingSettings = (timezone = 'Europe/Lisbon'): BookingSettings => ({
  name: 'Intro call',
  description: 'A no-pitch conversation about what you’re building — and whether we’re the right studio for it.',
  durations: [30],
  acceptingBookings: true,
  timezone,
  weekly: [[], nineToFive, nineToFive, nineToFive, nineToFive, nineToFive, []],
  overrides: [],
  bufferBefore: 0,
  bufferAfter: 0,
  minNoticeHours: 24,
  windowDays: 21,
  maxPerDay: null,
  slotInterval: null,
  location: { type: 'later', customUrl: '', address: '' },
  questions: { phone: 'hidden', company: 'optional', notes: 'required' },
})

export type DayAvailability = { date: string; slots: { time: string; available: boolean }[] }
export type ExistingBooking = { date: string; time: string; duration: number }

export const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
export const fromMinutes = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`

/** The hours that apply on a date: a date override wins over the weekly schedule. */
export function rangesFor(settings: BookingSettings, date: string): TimeRange[] {
  const override = settings.overrides.find((o) => o.date === date)
  if (override) return override.unavailable ? [] : override.ranges
  return settings.weekly[weekdayOf(date)] ?? []
}

/**
 * Bookable days for a meeting of `duration` minutes, from today (in the host's
 * timezone) through the booking window. A slot is unavailable inside the notice
 * period or when it — padded by the buffers — overlaps an existing booking.
 * Days at their daily limit, or with nothing open, are left out.
 */
export function buildAvailability(settings: BookingSettings, booked: ExistingBooking[], duration: number, now = new Date()): DayAvailability[] {
  if (!settings.acceptingBookings) return []
  const tz = settings.timezone
  const earliest = now.getTime() + settings.minNoticeHours * 3_600_000
  const step = settings.slotInterval ?? duration
  const today = dateInTz(now, tz)
  const busy = booked.map((b) => {
    const start = zonedToUtc(b.date, b.time, tz).getTime()
    return { date: b.date, start, end: start + b.duration * 60_000 }
  })

  const days: DayAvailability[] = []
  for (let i = 0; i <= settings.windowDays; i++) {
    const date = addDays(today, i)
    const ranges = rangesFor(settings, date)
    if (!ranges.length) continue
    if (settings.maxPerDay && busy.filter((b) => b.date === date).length >= settings.maxPerDay) continue

    const seen = new Map<string, boolean>()
    for (const r of ranges) {
      for (let m = toMinutes(r.start); m + duration <= toMinutes(r.end); m += step) {
        const time = fromMinutes(m)
        const start = zonedToUtc(date, time, tz).getTime()
        const from = start - settings.bufferBefore * 60_000
        const to = start + (duration + settings.bufferAfter) * 60_000
        const clash = busy.some((b) => b.start < to && b.end > from)
        seen.set(time, (seen.get(time) ?? false) || (start >= earliest && !clash))
      }
    }
    const slots = [...seen].sort(([a], [b]) => a.localeCompare(b)).map(([time, available]) => ({ time, available }))
    if (slots.some((s) => s.available)) days.push({ date, slots })
  }
  return days
}

/** Next `count` weekdays starting tomorrow (used for demo seed data). */
export function upcomingWeekdays(count = 10, from = new Date()) {
  const days: Date[] = []
  const d = new Date(from)
  while (days.length < count) {
    d.setDate(d.getDate() + 1)
    if (d.getDay() !== 0 && d.getDay() !== 6) days.push(new Date(d))
  }
  return days
}

const pad = (n: number) => String(n).padStart(2, '0')
export const toISODate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const locationLabel = (t: LocationType) => (t === 'in_person' ? 'In person' : 'Video call')
