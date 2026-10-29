import { useEffect } from 'react'
import { Outlet, useLocation, useSearchParams } from 'react-router-dom'
import { BookingProvider, useBooking } from '../booking/BookingContext'
import { AmbientBackground } from './AmbientBackground'
import { Footer } from './Footer'
import { Navbar } from './Navbar'

export function Layout() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <BookingProvider>
      <div className="relative min-h-dvh overflow-x-clip">
        <a
          href="#main"
          className="sr-only z-[60] rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        <OpenBookingFromUrl />
        <AmbientBackground />
        <Navbar />
        <main id="main">
          <Outlet />
        </main>
        <Footer />
      </div>
    </BookingProvider>
  )
}

/** `/?book=1` opens the booking modal — used by "Open page" in the admin and shareable as a direct booking link. */
function OpenBookingFromUrl() {
  const [params, setParams] = useSearchParams()
  const { open } = useBooking()
  useEffect(() => {
    if (!params.has('book')) return
    open()
    params.delete('book')
    setParams(params, { replace: true })
  }, [params, setParams, open])
  return null
}
