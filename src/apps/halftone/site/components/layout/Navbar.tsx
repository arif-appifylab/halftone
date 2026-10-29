import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion'
import { ArrowUpRight, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { nav, site } from '../../data/site'
import { cn } from '../../lib/cn'
import { EASE } from '../../lib/motion'
import { useBooking } from '../booking/BookingContext'
import { Button, ButtonLink } from '../ui/Button'
import { Logo } from '../ui/Logo'

export function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { scrollY } = useScroll()
  const { pathname } = useLocation()
  const booking = useBooking()

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 12))
  useEffect(() => {
    setOpen(false)
  }, [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          'border-b transition-[background-color,border-color,backdrop-filter] duration-300 ease-expo',
          scrolled || open ? 'border-white/[0.06] bg-base/70 backdrop-blur-xl' : 'border-transparent',
        )}
      >
        <nav className="container-x flex h-16 items-center justify-between" aria-label="Primary">
          <NavLink to="/" className="group/logo relative z-10 rounded-md" aria-label="Halftone home">
            <Logo />
          </NavLink>

          <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
            {nav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'relative block rounded-lg px-3 py-2 text-sm transition-colors duration-200 hover:text-fg',
                      isActive ? 'text-fg' : 'text-muted',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="nav-active"
                          className="absolute inset-0 -z-10 rounded-lg bg-white/[0.06] shadow-inset"
                          transition={{ duration: 0.3, ease: EASE }}
                        />
                      )}
                      {item.label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" size="sm" onClick={booking.open}>
              Book a call
            </Button>
            <ButtonLink to="/contact" size="sm">
              Start a project
            </ButtonLink>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="relative z-10 inline-flex h-10 items-center gap-2 rounded-lg px-3 text-sm text-fg transition-colors duration-200 hover:bg-white/[0.06] md:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? 'x' : 'menu'}
                initial={{ opacity: 0, rotate: -45 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 45 }}
                transition={{ duration: 0.2, ease: EASE }}
              >
                {open ? <X className="size-5" /> : <Menu className="size-5" />}
              </motion.span>
            </AnimatePresence>
          </button>
        </nav>
      </div>

      {/* Full-screen overlay menu (mobile) */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="relative h-[calc(100dvh-4rem)] overflow-hidden bg-base/95 backdrop-blur-xl md:hidden"
          >
            <div aria-hidden className="bg-halftone-lg absolute -bottom-20 -right-20 size-96 text-accent/25 [mask-image:radial-gradient(circle_at_70%_70%,#000,transparent_60%)]" />
            <div className="container-x relative flex h-full flex-col py-6">
              <ul className="flex flex-col">
                {nav.map((item, i) => (
                  <motion.li
                    key={item.to}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: EASE, delay: 0.05 + 0.05 * i }}
                  >
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'flex items-baseline justify-between border-b border-white/[0.05] py-4 text-4xl font-semibold tracking-[-0.04em] transition-colors duration-200',
                          isActive ? 'text-fg' : 'text-muted hover:text-fg',
                        )
                      }
                    >
                      {item.label}
                      <span className="font-mono text-xs font-normal tracking-normal text-muted/60">0{i + 1}</span>
                    </NavLink>
                  </motion.li>
                ))}
              </ul>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.35 }}
                className="mt-auto flex flex-col gap-3"
              >
                <a href={`mailto:${site.email}`} className="mb-2 inline-flex items-center gap-1 text-sm text-muted">
                  {site.email} <ArrowUpRight className="size-3.5" />
                </a>
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={() => {
                    setOpen(false)
                    booking.open()
                  }}
                >
                  Book a call
                </Button>
                <ButtonLink to="/contact" size="lg" className="w-full">
                  Start a project
                </ButtonLink>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
