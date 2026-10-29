import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CalendarOff, CheckCircle2, ExternalLink, Link2, MapPin, Plus, Video, X } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  DURATION_OPTIONS, WEEKDAYS, type BookingSettings as Settings, type DateOverride, type DayAvailability, type LocationType, type QuestionMode, type TimeRange,
} from '../../../shared/booking'
import { addDays, dateInTz } from '../../../shared/tz'
import { Button, ButtonLink } from '../../components/ui/Button'
import { Field, Input, Select, Textarea } from '../../components/ui/Field'
import { api } from '../../lib/api'
import { cn } from '../../lib/cn'
import { formatDate } from '../../lib/format'
import { useToast } from '../components/Toast'
import { EmptyState, PageHeader, Panel, Spinner, Switch } from '../components/ui'

type Summary = {
  settings: Settings
  timezoneLabel: string
  preview: { days: number; openSlots: number; next: DayAvailability | null }
}

/** Monday-first display order; values are Date#getDay() indexes. */
const ORDER = [1, 2, 3, 4, 5, 6, 0]
const BUFFERS = [0, 5, 10, 15, 30, 45, 60]
const NOTICE = [
  [0, 'None'], [1, '1 hour'], [2, '2 hours'], [4, '4 hours'], [12, '12 hours'], [24, '24 hours'], [48, '2 days'], [72, '3 days'], [168, '1 week'],
] as const
const INTERVALS = [
  [null, 'Length of the meeting'], [15, 'Every 15 min'], [30, 'Every 30 min'], [60, 'Every hour'],
] as const
const fmtDuration = (m: number) => (m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m / 60} hour${m > 60 ? 's' : ''}`)
const nineToFive = (): TimeRange[] => [{ start: '09:00', end: '17:00' }]

export function BookingSettings() {
  const { data, isPending, isError } = useQuery({
    queryKey: ['booking-settings'],
    queryFn: () => api<Summary>('admin/booking-settings'),
  })
  if (isPending) return <Spinner className="mx-auto mt-24 size-5" />
  if (isError) return <EmptyState title="Couldn’t load booking settings" body="Check that the API server is running." />
  return <Editor key={JSON.stringify(data.settings)} summary={data} />
}

function Editor({ summary }: { summary: Summary }) {
  const initial = summary.settings
  const [s, setS] = useState<Settings>(initial)
  const set = (patch: Partial<Settings>) => setS((p) => ({ ...p, ...patch }))
  const dirty = JSON.stringify(s) !== JSON.stringify(initial)
  const queryClient = useQueryClient()
  const toast = useToast()

  const save = useMutation({
    mutationFn: () => api<Summary>('admin/booking-settings', { method: 'PUT', body: s }),
    onSuccess: (next) => {
      queryClient.setQueryData(['booking-settings'], next)
      queryClient.invalidateQueries({ queryKey: ['availability'] })
      toast('Booking settings saved — live on the site')
    },
    onError: (e) => toast(e.message, 'error'),
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        save.mutate()
      }}
      className="mx-auto max-w-4xl"
    >
      <Link to="/admin/bookings" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft className="size-3.5" /> Bookings
      </Link>
      <PageHeader
        title={s.name || 'Booking settings'}
        description="People pick a time that’s free in your schedule."
        actions={
          <>
            <ButtonLink to="/?book=1" variant="secondary" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" /> Open page
            </ButtonLink>
            {dirty && (
              <Button type="button" variant="ghost" onClick={() => setS(initial)}>
                Discard
              </Button>
            )}
            <Button type="submit" disabled={!dirty || save.isPending}>
              {save.isPending ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      />

      <p className="-mt-4 mb-6 flex flex-wrap items-center gap-x-2 text-sm text-muted">
        <span className={cn('size-1.5 rounded-full', summary.preview.openSlots ? 'bg-ok' : 'bg-alert')} />
        {summary.settings.acceptingBookings
          ? summary.preview.next
            ? <>On the site now: <span className="text-fg">{summary.preview.openSlots} open slots</span> across {summary.preview.days} days · next {formatDate(summary.preview.next.date + 'T12:00:00', { weekday: 'short', month: 'short', day: 'numeric' })} at <span className="font-mono text-fg">{summary.preview.next.slots.find((x) => x.available)?.time}</span></>
            : 'Nothing is bookable with the saved settings.'
          : 'Bookings are paused.'}
        {dirty && <span className="text-accent">· unsaved changes</span>}
      </p>

      <div className="flex flex-col gap-5">
        {/* ── Basics ─────────────────────────────── */}
        <Section title="Basics">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Meeting name">
              <Input value={s.name} onChange={(e) => set({ name: e.target.value })} required maxLength={80} />
            </Field>
            <div className="flex items-center justify-between gap-4 rounded-lg border border-white/[0.06] bg-base/40 px-4 py-2.5 sm:self-end">
              <div>
                <p className="text-sm text-fg">Accepting bookings</p>
                <p className="text-xs text-muted">{s.acceptingBookings ? 'Open on the site' : 'Paused — the site shows no times'}</p>
              </div>
              <Switch checked={s.acceptingBookings} onChange={(v) => set({ acceptingBookings: v })} label="Accepting bookings" />
            </div>
          </div>
          <Field label="Description" hint="shown on the booking page">
            <Textarea value={s.description} onChange={(e) => set({ description: e.target.value })} maxLength={1000} className="min-h-24" />
          </Field>
          <div>
            <p className="mb-2 text-[13px] font-medium text-fg/90">Durations</p>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((d) => {
                const on = s.durations.includes(d)
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      const next = on ? s.durations.filter((x) => x !== d) : [...s.durations, d].sort((a, b) => a - b)
                      if (next.length) set({ durations: next })
                    }}
                    className={cn(
                      'h-9 rounded-full border px-4 text-sm transition-all duration-200 ease-expo',
                      on ? 'border-accent/60 bg-accent/10 text-fg' : 'border-white/[0.08] bg-white/[0.02] text-muted hover:border-white/15 hover:text-fg',
                    )}
                  >
                    {fmtDuration(d)}
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-muted">Pick one or several; guests choose when there are several.</p>
          </div>
        </Section>

        {/* ── Availability ───────────────────────── */}
        <Section title="Availability" description="Weekly hours in the timezone below.">
          <Field label="Timezone" className="sm:max-w-sm">
            <TimezoneSelect value={s.timezone} onChange={(timezone) => set({ timezone })} />
          </Field>

          <ul className="divide-y divide-white/[0.05] rounded-xl border border-white/[0.06] bg-base/30">
            {ORDER.map((day) => (
              <li key={day} className="grid gap-3 px-4 py-4 sm:grid-cols-[10rem_1fr] sm:items-start">
                <div className="flex items-center gap-3 sm:pt-1.5">
                  <Switch
                    checked={s.weekly[day].length > 0}
                    onChange={(v) => set({ weekly: s.weekly.map((r, i) => (i === day ? (v ? nineToFive() : []) : r)) })}
                    label={`${WEEKDAYS[day]} available`}
                  />
                  <span className={cn('text-sm font-medium', s.weekly[day].length ? 'text-fg' : 'text-muted')}>{WEEKDAYS[day]}</span>
                </div>
                {s.weekly[day].length ? (
                  <Ranges value={s.weekly[day]} onChange={(ranges) => set({ weekly: s.weekly.map((r, i) => (i === day ? ranges : r)) })} label={WEEKDAYS[day]} />
                ) : (
                  <p className="text-sm text-muted sm:pt-2">Unavailable</p>
                )}
              </li>
            ))}
          </ul>

          <Overrides value={s.overrides} timezone={s.timezone} onChange={(overrides) => set({ overrides })} />
        </Section>

        {/* ── Limits ─────────────────────────────── */}
        <Section title="Limits">
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label="Buffer before">
              <Select value={s.bufferBefore} onChange={(e) => set({ bufferBefore: Number(e.target.value) })}>
                {BUFFERS.map((b) => <option key={b} value={b}>{b ? `${b} min` : 'None'}</option>)}
              </Select>
            </Field>
            <Field label="Buffer after">
              <Select value={s.bufferAfter} onChange={(e) => set({ bufferAfter: Number(e.target.value) })}>
                {BUFFERS.map((b) => <option key={b} value={b}>{b ? `${b} min` : 'None'}</option>)}
              </Select>
            </Field>
            <Field label="Minimum notice">
              <Select value={s.minNoticeHours} onChange={(e) => set({ minNoticeHours: Number(e.target.value) })}>
                {NOTICE.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </Field>
            <Field label="Book up to" hint="days ahead">
              <Input type="number" min={1} max={365} value={s.windowDays} onChange={(e) => set({ windowDays: Math.max(1, Math.min(365, Number(e.target.value) || 1)) })} />
            </Field>
            <Field label="Max bookings per day" hint="empty = no limit">
              <Input
                type="number"
                min={1}
                max={100}
                value={s.maxPerDay ?? ''}
                onChange={(e) => set({ maxPerDay: e.target.value ? Math.max(1, Math.min(100, Number(e.target.value))) : null })}
                placeholder="No limit"
              />
            </Field>
            <Field label="Start times every">
              <Select value={s.slotInterval ?? ''} onChange={(e) => set({ slotInterval: e.target.value ? Number(e.target.value) : null })}>
                {INTERVALS.map(([v, l]) => <option key={l} value={v ?? ''}>{l}</option>)}
              </Select>
            </Field>
          </div>
        </Section>

        {/* ── Location ───────────────────────────── */}
        <Section title="Location">
          <LocationPicker value={s.location} onChange={(location) => set({ location })} />
        </Section>

        {/* ── Questions ──────────────────────────── */}
        <Section title="Questions" description="Name and email are always asked.">
          <ul className="divide-y divide-white/[0.05]">
            {(
              [
                ['phone', 'Phone number'],
                ['company', 'Company'],
                ['notes', 'Notes (“Anything we should know?”)'],
              ] as const
            ).map(([key, label]) => (
              <li key={key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                <span className="text-sm text-fg">{label}</span>
                <div className="w-40 shrink-0">
                  <Select
                    value={s.questions[key]}
                    onChange={(e) => set({ questions: { ...s.questions, [key]: e.target.value as QuestionMode } })}
                    aria-label={`${label} setting`}
                  >
                    <option value="hidden">Hidden</option>
                    <option value="optional">Optional</option>
                    <option value="required">Required</option>
                  </Select>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </form>
  )
}

/* ── Building blocks ─────────────────────────────────────── */

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Panel>
      <div className="border-b border-white/[0.06] px-5 py-4 md:px-6">
        <h2 className="font-medium text-fg">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
      </div>
      <div className="flex flex-col gap-5 p-5 md:p-6">{children}</div>
    </Panel>
  )
}

const timeInput =
  'h-9 w-[7.5rem] rounded-lg border border-white/10 bg-field px-2.5 font-mono text-[13px] tabular-nums text-fg [color-scheme:dark] focus:border-accent/60 focus:outline-none focus:ring-4 focus:ring-accent/10'

/** Time ranges for one day: "09:00 – 17:00 ×", plus "Add hours". */
function Ranges({ value, onChange, label }: { value: TimeRange[]; onChange: (r: TimeRange[]) => void; label: string }) {
  const update = (i: number, patch: Partial<TimeRange>) => onChange(value.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  const addHours = () => {
    const last = value[value.length - 1]
    const [h] = (last?.end ?? '17:00').split(':').map(Number)
    const start = `${String(Math.min(h + 1, 22)).padStart(2, '0')}:00`
    const end = `${String(Math.min(h + 2, 23)).padStart(2, '0')}:00`
    onChange([...value, { start, end }])
  }
  return (
    <div className="flex flex-col items-start gap-2">
      {value.map((r, i) => {
        const bad = r.end <= r.start
        return (
          <div key={i} className="flex items-center gap-2">
            <input type="time" step={900} value={r.start} onChange={(e) => update(i, { start: e.target.value })} aria-label={`${label} start ${i + 1}`} className={timeInput} />
            <span className="text-muted">–</span>
            <input
              type="time"
              step={900}
              value={r.end}
              onChange={(e) => update(i, { end: e.target.value })}
              aria-label={`${label} end ${i + 1}`}
              aria-invalid={bad}
              className={cn(timeInput, bad && 'border-alert/60')}
            />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              aria-label={`Remove ${label} hours ${r.start}–${r.end}`}
              className="inline-flex size-8 items-center justify-center rounded-lg text-muted hover:bg-white/[0.06] hover:text-fg"
            >
              <X className="size-4" />
            </button>
          </div>
        )
      })}
      <button type="button" onClick={addHours} className="inline-flex items-center gap-1 text-[13px] text-accent hover:text-accent-bright">
        <Plus className="size-3.5" /> Add hours
      </button>
    </div>
  )
}

function Overrides({ value, timezone, onChange }: { value: DateOverride[]; timezone: string; onChange: (o: DateOverride[]) => void }) {
  const today = dateInTz(new Date(), timezone)
  const update = (i: number, patch: Partial<DateOverride>) => onChange(value.map((o, j) => (j === i ? { ...o, ...patch } : o)))
  const add = () => {
    let date = addDays(today, 1)
    while (value.some((o) => o.date === date)) date = addDays(date, 1)
    onChange([...value, { date, unavailable: true, ranges: nineToFive() }])
  }
  const upcoming = value.map((o, i) => ({ o, i })).filter(({ o }) => o.date >= today)

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-fg">Date overrides</p>
          <p className="text-xs text-muted">Days off, holidays, or different hours on a specific date.</p>
        </div>
        <Button type="button" variant="secondary" size="sm" onClick={add}>
          <Plus className="size-3.5" /> Add date
        </Button>
      </div>
      {upcoming.length > 0 && (
        <ul className="mt-3 flex flex-col gap-2">
          {upcoming.map(({ o, i }) => (
            <li key={i} className="flex flex-wrap items-start gap-3 rounded-xl border border-white/[0.06] bg-base/30 p-3">
              <input
                type="date"
                min={today}
                value={o.date}
                onChange={(e) => e.target.value && update(i, { date: e.target.value })}
                aria-label="Override date"
                className={cn(timeInput, 'w-44 px-3')}
              />
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <label className="inline-flex h-9 items-center gap-2 text-sm text-fg">
                  <input
                    type="checkbox"
                    checked={o.unavailable}
                    onChange={(e) => update(i, { unavailable: e.target.checked, ranges: o.ranges.length ? o.ranges : nineToFive() })}
                    className="size-4 accent-[var(--color-accent)]"
                  />
                  <CalendarOff className="size-4 text-muted" /> Unavailable all day
                </label>
                {!o.unavailable && <Ranges value={o.ranges} onChange={(ranges) => update(i, { ranges })} label={o.date} />}
              </div>
              <button
                type="button"
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                aria-label={`Remove override for ${o.date}`}
                className="inline-flex size-8 items-center justify-center rounded-lg text-muted hover:bg-white/[0.06] hover:text-fg"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const LOCATIONS: { type: LocationType; label: string; icon: typeof Video }[] = [
  { type: 'later', label: 'We send the link', icon: Video },
  { type: 'in_person', label: 'In person', icon: MapPin },
  { type: 'custom', label: 'Custom link', icon: Link2 },
]

function LocationPicker({ value, onChange }: { value: Settings['location']; onChange: (l: Settings['location']) => void }) {
  return (
    <>
      <div role="radiogroup" aria-label="Meeting location" className="grid gap-2 sm:grid-cols-3">
        {LOCATIONS.map(({ type, label, icon: Icon }) => (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={value.type === type}
            onClick={() => onChange({ ...value, type })}
            className={cn(
              'inline-flex h-11 items-center justify-center gap-2 rounded-xl border text-sm transition-all duration-200 ease-expo',
              value.type === type ? 'border-accent/60 bg-accent/[0.08] text-fg' : 'border-white/[0.08] bg-white/[0.02] text-muted hover:border-white/15 hover:text-fg',
            )}
          >
            <Icon className={cn('size-4', value.type === type && 'text-accent')} /> {label}
          </button>
        ))}
      </div>

      {value.type === 'later' && (
        <p className="rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-sm text-muted">
          Guests are told you’ll send the link. Add it to each call in Bookings. For one fixed room, such as your Google Meet room link, pick Custom link.
        </p>
      )}

      {value.type === 'in_person' && (
        <Field label="Address">
          <Input value={value.address} onChange={(e) => onChange({ ...value, address: e.target.value })} placeholder="Rua da Prata 80, 1100-420 Lisboa" maxLength={300} />
        </Field>
      )}

      {value.type === 'custom' && (
        <Field label="Meeting link" hint="Google Meet room, Zoom, Whereby, Teams…">
          <Input type="url" value={value.customUrl} onChange={(e) => onChange({ ...value, customUrl: e.target.value.trim() })} placeholder="https://meet.google.com/abc-defg-hij" className="font-mono text-[13px]" />
        </Field>
      )}
    </>
  )
}

function TimezoneSelect({ value, onChange }: { value: string; onChange: (tz: string) => void }) {
  const zones = useMemo(() => {
    const list = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf?.('timeZone') ?? []
    const all = list.includes(value) ? list : [value, ...list]
    const now = new Date()
    return all.map((tz) => ({ tz, time: now.toLocaleTimeString('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }) }))
  }, [value])
  return (
    <Select value={value} onChange={(e) => onChange(e.target.value)}>
      {zones.map(({ tz, time }) => (
        <option key={tz} value={tz}>
          {tz.replace(/_/g, ' ')} ({time})
        </option>
      ))}
    </Select>
  )
}
