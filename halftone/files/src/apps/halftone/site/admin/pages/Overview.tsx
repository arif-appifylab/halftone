import { useQuery } from '@tanstack/react-query'
import { ArrowRight, CalendarClock, Inbox, NotebookPen, Wallet } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { Stats } from '../../../shared/types'
import { usd } from '../../data/pricing'
import { api } from '../../lib/api'
import { formatDate, timeAgo } from '../../lib/format'
import { BarChart } from '../components/BarChart'
import { EmptyState, PageHeader, Panel, Spinner, StatusBadge } from '../components/ui'

export function Overview() {
  const { data, isPending, isError } = useQuery({ queryKey: ['stats'], queryFn: () => api<Stats>('admin/stats') })
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  if (isPending) return <Spinner className="mx-auto mt-24 size-5" />
  if (isError) return <EmptyState title="Couldn’t load the dashboard" body="The site didn’t answer. Refresh to try again." />

  return (
    <>
      <PageHeader title={greeting} description="Here’s what’s happening at the studio." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Inbox} label="New inquiries" value={data.inquiries.new} hint={`${data.inquiries.last7} in the last 7 days`} to="/admin/inquiries" accent />
        <Stat icon={CalendarClock} label="Upcoming calls" value={data.bookings.upcoming} hint={data.bookings.today ? `${data.bookings.today} today` : 'None today'} to="/admin/bookings" />
        <Stat icon={Wallet} label="Open pipeline" value={usd(data.pipeline)} hint="Estimates on open leads, per month" to="/admin/inquiries" />
        <Stat icon={NotebookPen} label="Journal" value={data.posts.published} hint={`${data.posts.drafts} draft${data.posts.drafts === 1 ? '' : 's'}`} to="/admin/journal" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Panel className="p-5 md:p-6">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="text-sm font-medium text-fg">Inquiries per day</h2>
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Last 14 days</span>
          </div>
          <BarChart data={data.series} label="Inquiries per day, last 14 days" />
        </Panel>

        <Panel className="flex flex-col p-5 md:p-6">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-sm font-medium text-fg">Upcoming calls</h2>
            <Link to="/admin/bookings" className="text-xs text-muted hover:text-fg">All bookings</Link>
          </div>
          {data.upcomingBookings.length === 0 ? (
            <p className="text-sm text-muted">No calls booked yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-white/[0.05]">
              {data.upcomingBookings.map((b) => (
                <li key={b.id} className="flex items-center gap-3 py-3">
                  <div className="flex w-12 shrink-0 flex-col items-center rounded-lg border border-white/[0.07] bg-white/[0.02] py-1.5">
                    <span className="font-mono text-[9px] uppercase text-muted">{formatDate(b.date + 'T12:00:00', { month: 'short' })}</span>
                    <span className="text-base font-semibold tabular-nums text-fg">{Number(b.date.slice(8))}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-fg">{b.name}</p>
                    <p className="truncate text-xs text-muted">{b.company || b.email}</p>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-fg">{b.time}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel className="mt-4 p-5 md:p-6">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="text-sm font-medium text-fg">Latest inquiries</h2>
          <Link to="/admin/inquiries" className="inline-flex items-center gap-1 text-xs text-muted hover:text-fg">
            Open inbox <ArrowRight className="size-3" />
          </Link>
        </div>
        {data.recentInquiries.length === 0 ? (
          <p className="py-6 text-sm text-muted">No inquiries yet. They’ll appear here as soon as someone sends a brief.</p>
        ) : (
          <ul className="divide-y divide-white/[0.05]">
            {data.recentInquiries.map((q) => (
              <li key={q.id}>
                <Link to={`/admin/inquiries?open=${q.id}`} className="-mx-2 flex items-center gap-4 rounded-lg px-2 py-3 transition-colors duration-200 hover:bg-white/[0.03]">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-fg">
                      {q.name} <span className="text-muted">· {q.company || q.email}</span>
                    </p>
                    <p className="truncate text-xs text-muted">{q.message}</p>
                  </div>
                  {q.estimate?.estimate ? <span className="hidden font-mono text-xs text-fg sm:block">{usd(q.estimate.estimate)}</span> : null}
                  <StatusBadge status={q.status} />
                  <span className="hidden w-16 text-right text-xs text-muted md:block">{timeAgo(q.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  )
}

function Stat({ icon: Icon, label, value, hint, to, accent }: { icon: typeof Inbox; label: string; value: ReactNode; hint: string; to: string; accent?: boolean }) {
  return (
    <Link to={to} className="group block">
      <Panel className="h-full p-5 transition-[box-shadow,transform] duration-300 ease-expo group-hover:-translate-y-0.5 group-hover:shadow-card-hover">
        <div className="flex items-center justify-between">
          <span className="text-[13px] text-muted">{label}</span>
          <Icon className={accent ? 'size-4 text-accent' : 'size-4 text-muted'} strokeWidth={1.75} />
        </div>
        <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-fg tabular-nums">{value}</p>
        <p className="mt-1 text-xs text-muted">{hint}</p>
      </Panel>
    </Link>
  )
}
