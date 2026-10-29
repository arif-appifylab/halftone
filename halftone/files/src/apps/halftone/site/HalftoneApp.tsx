import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode, useEffect, useState } from 'react'
import settings from '../settings.json'
import App from './App'

/** settings.json colours → the theme's CSS variables (set through the CSSOM, which the CSP allows). */
const COLOR_VARS: Record<keyof typeof settings.colors, string> = {
  accent: '--color-accent',
  accentBright: '--color-accent-bright',
  accentDeep: '--color-accent-deep',
  accentInk: '--color-accent-ink',
  glow: '--color-glow',
  glowBright: '--color-glow-bright',
  base: '--color-base',
}

/** The whole public Halftone site, mounted client-side by src/pages/halftone/[...path].astro. */
export default function HalftoneApp() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } },
      }),
  )
  useEffect(() => {
    const root = document.documentElement.style
    for (const [key, name] of Object.entries(COLOR_VARS)) {
      const value = settings.colors[key as keyof typeof COLOR_VARS]
      if (/^#[0-9a-f]{6}$/i.test(value)) root.setProperty(name, value)
    }
  }, [])

  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </StrictMode>
  )
}
