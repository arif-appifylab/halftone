import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, CalendarPlus, Check, Clock, Globe, Loader2, MapPin, Video, X } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { DayAvailability, LocationType, QuestionMode } from '../../../shared/booking'
import type { BookingConfirmation, PublicBookingPage } from '../../../shared/types'
import { team } from '../../data/team'
import { api, ApiError } from '../../lib/api'
import { cn } from '../../lib/cn'
import { EASE } from '../../lib/motion'
import { Button } from '../ui/Button'
import { Field, Input, Textarea } from '../ui/Field'
import { Photo } from '../ui/Photo'

// Dates are YYYY-MM-DD in the host's timezone; parse at noon so no timezone shifts the day.
const asDate = (iso: string) => new Date(`${iso}T12:00:00`)
const formatDuration = (m: number) => (m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m / 60} hour${m > 60 ? 's' : ''}`)
const LocationIcon = ({ type, className }: { type: LocationType; className?: string }) =>
  type === 'in_person' ? <MapPin className={className} /> : <Video className={className} />

type Step = 'pick' | 'details' | 'done'

export function BookingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [duration, setDuration] = useState<number | null>(null)
  const [day, setDay] = useState(0)
  const [slot, setSlot] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('pick')
  const [name, setName] = useState('')
  const queryClient = useQueryClient()

  const page = useQuery({
    queryKey: ['availability', duration],
    queryFn: () => api<PublicBookingPage>(`bookings/availability${duration ? `?duration=${duration}` : ''}`),
    enabled: open,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: true,
  })
  const info = page.data
  const days = info?.days ?? []
  const activeDuration = duration ?? info?.duration ?? 30

  const book = useMutation({
    mutationFn: (body: Record<string, string | number>) =>
      api<{ ok: true; confirmation: BookingConfirmation }>('bookings', {
        method: 'POST',
        body: { ...body, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      }),
    onSuccess: () => setStep('done'),
    onError: (err) => {
      // Slot got taken while they were typing — refresh and send them back to pick again.
      if (err instanceof ApiError && err.status === 409) {
        queryClient.invalidateQueries({ queryKey: ['availability'] })
        setSlot(null)
        setStep('pick')
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['availability'] }),
  })
  const dialogRef = useRef<HTMLDivElement>(null)
  const lastFocus = useRef<HTMLElement | null>(null)

  // Focus management, Esc to close, scroll lock.
  useEffect(() => {
    if (!open) return
    lastFocus.current = document.activeElement as HTMLElement
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => dialogRef.current?.querySelector<HTMLElement>('button, input')?.focus(), 50)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && dialogRef.current) {
        const els = dialogRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), input, textarea, a[href]')
        const first = els[0]
        const last = els[els.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(t)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      lastFocus.current?.focus()
    }
  }, [open, onClose])

  // Reset once closed.
  useEffect(() => {
    if (open) return
    const t = setTimeout(() => {
      setStep('pick')
      setSlot(null)
      setDay(0)
      setDuration(null)
      book.reset()
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const selectedDay = days[Math.min(day, Math.max(0, days.length - 1))] as DayAvailability | undefined
  const dateLabel = selectedDay ? asDate(selectedDay.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : ''

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>
    setName(String(data.name || '').split(' ')[0])
    book.mutate({ ...data, date: selectedDay!.date, time: slot!, duration: activeDuration })
  }

  const confirmation = book.data?.confirmation

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
        >
          <div className="absolute inset-0 bg-deep/80 backdrop-blur-md" onClick={onClose} aria-hidden />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-title"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="relative grid max-h-[92dvh] w-full max-w-4xl overflow-hidden rounded-t-2xl border border-white/[0.08] bg-elevated shadow-window sm:rounded-2xl md:grid-cols-[17rem_1fr]"
          >
            <span aria-hidden className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
            <button
              type="button"
              onClick={onClose}
              aria-label="Close booking"
              className="absolute right-3 top-3 z-10 inline-flex size-9 items-center justify-center rounded-lg text-muted transition-colors duration-200 hover:bg-white/[0.06] hover:text-fg"
            >
              <X className="size-4" />
            </button>

            {/* Sidebar */}
            <aside className="relative hidden overflow-hidden border-r border-white/[0.06] bg-base/60 p-6 md:flex md:flex-col">
              <div aria-hidden className="bg-halftone absolute -bottom-10 -left-10 size-64 text-glow/40 [mask-image:radial-gradient(circle_at_30%_70%,#000,transparent_65%)]" />
              <div className="relative flex -space-x-2">
                {team.slice(0, 2).map((m) => (
                  <Photo key={m.name} src={m.photo} alt={m.name} sizes="40px" tone="natural" className="size-10 rounded-full border-2 border-elevated" />
                ))}
              </div>
              <p className="relative mt-4 text-sm text-muted">Ana & Jonah · Founding partners</p>
              <h2 id="booking-title" className="relative mt-1 text-xl font-semibold tracking-[-0.02em] text-fg">
                {info?.name ?? 'Intro call'}
              </h2>
              <ul className="relative mt-5 flex flex-col gap-3 text-sm text-muted">
                <li className="flex items-center gap-2.5">
                  <Clock className="size-4 shrink-0 text-accent" /> {formatDuration(activeDuration)}
                </li>
                {info && (
                  <li className="flex items-start gap-2.5">
                    <LocationIcon type={info.location.type} className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span>
                      {info.location.label}
                      {info.location.address && <span className="mt-0.5 block text-xs leading-relaxed">{info.location.address}</span>}
                    </span>
                  </li>
                )}
                {info && (
                  <li className="flex items-center gap-2.5">
                    <Globe className="size-4 shrink-0 text-accent" /> {info.timezoneLabel}
                  </li>
                )}
              </ul>
              {info?.description && <p className="relative mt-auto pt-8 text-xs leading-relaxed text-muted">{info.description}</p>}
            </aside>

            {/* Body */}
            <div className="min-h-0 overflow-y-auto p-5 sm:p-7">
              <AnimatePresence mode="wait" initial={false}>
                {step === 'pick' && (
                  <motion.div key="pick" {...panel}>
                    <h3 className="pr-10 text-lg font-semibold tracking-[-0.02em] text-fg md:hidden">{info?.name ?? 'Book a call'}</h3>

                    {info && info.durations.length > 1 && (
                      <>
                        <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-muted md:mt-0">Duration</p>
                        <div role="radiogroup" aria-label="Meeting length" className="mt-3 flex flex-wrap gap-2">
                          {info.durations.map((d) => (
                            <button
                              key={d}
                              type="button"
                              role="radio"
                              aria-checked={activeDuration === d}
                              onClick={() => {
                                setDuration(d)
                                setSlot(null)
                              }}
                              className={cn(
                                'h-9 rounded-lg border px-3.5 text-sm transition-all duration-200 ease-expo',
                                activeDuration === d ? 'border-accent/60 bg-accent/10 text-fg' : 'border-white/[0.08] bg-white/[0.02] text-muted hover:border-white/15 hover:text-fg',
                              )}
                            >
                              {formatDuration(d)}
                            </button>
                          ))}
                        </div>
                      </>
                    )}

                    <p className={cn('font-mono text-[11px] uppercase tracking-[0.16em] text-muted', info && info.durations.length > 1 ? 'mt-7' : 'mt-4 md:mt-0')}>Select a date</p>
                    {page.isPending && (
                      <div className="mt-3 flex gap-2" aria-busy="true" aria-label="Loading availability">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <span key={i} className="h-[84px] w-16 shrink-0 animate-pulse rounded-xl bg-white/[0.04]" />
                        ))}
                      </div>
                    )}
                    {page.isSuccess && days.length === 0 && (
                      <div className="mt-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-5 text-sm text-muted">
                        {info?.acceptingBookings === false ? 'We’re not taking new calls right now.' : 'No times are open right now.'} Email{' '}
                        <a href="mailto:hello@halftone.studio" className="text-fg underline underline-offset-2">hello@halftone.studio</a> and we’ll find a slot.
                      </div>
                    )}
                    <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5 pb-1 sm:-mx-7 sm:px-7">
                      {days.map((dayInfo, i) => {
                        const d = asDate(dayInfo.date)
                        const isSelected = selectedDay?.date === dayInfo.date
                        return (
                          <button
                            key={dayInfo.date}
                            type="button"
                            onClick={() => {
                              setDay(i)
                              setSlot(null)
                            }}
                            aria-pressed={isSelected}
                            className={cn(
                              'flex w-16 shrink-0 flex-col items-center gap-1 rounded-xl border py-3 transition-all duration-200 ease-expo',
                              isSelected
                                ? 'border-accent/60 bg-accent/10 text-fg shadow-[0_0_24px_rgb(200_245_60/0.12)]'
                                : 'border-white/[0.07] bg-white/[0.02] text-muted hover:border-white/15 hover:text-fg',
                            )}
                          >
                            <span className="font-mono text-[10px] uppercase tracking-wider">{d.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                            <span className="text-lg font-semibold tabular-nums">{d.getDate()}</span>
                            <span className="text-[10px]">{d.toLocaleDateString('en-US', { month: 'short' })}</span>
                          </button>
                        )
                      })}
                    </div>

                    {selectedDay && (
                      <p className="mt-7 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                        {dateLabel}
                        {page.isFetching && <Loader2 className="size-3 animate-spin" aria-label="Checking availability" />}
                      </p>
                    )}
                    {book.error instanceof ApiError && book.error.status === 409 && (
                      <p role="alert" className="mt-3 rounded-lg border border-alert/30 bg-alert/10 px-3 py-2 text-sm text-alert">{book.error.message}</p>
                    )}
                    {page.isError && <p role="alert" className="mt-3 text-sm text-alert">Couldn’t load availability. Check your connection and try again.</p>}
                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {selectedDay?.slots.map(({ time: s, available }) => (
                        <button
                          key={s}
                          type="button"
                          disabled={!available}
                          onClick={() => setSlot(s)}
                          aria-pressed={slot === s}
                          aria-label={available ? s : `${s}, unavailable`}
                          className={cn(
                            'h-11 rounded-lg border font-mono text-sm tabular-nums transition-all duration-200 ease-expo',
                            !available && 'cursor-not-allowed border-white/[0.04] text-muted/40 line-through',
                            available && slot === s && 'border-accent bg-accent text-accent-ink shadow-accent',
                            available && slot !== s && 'border-white/[0.08] bg-white/[0.02] text-fg hover:border-accent/50 hover:bg-accent/[0.06]',
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>

                    <div className="mt-8 flex items-center justify-between gap-4 border-t border-white/[0.06] pt-5">
                      <p className="text-sm text-muted">
                        {slot ? (
                          <>
                            Selected <span className="text-fg">{slot}</span> · {formatDuration(activeDuration)}
                          </>
                        ) : (
                          'Pick a time to continue'
                        )}
                      </p>
                      <Button disabled={!slot} onClick={() => setStep('details')}>
                        Continue
                      </Button>
                    </div>
                  </motion.div>
                )}

                {step === 'details' && info && (
                  <motion.form key="details" {...panel} onSubmit={submit} className="flex flex-col gap-4">
                    <button
                      type="button"
                      onClick={() => setStep('pick')}
                      className="inline-flex w-fit items-center gap-1.5 text-sm text-muted transition-colors duration-200 hover:text-fg"
                    >
                      <ArrowLeft className="size-3.5" /> {dateLabel} · {slot} · {formatDuration(activeDuration)}
                    </button>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Your name">
                        <Input name="name" required autoComplete="name" placeholder="Ada Lovelace" />
                      </Field>
                      <Field label="Email">
                        <Input name="email" type="email" required autoComplete="email" placeholder="ada@company.com" />
                      </Field>
                      <Question mode={info.questions.phone} label="Phone number">
                        <Input name="phone" type="tel" required={info.questions.phone === 'required'} autoComplete="tel" placeholder="+351 912 345 678" />
                      </Question>
                      <Question mode={info.questions.company} label="Company">
                        <Input name="company" required={info.questions.company === 'required'} autoComplete="organization" placeholder="Analytical Engines Inc." />
                      </Question>
                    </div>
                    <Question mode={info.questions.notes} label="Anything we should know?">
                      <Textarea name="note" required={info.questions.notes === 'required'} placeholder="What are you working on? A sentence or two is plenty." />
                    </Question>
                    {book.isError && !(book.error instanceof ApiError && book.error.status === 409) && (
                      <p role="alert" className="text-sm text-alert">{book.error.message}</p>
                    )}
                    <div className="flex justify-end border-t border-white/[0.06] pt-5">
                      <Button type="submit" disabled={book.isPending}>
                        {book.isPending && <Loader2 className="size-4 animate-spin" />} Confirm booking
                      </Button>
                    </div>
                  </motion.form>
                )}

                {step === 'done' && confirmation && (
                  <motion.div key="done" {...panel} className="flex min-h-80 flex-col items-center justify-center text-center">
                    <span className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-ink shadow-accent">
                      <Check className="size-6" strokeWidth={2.5} />
                    </span>
                    <h3 className="mt-6 text-2xl font-semibold tracking-[-0.02em] text-fg">You’re booked{name && `, ${name}`}.</h3>
                    <p className="mt-2 max-w-sm text-muted">
                      {dateLabel} at {confirmation.time} ({confirmation.timezoneLabel}) · {formatDuration(confirmation.duration)}
                    </p>
                    <div className="mt-6 flex w-full max-w-sm flex-col gap-2">
                      <Where c={confirmation} />
                      <a
                        href={confirmation.calendarUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm text-muted transition-colors hover:bg-white/[0.04] hover:text-fg"
                      >
                        <CalendarPlus className="size-4" /> Add to Google Calendar
                      </a>
                    </div>
                    <Button variant="secondary" className="mt-4" onClick={onClose}>
                      Done
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** A form field that respects the admin's hidden / optional / required setting. */
function Question({ mode, label, children }: { mode: QuestionMode; label: string; children: ReactNode }) {
  if (mode === 'hidden') return null
  return (
    <Field label={label} hint={mode === 'optional' ? 'optional' : undefined}>
      {children}
    </Field>
  )
}

/** The meeting location on the confirmation screen. */
function Where({ c }: { c: BookingConfirmation }) {
  const card = 'flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-left'
  if (c.locationType === 'in_person') {
    return (
      <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.address)}`} target="_blank" rel="noopener noreferrer" className={cn(card, 'transition-colors hover:border-accent/40')}>
        <MapPin className="size-4 shrink-0 text-accent" />
        <span className="min-w-0 flex-1">
          <span className="block text-sm text-fg">In person</span>
          <span className="block text-xs text-muted">{c.address}</span>
        </span>
      </a>
    )
  }
  if (!c.meetingUrl) {
    return (
      <p className={cn(card, 'text-sm text-muted')}>
        <Video className="size-4 shrink-0 text-accent" />
        We’ll send the meeting link before the call.
      </p>
    )
  }
  return (
    <a href={c.meetingUrl} target="_blank" rel="noopener noreferrer" className={cn(card, 'transition-colors hover:border-accent/40')}>
      <Video className="size-4 shrink-0 text-accent" />
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-fg">Join the call</span>
        <span className="block truncate font-mono text-[11px] text-muted">{c.meetingUrl.replace(/^https:\/\//, '')}</span>
      </span>
    </a>
  )
}

const panel = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -12 },
  transition: { duration: 0.25, ease: EASE },
}
