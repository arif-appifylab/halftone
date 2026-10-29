export const formatDate = (iso: string | null | undefined, opts: Intl.DateTimeFormatOptions = { month: 'short', day: '2-digit', year: 'numeric' }) =>
  iso ? new Date(iso).toLocaleDateString('en-US', opts) : '—'

export const timeAgo = (iso: string) => {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`
  return formatDate(iso)
}

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
