import { useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { siteFetch } from '../../../../../platform/browser'
import { HalftoneOrb } from '../../components/art/HalftoneOrb'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'
import { Logo } from '../../components/ui/Logo'
import { useMe } from '../hooks'

type Answer = { ok?: boolean; twoFactor?: boolean; challenge?: string; message?: string; fields?: Record<string, string> }

/**
 * The site's OWN sign-in (`/site-api/auth/*`: sessions, cookies, rate limits and emails are the
 * site's), behind Halftone's sign-in screen. Password, or a 6-digit code by email (the site
 * owner's account has no password until they set one), then two-step sign-in when it is on.
 */
async function post(path: string, body: unknown): Promise<{ status: number; data: Answer }> {
  const res = await siteFetch(`/site-api/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  const data = ((await res.json().catch(() => null)) ?? {}) as Answer
  return { status: res.status, data }
}

const failure = (data: Answer) => Object.values(data.fields ?? {})[0] ?? data.message ?? 'That didn’t work. Try again.'

export function Login() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data: me } = useMe()
  const [show, setShow] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  // password → the usual form; code → email a code, then type it; twoFactor → the authenticator code.
  const [mode, setMode] = useState<'password' | 'code' | 'twoFactor'>('password')
  const [codeSent, setCodeSent] = useState(false)
  const [challenge, setChallenge] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  // Only allow redirects back into /admin — never to an arbitrary URL.
  const raw = params.get('next') || '/admin'
  const next = raw.startsWith('/admin') && !raw.startsWith('//') ? raw : '/admin'

  useEffect(() => {
    document.title = 'Sign in · Halftone Admin'
  }, [])

  if (me) return <Navigate to={next} replace />

  const signedIn = async () => {
    await queryClient.invalidateQueries({ queryKey: ['me'] })
    navigate(next, { replace: true })
  }

  /** One answer from the site's sign-in: in, two-step next, or an error to show. */
  const handle = async ({ status, data }: { status: number; data: Answer }) => {
    if (status === 202 && data.twoFactor && data.challenge) {
      setChallenge(data.challenge)
      setCode('')
      setMode('twoFactor')
      setNotice(data.message ?? 'Enter the 6-digit code from your authenticator app.')
      return
    }
    if (status >= 200 && status < 300 && data.ok) return signedIn()
    setError(failure(data))
  }

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (pending) return
    setError(null)
    setPending(true)
    try {
      if (mode === 'password') await handle(await post('login', { email, password, next }))
      else if (mode === 'twoFactor') await handle(await post('login/two-factor', { challenge, code: code.trim(), next }))
      else if (!codeSent) {
        const { status, data } = await post('code', { email, next })
        if (status >= 200 && status < 300) {
          setCodeSent(true)
          setNotice(`If ${email} has an account here, a 6-digit code is on its way. It works for 10 minutes.`)
        } else setError(failure(data))
      } else await handle(await post('code/verify', { email, code: code.replace(/\s/g, ''), next }))
    } catch {
      setError('Couldn’t reach the site. Check your connection and try again.')
    } finally {
      setPending(false)
    }
  }

  const switchTo = (to: 'password' | 'code') => {
    setMode(to)
    setCodeSent(false)
    setCode('')
    setError(null)
    setNotice(null)
  }

  const label =
    mode === 'password' ? 'Sign in' : mode === 'twoFactor' ? 'Verify' : codeSent ? 'Sign in' : 'Email me a code'

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-base px-4 py-12">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 size-[46rem] -translate-x-1/2 -translate-y-[58%] opacity-30">
        <HalftoneOrb spacing={12} />
      </div>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_50%_at_50%_45%,transparent,var(--color-base)_80%)]" />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <Link to="/" aria-label="Back to site" className="rounded-md">
            <Logo />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-[-0.03em] text-fg">Studio admin</h1>
            <p className="mt-1 text-sm text-muted">Sign in to manage leads, bookings and the journal.</p>
          </div>
        </div>

        <form
          onSubmit={submit}
          noValidate
          className="relative flex flex-col gap-5 rounded-2xl border border-white/[0.08] bg-elevated/85 p-6 shadow-window backdrop-blur-xl"
        >
          <span aria-hidden className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
          {mode !== 'twoFactor' && (
            <Field label="Email">
              <Input
                name="email"
                type="email"
                autoComplete="username"
                autoFocus
                placeholder="you@halftone.studio"
                value={email}
                readOnly={mode === 'code' && codeSent}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
          )}
          {mode === 'password' && (
            <Field label="Password">
              <div className="relative">
                <Input name="password" type={show ? 'text' : 'password'} autoComplete="current-password" className="pr-10" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                  className="absolute right-1.5 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted hover:text-fg"
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>
          )}
          {((mode === 'code' && codeSent) || mode === 'twoFactor') && (
            <Field label={mode === 'twoFactor' ? 'Authenticator code' : 'Code from the email'}>
              <Input
                name="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                placeholder="123456"
                className="font-mono tracking-[0.3em]"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </Field>
          )}
          {notice && !error && <p className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-muted">{notice}</p>}
          {error && (
            <p role="alert" className="rounded-lg border border-alert/30 bg-alert/10 px-3 py-2 text-sm text-alert">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" disabled={pending} aria-busy={pending} className="w-full">
            {pending ? <Loader2 className="size-4 animate-spin" /> : mode === 'code' && !codeSent ? <Mail className="size-4" /> : <Lock className="size-4" />} {label}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-muted">
          {mode === 'password' ? (
            <button type="button" onClick={() => switchTo('code')} className="hover:text-fg">
              Email me a sign-in code instead
            </button>
          ) : (
            <button type="button" onClick={() => switchTo('password')} className="hover:text-fg">
              Use my password instead
            </button>
          )}
        </p>
        <p className="mt-6 text-center text-xs text-muted">
          <Link to="/" className="hover:text-fg">← Back to the site</Link>
        </p>
      </div>
    </div>
  )
}
