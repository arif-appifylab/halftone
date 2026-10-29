/**
 * Small timezone toolkit built on Intl — no dependencies.
 * Booking times are stored as wall-clock "YYYY-MM-DD" + "HH:MM" in the host's
 * timezone; these helpers convert them to real instants and back.
 */

const parts = (utcMs: number, tz: string) => {
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs))
  const get = (t: string) => Number(p.find((x) => x.type === t)?.value)
  return { y: get('year'), mo: get('month'), d: get('day'), h: get('hour'), mi: get('minute'), s: get('second') }
}

/** Minutes the zone is ahead of UTC at that instant (e.g. +60 for Lisbon in summer). */
export function tzOffsetMinutes(utcMs: number, tz: string) {
  const w = parts(utcMs, tz)
  return (Date.UTC(w.y, w.mo - 1, w.d, w.h, w.mi, w.s) - Math.floor(utcMs / 1000) * 1000) / 60_000
}

/** Wall-clock date + time in `tz` → the real instant. */
export function zonedToUtc(date: string, time: string, tz: string): Date {
  const [y, mo, d] = date.split('-').map(Number)
  const [h, mi] = time.split(':').map(Number)
  const guess = Date.UTC(y, mo - 1, d, h, mi)
  // Two passes settle the offset, including across DST changes.
  let utc = guess - tzOffsetMinutes(guess, tz) * 60_000
  utc = guess - tzOffsetMinutes(utc, tz) * 60_000
  return new Date(utc)
}

const pad = (n: number) => String(n).padStart(2, '0')

/** The calendar date in `tz` at that instant, "YYYY-MM-DD". */
export function dateInTz(at: Date, tz: string) {
  const w = parts(at.getTime(), tz)
  return `${w.y}-${pad(w.mo)}-${pad(w.d)}`
}

export const addDays = (date: string, n: number) => {
  const t = new Date(`${date}T12:00:00Z`)
  t.setUTCDate(t.getUTCDate() + n)
  return t.toISOString().slice(0, 10)
}

/** 0 = Sunday. Date-only, so no timezone involved. */
export const weekdayOf = (date: string) => new Date(`${date}T12:00:00Z`).getUTCDay()

export const isValidTz = (tz: string) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz })
    return true
  } catch {
    return false
  }
}

/** "Lisbon (GMT+1)" */
export function tzLabel(tz: string, at = new Date()) {
  const city = tz.split('/').pop()!.replace(/_/g, ' ')
  const off = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'shortOffset' }).formatToParts(at).find((p) => p.type === 'timeZoneName')?.value
  return off ? `${city} (${off})` : city
}
