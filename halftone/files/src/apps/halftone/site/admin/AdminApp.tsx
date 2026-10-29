import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AdminLayout } from './AdminLayout'
import { BookingSettings } from './pages/BookingSettings'
import { ToastProvider } from './components/Toast'
import { Spinner } from './components/ui'
import { useMe } from './hooks'
import { Bookings } from './pages/Bookings'
import { Login } from './pages/Login'
import { Inquiries } from './pages/Inquiries'
import { Overview } from './pages/Overview'
import { PostEditor } from './pages/PostEditor'
import { Posts } from './pages/Posts'
import { Settings } from './pages/Settings'

/** Everything under /admin. Lazy-loaded so the public site never ships it. Sign-in uses the site's own accounts (pages/Login.tsx). */
export default function AdminApp() {
  return (
    <ToastProvider>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route element={<RequireAuth />}>
          <Route index element={<Overview />} />
          <Route path="inquiries" element={<Inquiries />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="bookings/settings" element={<BookingSettings />} />
          <Route path="bookings/availability" element={<Navigate to="/admin/bookings/settings" replace />} />
          <Route path="journal" element={<Posts />} />
          <Route path="journal/new" element={<PostEditor />} />
          <Route path="journal/:id" element={<PostEditor />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </ToastProvider>
  )
}

function RequireAuth() {
  const { data: user, isPending, isError } = useMe()
  const location = useLocation()
  if (isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-base">
        <Spinner className="size-5" />
      </div>
    )
  }
  if (isError) {
    return <div className="flex min-h-dvh items-center justify-center bg-base text-sm text-muted">Can’t reach the site right now. Reload to try again.</div>
  }
  if (!user) return <Navigate to={`/admin/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />
  if (!user.canManage) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-base px-6 text-center">
        <p className="text-fg">You’re signed in as {user.email}, but this account can’t manage the studio.</p>
        <p className="text-sm text-muted">Ask the owner to give your role the “Manage Halftone” permission.</p>
        <a href="/" className="text-sm text-accent hover:underline">Back to the site</a>
      </div>
    )
  }
  return <AdminLayout user={user} />
}
