import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarCog, Check, MapPin, Pencil, RotateCcw, Trash2, Video, X } from 'lucide-react'
import { useState } from 'react'
import { toISODate } from '../../../shared/booking'
import type { Booking, BookingStatus } from '../../../shared/types'
import { ButtonLink } from '../../components/ui/Button'
import { api } from '../../lib/api'
import { formatDate } from '../../lib/format'
import { CopyEmail, EmailMenu } from '../components/EmailMenu'
import { useToast } from '../components/Toast'
import { ConfirmButton, EmptyState, PageHeader, Panel, Segmented, Spinner, StatusBadge } from '../components/ui'

type Tab = 'upcoming' | 'past' | 'cancelled'

export function Bookings() {
  const [tab, setTab] = useState<Tab>('upcoming')
  const { data, isPending, isError } = useQuery({ queryKey: ['bookings'], queryFn: () => api<Booking[]>('admin/bookings') })
  const today = toISODate(new Date())

  const groups = {
    upcoming: (data ?? []).filter((b) => b.status === 'confirmed' && b.date >= today).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    past: (data ?? []).filter((b) => b.status === 'completed' || (b.status === 'confirmed' && b.date < today)),
    cancelled: (data ?? []).filter((b) => b.status === 'cancelled'),
  }
  const list = groups[tab]
  // Group by date for a calendar-like read.
  const byDate = list.reduce<Record<string, Booking[]>>((acc, b) => ((acc[b.date] ||= []).push(b), acc), {})

  return (
    <>
      <PageHeader
        title="Bookings"
        description="Calls booked through the site, in your booking timezone."
        actions={
          <ButtonLink to="/admin/bookings/settings" variant="secondary">
            <CalendarCog className="size-4" /> Booking settings
          </ButtonLink>
        }
      />
      <div className="mb-4">
        <Segmented<Tab>
          label="Booking view"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'upcoming', label: 'Upcoming', count: groups.upcoming.length },
            { value: 'past', label: 'Past', count: groups.past.length },
            { value: 'cancelled', label: 'Cancelled', count: groups.cancelled.length },
          ]}
        />
      </div>

      {isPending ? (
        <Spinner className="mx-auto mt-16 size-5" />
      ) : isError ? (
        <EmptyState title="Couldn’t load bookings" body="Check that the API server is running." />
      ) : list.length === 0 ? (
        <EmptyState title={tab === 'upcoming' ? 'No upcoming calls' : `No ${tab} bookings`} body={tab === 'upcoming' ? 'When someone books an intro call on the site, it shows up here.' : undefined} />
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(byDate).map(([date, items]) => (
            <section key={date}>
              <h2 className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                {formatDate(date + 'T12:00:00', { weekday: 'long', month: 'long', day: 'numeric' })}
                {date === today && <span className="ml-2 text-accent">· Today</span>}
              </h2>
              <Panel className="divide-y divide-white/[0.05]">
                {items.map((b) => (
                  <BookingRow key={b.id} booking={b} />
                ))}
              </Panel>
            </section>
          ))}
        </div>
      )}
    </>
  )
}

/** Pre-filled message: subject with the call's date & time, a greeting, and where it happens. */
function emailDraft(b: Booking) {
  const when = `${formatDate(b.date + 'T12:00:00', { weekday: 'short', month: 'short', day: 'numeric' })}, ${b.time}`
  const where = b.locationType === 'in_person' ? (b.address ? `Address: ${b.address}` : '') : b.meetingUrl ? `Join: ${b.meetingUrl}` : ''
  const first = b.name.split(' ')[0]
  return {
    to: b.email,
    subject: `Our call on ${when}`,
    body: [`Hi ${first},`, '', `Looking forward to our ${b.duration}-minute call on ${when}.`, ...(where ? ['', where] : []), '', '— Halftone'].join('\n'),
  }
}

