import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { BookingModal } from './BookingModal'

const BookingContext = createContext<{ open: () => void } | null>(null)

/** Lets any "Book a call" button anywhere open the single booking modal. */
export function BookingProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const open = useCallback(() => setOpen(true), [])
  return (
    <BookingContext.Provider value={{ open }}>
      {children}
      <BookingModal open={isOpen} onClose={() => setOpen(false)} />
    </BookingContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBooking() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking must be used inside <BookingProvider>')
  return ctx
}
