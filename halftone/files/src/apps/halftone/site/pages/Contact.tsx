import { useMutation } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, Loader2, Mail, MapPin } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useBooking } from '../components/booking/BookingContext'
import { PageHero } from '../components/layout/PageHero'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Field, Input, Select, Textarea } from '../components/ui/Field'
import { Reveal } from '../components/ui/Reveal'
import { Accent } from '../components/ui/SectionHeader'
import { addOns, commitments, usd } from '../data/pricing'
import { capabilities } from '../data/services'
import { site } from '../data/site'
import { api } from '../lib/api'
import { cn } from '../lib/cn'
import { EASE } from '../lib/motion'
import { useAvailability } from '../lib/queries'
import { useDocumentTitle } from '../lib/useDocumentTitle'

const budgets = ['Under $25k', '$25k – $50k', '$50k – $100k', '$100k – $250k', '$250k+']
type Errors = Partial<Record<'name' | 'email' | 'message' | 'services', string>>

export function Contact() {
  useDocumentTitle('Contact')
  const booking = useBooking()
  const [params] = useSearchParams()
  const [selected, setSelected] = useState<string[]>([])
  const [errors, setErrors] = useState<Errors>({})
  const [sent, setSent] = useState<string | null>(null)
  const availability = useAvailability()
  const send = useMutation({
    mutationFn: (body: unknown) => api('inquiries', { method: 'POST', body }),
  })

  // Estimate handed over from the pricing calculator, if any.
  const prefill = useMemo(() => {
    const plan = params.get('plan')
    if (!plan) return null
    const est = Number(params.get('estimate'))
    const extras = (params.get('addons') || '').split(',').filter(Boolean)
    const commitment = commitments.find((c) => c.id === params.get('commitment'))
    return {
      plan,
      estimate: est || null,
      estimateLabel: est ? usd(est) : null,
      seats: params.get('seats'),
      extras: addOns.filter((a) => extras.includes(a.id)).map((a) => a.label),
      commitment: commitment?.label ?? null,
    }
  }, [params])

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    if (data.get('website')) return // honeypot: bots fill hidden fields
    const name = String(data.get('name') || '').trim()
    const email = String(data.get('email') || '').trim()
    const message = String(data.get('message') || '').trim()
    const next: Errors = {}
    if (name.length < 2) next.name = 'Tell us who you are.'
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'That email doesn’t look right.'
    if (message.length < 20) next.message = 'A couple of sentences helps us prepare (20+ characters).'
    if (selected.length === 0) next.services = 'Pick at least one.'
    setErrors(next)
    if (Object.keys(next).length > 0) return
    send.mutate(
      {
        name,
        email,
        message,
        company: String(data.get('company') || ''),
        budget: String(data.get('budget') || ''),
        services: selected,
        estimate: prefill
          ? { plan: prefill.plan, seats: prefill.seats, commitment: prefill.commitment, estimate: prefill.estimate, extras: prefill.extras }
          : null,
      },
      { onSuccess: () => setSent(name.split(' ')[0]) },
    )
  }

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={<>Tell us what you’re <Accent>building.</Accent></>}
        lead="We read every brief ourselves and reply within one business day — with honest questions, or an honest “we’re not the right fit.”"
      />
      <section className="pb-16 md:pb-24">
        <div className="container-x grid gap-6 lg:grid-cols-[1fr_22rem]">
          <Reveal>
            <Card interactive={false} spotlight={false} className="p-5 md:p-8">
              <AnimatePresence mode="wait" initial={false}>
                {sent ? (
                  <motion.div key="sent" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className="flex min-h-96 flex-col items-center justify-center text-center">
                    <span className="flex size-14 items-center justify-center rounded-full bg-accent text-accent-ink shadow-accent">
                      <Check className="size-6" strokeWidth={2.5} />
                    </span>
                    <h2 className="mt-6 text-3xl font-semibold tracking-[-0.03em] text-fg">Thanks, {sent}.</h2>
                    <p className="mt-3 max-w-sm text-muted">Your brief is with Ana and Jonah. Expect a reply from a real person within one business day.</p>
                    <Button variant="secondary" className="mt-8" onClick={booking.open}>
                      Skip the wait — book a call
                    </Button>
                  </motion.div>
                ) : (
                  <motion.form key="form" exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }} onSubmit={submit} noValidate className="flex flex-col gap-6">
                    {prefill && (
                      <div className="flex flex-col gap-2 rounded-xl border border-accent/30 bg-accent/[0.06] p-4">
                        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">Estimate attached</p>
                        <p className="text-sm text-fg">
                          {prefill.plan}
                          {prefill.seats && ` · ${prefill.seats} seat${prefill.seats === '1' ? '' : 's'}`}
                          {prefill.commitment && ` · ${prefill.commitment}`}
                          {prefill.estimateLabel && <> · <span className="font-semibold">{prefill.estimateLabel}</span></>}
                        </p>
                        {prefill.extras.length > 0 && <p className="text-xs text-muted">Add-ons: {prefill.extras.join(', ')}</p>}
                      </div>
                    )}

                    <div className="grid gap-5 sm:grid-cols-2">
                      <Field label="Name">
                        <Input name="name" autoComplete="name" placeholder="Ada Lovelace" aria-invalid={!!errors.name} aria-describedby="err-name" />
                        <Error id="err-name" msg={errors.name} />
                      </Field>
                      <Field label="Work email">
                        <Input name="email" type="email" autoComplete="email" placeholder="ada@company.com" aria-invalid={!!errors.email} aria-describedby="err-email" />
                        <Error id="err-email" msg={errors.email} />
                      </Field>
                      <Field label="Company" hint="optional">
                        <Input name="company" autoComplete="organization" placeholder="Analytical Engines Inc." />
                      </Field>
                      <Field label="Budget">
                        <Select name="budget" defaultValue={prefill?.plan === 'Embedded' ? budgets[3] : budgets[1]}>
                          {budgets.map((b) => (
                            <option key={b}>{b}</option>
                          ))}
                        </Select>
                      </Field>
                    </div>

                    <fieldset aria-describedby="err-services">
                      <legend className="mb-2 text-[13px] font-medium text-fg/90">What do you need?</legend>
                      <div className="flex flex-wrap gap-2">
                        {capabilities.map((c) => {
                          const on = selected.includes(c.id)
                          return (
                            <button
                              key={c.id}
                              type="button"
                              aria-pressed={on}
                              onClick={() => toggle(c.id)}
                              className={cn(
                                'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm transition-all duration-200 ease-expo',
                                on ? 'border-accent bg-accent text-accent-ink' : 'border-white/10 bg-white/[0.02] text-muted hover:border-white/20 hover:text-fg',
                              )}
                            >
                              {on && <Check className="size-3.5" strokeWidth={3} />}
                              {c.name}
                            </button>
                          )
                        })}
                      </div>
                      <Error id="err-services" msg={errors.services} />
                    </fieldset>

                    <Field label="Tell us about the project">
                      <Textarea
                        name="message"
                        rows={6}
                        placeholder="What are you building, what’s the deadline, and what does success look like?"
                        aria-invalid={!!errors.message}
                        aria-describedby="err-message"
                      />
                      <Error id="err-message" msg={errors.message} />
                    </Field>

                    {/* Honeypot — invisible to people, irresistible to bots */}
                    <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
                      <label>
                        Website <input name="website" tabIndex={-1} autoComplete="off" />
                      </label>
                    </div>

                    <div className="flex flex-col-reverse items-start justify-between gap-4 border-t border-white/[0.06] pt-6 sm:flex-row sm:items-center">
                      <p className="text-xs text-muted" role={send.isError ? 'alert' : undefined}>
                        {send.isError ? <span className="text-alert">{send.error.message}</span> : 'We’ll never add you to a mailing list.'}
                      </p>
                      <Button type="submit" size="lg" disabled={send.isPending}>
                        {send.isPending ? <Loader2 className="size-4 animate-spin" /> : null} Send brief {!send.isPending && <ArrowRight className="size-4" />}
                      </Button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </Card>
          </Reveal>

          <Reveal delay={0.1} className="flex flex-col gap-4">
            <Card className="p-6">
              <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">Prefer to talk?</p>
              <p className="mt-2 text-lg font-semibold tracking-[-0.02em] text-fg">30-minute intro call</p>
              <p className="mt-1 text-sm text-muted">With a founding partner. No deck, no pitch.</p>
              <Button className="mt-5 w-full" onClick={booking.open}>
                Pick a time
              </Button>
            </Card>
            <Card className="flex flex-col gap-4 p-6">
              <a href={`mailto:${site.email}`} className="flex items-center gap-3 text-sm text-fg transition-colors duration-200 hover:text-accent">
                <Mail className="size-4 text-accent" /> {site.email}
              </a>
              <p className="flex items-center gap-3 text-sm text-fg">
                <MapPin className="size-4 text-accent" /> {site.locations.join(' & ')}
              </p>
              <p className="flex items-center gap-3 text-sm text-muted">
                <span className="relative ml-1 mr-1 flex size-2">
                  <span className="absolute inset-0 animate-ping-soft rounded-full bg-ok" />
                  <span className="relative size-2 rounded-full bg-ok" />
                </span>
                {availability}
              </p>
            </Card>
          </Reveal>
        </div>
      </section>
    </>
  )
}

function Error({ id, msg }: { id: string; msg?: string }) {
  return (
    <AnimatePresence>
      {msg && (
        <motion.span
          id={id}
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="mt-1.5 block text-xs text-alert"
        >
          {msg}
        </motion.span>
      )}
    </AnimatePresence>
  )
}
