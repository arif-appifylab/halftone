const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

/** "Add to Google Calendar" link (works without any integration). */
export function googleCalendarUrl(e: { start: Date; end: Date; title: string; details: string; location?: string }) {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${stamp(e.start)}/${stamp(e.end)}`,
    details: e.details,
    ...(e.location ? { location: e.location } : {}),
  })
  return `https://calendar.google.com/calendar/render?${p}`
}
