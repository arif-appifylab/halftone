import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { CaseStudy } from './pages/CaseStudy'
import { Contact } from './pages/Contact'
import { Home } from './pages/Home'
import { Journal } from './pages/Journal'
import { NotFound } from './pages/NotFound'
import { Post } from './pages/Post'
import { Pricing } from './pages/Pricing'
import { Studio } from './pages/Studio'
import { Work } from './pages/Work'

// Admin is its own chunk — visitors to the marketing site never download it.
const AdminApp = lazy(() => import('./admin/AdminApp'))

/** The whole Halftone site; every page file renders it (src/apps/halftone/HalftoneShell.astro). */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/admin/*"
          element={
            <Suspense fallback={<div className="min-h-dvh bg-base" />}>
              <AdminApp />
            </Suspense>
          }
        />
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="work" element={<Work />} />
          <Route path="work/:slug" element={<CaseStudy />} />
          <Route path="studio" element={<Studio />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="journal" element={<Journal />} />
          <Route path="journal/:slug" element={<Post />} />
          <Route path="contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