function BookingRow({ booking: b }: { booking: Booking }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const inPerson = b.locationType === 'in_person'
  const current = inPerson ? b.address : b.meetingUrl
  const [link, setLink] = useState(current)
  const done = () => {
    queryClient.invalidateQueries({ queryKey: ['bookings'] })
    queryClient.invalidateQueries({ queryKey: ['stats'] })
    queryClient.invalidateQueries({ queryKey: ['availability'] })
  }
  const setStatus = useMutation({
    mutationFn: (status: BookingStatus) => api(`admin/bookings/${b.id}`, { method: 'PATCH', body: { status } }),
    onSuccess: (_d, status) => {
      done()
      toast(status === 'cancelled' ? 'Call cancelled — slot reopened' : status === 'completed' ? 'Marked as completed' : 'Booking restored')
    },
    onError: (e) => toast(e.message, 'error'),
  })
  const saveLink = useMutation({
    mutationFn: (value: string) => api(`admin/bookings/${b.id}`, { method: 'PATCH', body: inPerson ? { address: value } : { meetingUrl: value } }),
    onSuccess: () => {
      done()
      setEditing(false)
      toast(inPerson ? 'Address updated' : 'Meeting link updated')
    },
    onError: (e) => toast(e.message, 'error'),
  })
  const remove = useMutation({
    mutationFn: () => api(`admin/bookings/${b.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      done()
      toast('Booking deleted')
    },
    onError: (e) => toast(e.message, 'error'),
  })

  return (
    <div className="flex flex-col gap-3 p-4 md:px-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-5">
        <span className="w-14 shrink-0 font-mono text-lg tabular-nums text-fg">{b.time}</span>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 text-sm font-medium text-fg">
            {b.name} {b.company && <span className="font-normal text-muted">· {b.company}</span>}
          </p>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 font-mono text-[11px] text-muted">
            <span>{b.duration} min</span>
            <span aria-hidden>·</span>
            <CopyEmail email={b.email} />
            {b.phone && (
              <>
                <span aria-hidden>·</span>
                <a href={`tel:${b.phone}`} className="hover:text-fg">{b.phone}</a>
              </>
            )}
          </p>
          {b.note && <p className="mt-1 line-clamp-2 text-sm text-muted">{b.note}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-1">
          <StatusBadge status={b.status} />
          <EmailMenu name={b.name} draft={emailDraft(b)} />
          {b.status === 'confirmed' && (
            <>
              <button type="button" onClick={() => setStatus.mutate('completed')} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-muted hover:bg-white/[0.06] hover:text-fg">
                <Check className="size-3.5" /> Done
              </button>
              <ConfirmButton onConfirm={() => setStatus.mutate('cancelled')} disabled={setStatus.isPending}>
                <X className="size-3.5" /> Cancel
              </ConfirmButton>
            </>
          )}
          {b.status === 'cancelled' && (
            <button type="button" onClick={() => setStatus.mutate('confirmed')} disabled={setStatus.isPending} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] text-muted hover:bg-white/[0.06] hover:text-fg">
              <RotateCcw className="size-3.5" /> Restore
            </button>
          )}
          {b.status !== 'confirmed' && (
            <ConfirmButton onConfirm={() => remove.mutate()} className="px-2">
              <Trash2 className="size-3.5" />
              <span className="sr-only">Delete</span>
            </ConfirmButton>
          )}
        </div>
      </div>

      {/* Where the meeting happens */}
      {b.status !== 'cancelled' && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-white/[0.05] bg-base/40 px-3 py-2 md:ml-[4.75rem]">
          {editing ? (
            <form
              className="flex min-w-0 flex-1 items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                saveLink.mutate(link.trim())
              }}
            >
              {inPerson ? <MapPin className="size-3.5 shrink-0 text-muted" /> : <Video className="size-3.5 shrink-0 text-muted" />}
              <input
                autoFocus
                type={inPerson ? 'text' : 'url'}
                value={link}
                onChange={(e) => setLink(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
                placeholder={inPerson ? 'Street, city' : 'https://meet.google.com/… or any https link'}
                aria-label={inPerson ? 'Address' : 'Meeting link'}
                className="h-8 min-w-0 flex-1 rounded-md border border-white/10 bg-field px-2.5 font-mono text-[12px] text-fg focus:border-accent/60 focus:outline-none"
              />
              <button type="submit" disabled={saveLink.isPending} className="h-8 rounded-md bg-accent px-3 text-[12px] font-medium text-accent-ink">
                Save
              </button>
              <button type="button" onClick={() => setEditing(false)} className="h-8 rounded-md px-2 text-[12px] text-muted hover:text-fg">
                Cancel
              </button>
            </form>
          ) : (
            <>
              {inPerson ? (
                b.address ? (
                  <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-w-0 items-center gap-2 text-[13px] text-fg hover:text-accent">
                    <MapPin className="size-3.5 shrink-0 text-accent" />
                    <span className="shrink-0">In person</span>
                    <span className="truncate text-[12px] text-muted">{b.address}</span>
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-2 text-[13px] text-amber-200">
                    <MapPin className="size-3.5" /> No address
                  </span>
                )
              ) : b.meetingUrl ? (
                <a href={b.meetingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-w-0 items-center gap-2 text-[13px] text-fg hover:text-accent">
                  <Video className="size-3.5 shrink-0 text-accent" />
                  <span className="shrink-0">Meeting link</span>
                  <span className="truncate font-mono text-[11px] text-muted">{b.meetingUrl.replace(/^https:\/\//, '')}</span>
                </a>
              ) : (
                <span className="inline-flex items-center gap-2 text-[13px] text-amber-200">
                  <Video className="size-3.5" /> No meeting link yet
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setLink(current)
                  setEditing(true)
                }}
                className="inline-flex items-center gap-1 text-[12px] text-muted hover:text-fg"
              >
                <Pencil className="size-3" /> {current ? 'Change' : inPerson ? 'Add address' : 'Add link'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
