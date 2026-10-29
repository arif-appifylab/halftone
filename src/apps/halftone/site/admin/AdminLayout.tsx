import { useMutation, useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { CalendarClock, ExternalLink, Inbox, LayoutGrid, LogOut, Menu, NotebookPen, Settings2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { logout as siteLogout } from '../../../../platform/browser'
import type { Stats } from '../../shared/types'
import { Logo } from '../components/ui/Logo'
import { api } from '../lib/api'
import { cn } from '../lib/cn'
import { EASE } from '../lib/motion'
import type { Me } from './hooks'

const links = [
  { to: '/admin', label: 'Overview', icon: LayoutGrid, end: true },
  { to: '/admin/inquiries', label: 'Inquiries', icon: Inbox, badge: 'inquiries' as const },
  { to: '/admin/bookings', label: 'Bookings', icon: CalendarClock, badge: 'bookings' as const },
  { to: '/admin/journal', label: 'Journal', icon: NotebookPen },
  { to: '/admin/settings', label: 'Settings', icon: Settings2 },
]

export function AdminLayout({ user }: { user: Me }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => {
    setOpen(false)
  }, [pathname])
  useEffect(() => {
    document.title = 'Admin · Halftone'
  }, [pathname])

  return (
    <div className="min-h-dvh bg-base">
      {/* subdued ambient light — this is a tool, not a stage */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(60%_40%_at_70%_0%,rgb(142_124_255/0.08),transparent_70%)]" />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-white/[0.06] bg-deep/80 backdrop-blur-xl lg:block">
        <Sidebar user={user} />
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/[0.06] bg-base/80 px-4 backdrop-blur-xl lg:hidden">
        <Logo />
        <button type="button" onClick={() => setOpen(true)} aria-label="Open navigation" className="inline-flex size-9 items-center justify-center rounded-lg text-fg hover:bg-white/[0.06]">
          <Menu className="size-5" />
        </button>
      </header>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div className="absolute inset-0 bg-deep/70 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} />
            <motion.aside
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ duration: 0.25, ease: EASE }}
              className="absolute inset-y-0 left-0 w-72 border-r border-white/[0.08] bg-elevated"
            >
              <button type="button" onClick={() => setOpen(false)} aria-label="Close navigation" className="absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-lg text-muted hover:bg-white/[0.06]">
                <X className="size-4" />
              </button>
              <Sidebar user={user} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <main className="relative lg:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-8 md:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function Sidebar({ user }: { user: Me }) {
  const { data: stats } = useQuery({ queryKey: ['stats'], queryFn: () => api<Stats>('admin/stats') })
  const logout = useMutation({
    // Signs this device out of the site, then reloads (signed out → the sign-in page).
    mutationFn: siteLogout,
  })
  const badges = { inquiries: stats?.inquiries.new, bookings: stats?.bookings.upcoming }

  return (
    <div className="flex h-full flex-col p-4">
      <div className="flex items-center gap-2 px-2 pb-6 pt-1">
        <Logo />
        <span className="rounded-md border border-white/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">Admin</span>
      </div>
      <nav aria-label="Admin" className="flex flex-col gap-0.5">
        {links.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors duration-200',
                isActive ? 'bg-white/[0.06] text-fg shadow-inset' : 'text-muted hover:bg-white/[0.03] hover:text-fg',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('size-4', isActive ? 'text-accent' : 'text-muted group-hover:text-fg')} strokeWidth={1.75} />
                {label}
                {badge && !!badges[badge] && (
                  <span className={cn('ml-auto rounded-full px-1.5 font-mono text-[10px] tabular-nums', badge === 'inquiries' ? 'bg-accent text-accent-ink' : 'bg-white/10 text-fg')}>
                    {badges[badge]}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-2">
        <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition-colors duration-200 hover:bg-white/[0.03] hover:text-fg">
          <ExternalLink className="size-4" strokeWidth={1.75} /> View site
        </a>
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-accent to-accent-deep text-xs font-semibold text-accent-ink">
            {(user.name || user.email).split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-fg">{user.name}</p>
            <p className="truncate text-[11px] text-muted">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
            aria-label="Sign out"
            title="Sign out"
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors duration-200 hover:bg-white/[0.06] hover:text-fg"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
