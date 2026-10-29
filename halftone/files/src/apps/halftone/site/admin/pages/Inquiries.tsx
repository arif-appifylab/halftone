import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Mail, Search, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { INQUIRY_STATUSES, type Inquiry, type InquiryStatus } from '../../../shared/types'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select, Textarea } from '../../components/ui/Field'
import { usd } from '../../data/pricing'
import { capabilities } from '../../data/services'
import { api } from '../../lib/api'
import { cn } from '../../lib/cn'
import { formatDateTime, timeAgo } from '../../lib/format'
import { useToast } from '../components/Toast'
import { ConfirmButton, Drawer, EmptyState, PageHeader, Panel, Segmented, Spinner, StatusBadge } from '../components/ui'

type Filter = 'all' | InquiryStatus
const serviceName = (id: string) => capabilities.find((c) => c.id === id)?.name ?? id

export function Inquiries() {
  const [params, setParams] = useSearchParams()
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q), 250)
    return () => clearTimeout(t)
  }, [q])

  const { data, isPending, isError } = useQuery({
    queryKey: ['inquiries', filter, debounced],
    queryFn: () => api<{ items: Inquiry[]; counts: Record<string, number> }>(`admin/inquiries?status=${filter}&q=${encodeURIComponent(debounced)}`),
    placeholderData: (prev) => prev,
  })

  const openId = Number(params.get('open')) || null
  const selected = data?.items.find((i) => i.id === openId) ?? null
  const close = () => setParams({}, { replace: true })
  const total = data ? Object.values(data.counts).reduce((a, b) => a + b, 0) : undefined

  return (
    <>
      <PageHeader title="Inquiries" description="Project briefs from the contact form and pricing calculator." />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Segmented<Filter>
          label="Filter by status"
          value={filter}
          onChange={setFilter}
          options={[{ value: 'all', label: 'All', count: total }, ...INQUIRY_STATUSES.map((s) => ({ value: s, label: s, count: data?.counts[s] ?? 0 }))]}
        />
        <label className="relative md:w-72">
          <span className="sr-only">Search inquiries</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, company, message…" className="h-10 pl-9" />
        </label>
      </div>

      {isPending ? (
        <Spinner className="mx-auto mt-16 size-5" />
      ) : isError ? (
        <EmptyState title="Couldn’t load inquiries" body="Check that the API server is running." />
      ) : data.items.length === 0 ? (
        <EmptyState title={q || filter !== 'all' ? 'No matches' : 'Inbox zero'} body={q || filter !== 'all' ? 'Try a different filter or search.' : 'New briefs from the site will land here.'} />
      ) : (
        <Panel className="overflow-hidden">
          <ul className="divide-y divide-white/[0.05]">
            {data.items.map((i) => (
              <li key={i.id}>
                <button
                  type="button"
                  onClick={() => setParams({ open: String(i.id) })}
                  className={cn('grid w-full grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-4 text-left transition-colors duration-200 hover:bg-white/[0.03] md:grid-cols-[14rem_1fr_7rem_6rem_5rem]', openId === i.id && 'bg-white/[0.04]')}
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 truncate text-sm font-medium text-fg">
                      {i.status === 'new' && <span aria-label="Unread" className="size-1.5 shrink-0 rounded-full bg-accent" />}
                      {i.name}
                    </p>
                    <p className="truncate text-xs text-muted">{i.company || i.email}</p>
                  </div>
                  <p className="col-span-2 row-start-2 truncate text-sm text-muted md:col-span-1 md:row-start-auto">{i.message}</p>
                  <span className="hidden text-right font-mono text-xs tabular-nums text-fg md:block">{i.estimate?.estimate ? usd(i.estimate.estimate) : i.budget || '—'}</span>
                  <span className="col-start-2 row-start-1 justify-self-end md:col-start-auto md:row-start-auto md:justify-self-auto">
                    <StatusBadge status={i.status} />
                  </span>
                  <span className="hidden text-right text-xs text-muted md:block">{timeAgo(i.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Drawer open={!!selected} onClose={close} title={selected ? `Inquiry #${selected.id}` : 'Inquiry'}>
        {selected && <InquiryDetail key={selected.id} inquiry={selected} onDeleted={close} />}
      </Drawer>
    </>
  )
}

function InquiryDetail({ inquiry, onDeleted }: { inquiry: Inquiry; onDeleted: () => void }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [notes, setNotes] = useState(inquiry.notes)
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['inquiries'] })
    queryClient.invalidateQueries({ queryKey: ['stats'] })
  }

  const update = useMutation({
    mutationFn: (body: Partial<Pick<Inquiry, 'status' | 'notes'>>) => api<Inquiry>(`admin/inquiries/${inquiry.id}`, { method: 'PATCH', body }),
    onSuccess: (_d, vars) => {
      invalidate()
      toast(vars.status ? `Marked as ${vars.status}` : 'Notes saved')
    },
    onError: (e) => toast(e.message, 'error'),
  })
  const remove = useMutation({
    mutationFn: () => api(`admin/inquiries/${inquiry.id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidate()
      toast('Inquiry deleted')
      onDeleted()
    },
    onError: (e) => toast(e.message, 'error'),
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-fg">{inquiry.name}</h2>
        <p className="mt-1 text-sm text-muted">
          {inquiry.company && <>{inquiry.company} · </>}
          <a href={`mailto:${inquiry.email}`} className="text-fg hover:text-accent">{inquiry.email}</a>
        </p>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Received {formatDateTime(inquiry.createdAt)}</p>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/[0.06]">
        <Meta label="Budget" value={inquiry.budget || '—'} />
        <Meta label="Services" value={inquiry.services.map(serviceName).join(', ') || '—'} />
      </div>

      {inquiry.estimate && (
        <div className="rounded-xl border border-accent/25 bg-accent/[0.05] p-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent">Calculator estimate</p>
          <p className="mt-1 text-sm text-fg">
            {inquiry.estimate.plan}
            {inquiry.estimate.seats && ` · ${inquiry.estimate.seats} seat(s)`}
            {inquiry.estimate.commitment && ` · ${inquiry.estimate.commitment}`}
            {inquiry.estimate.estimate ? <> · <span className="font-semibold">{usd(inquiry.estimate.estimate)}/mo</span></> : null}
          </p>
          {!!inquiry.estimate.extras?.length && <p className="mt-1 text-xs text-muted">Add-ons: {inquiry.estimate.extras.join(', ')}</p>}
        </div>
      )}

      <div>
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.16em] text-muted">Brief</p>
        <p className="whitespace-pre-wrap rounded-xl border border-white/[0.06] bg-base/50 p-4 text-sm leading-relaxed text-fg/90">{inquiry.message}</p>
      </div>

      <Field label="Status">
        <Select value={inquiry.status} onChange={(e) => update.mutate({ status: e.target.value as InquiryStatus })} disabled={update.isPending} className="capitalize">
          {INQUIRY_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
      </Field>

      <Field label="Internal notes" hint="only visible to the team">
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Call notes, next steps…" />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-5">
        <ConfirmButton onConfirm={() => remove.mutate()} disabled={remove.isPending}>
          <Trash2 className="size-3.5" /> Delete
        </ConfirmButton>
        <div className="flex gap-2">
          <a
            href={`mailto:${inquiry.email}?subject=${encodeURIComponent('Re: your project brief — Halftone')}`}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-white/[0.05] px-4 text-sm text-fg shadow-inset transition-colors duration-200 hover:bg-white/[0.08]"
          >
            <Mail className="size-4" /> Reply
          </a>
          <Button onClick={() => update.mutate({ notes })} disabled={update.isPending || notes === inquiry.notes}>
            Save notes
          </Button>
        </div>
      </div>
    </div>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-elevated p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-1 text-sm text-fg">{value}</p>
    </div>
  )
}
