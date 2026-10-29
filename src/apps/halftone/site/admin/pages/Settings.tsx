import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { siteFetch } from '../../../../../platform/browser'
import { Button } from '../../components/ui/Button'
import { Field, Input } from '../../components/ui/Field'
import { LivePill } from '../../components/ui/Eyebrow'
import { api } from '../../lib/api'
import { useAvailability } from '../../lib/queries'
import { useToast } from '../components/Toast'
import { PageHeader, Panel } from '../components/ui'
import { useMe } from '../hooks'

export function Settings() {
  const { data: me } = useMe()
  return (
    <>
      <PageHeader title="Settings" description="Site-wide copy and your account." />
      <div className="grid max-w-3xl gap-4">
        <AvailabilityForm />
        <PasswordForm email={me?.email ?? ''} />
      </div>
    </>
  )
}

function AvailabilityForm() {
  const current = useAvailability()
  const [value, setValue] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const toast = useToast()
  const text = value ?? current
  const save = useMutation({
    mutationFn: (availability: string) => api('admin/settings', { method: 'PUT', body: { availability } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
      setValue(null)
      toast('Availability updated across the site')
    },
    onError: (e) => toast(e.message, 'error'),
  })

  return (
    <Panel className="p-5 md:p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate(text)
        }}
        className="flex flex-col gap-4"
      >
        <div>
          <h2 className="font-medium text-fg">Availability banner</h2>
          <p className="mt-1 text-sm text-muted">Shown in the hero, footer, call-to-action and contact page.</p>
        </div>
        <Field label="Text" hint={`${text.length}/120`}>
          <Input value={text} maxLength={120} onChange={(e) => setValue(e.target.value)} />
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <LivePill>{text || '…'}</LivePill>
          <Button type="submit" disabled={save.isPending || value === null || value.trim().length < 3}>
            Save
          </Button>
        </div>
      </form>
    </Panel>
  )
}

function PasswordForm({ email }: { email: string }) {
  const toast = useToast()
  const [error, setError] = useState<string | null>(null)
  const change = useMutation({
    // The site's own account action: checks the current password, signs out other sessions.
    mutationFn: async (body: { currentPassword: string; newPassword: string }) => {
      const res = await siteFetch('/site-api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      })
      const data = (await res.json().catch(() => null)) as { message?: string; fields?: Record<string, string> } | null
      if (!res.ok) throw new Error(Object.values(data?.fields ?? {})[0] ?? data?.message ?? 'Couldn’t change the password')
    },
    onSuccess: () => toast('Password changed — other sessions were signed out'),
    onError: (e) => setError(e.message),
  })

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const data = new FormData(form)
    const next = String(data.get('next'))
    setError(null)
    if (next !== String(data.get('confirm'))) return setError('New passwords don’t match')
    if (next.length < 10) return setError('Use at least 10 characters')
    change.mutate({ currentPassword: String(data.get('current')), newPassword: next }, { onSuccess: () => form.reset() })
  }

  return (
    <Panel className="p-5 md:p-6">
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div>
          <h2 className="font-medium text-fg">Password</h2>
          <p className="mt-1 text-sm text-muted">Signed in as {email}. Changing your password signs out every other session.</p>
        </div>
        <input type="email" name="username" autoComplete="username" value={email} readOnly hidden />
        <Field label="Current password">
          <Input name="current" type="password" autoComplete="current-password" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="New password" hint="10+ characters">
            <Input name="next" type="password" autoComplete="new-password" />
          </Field>
          <Field label="Confirm new password">
            <Input name="confirm" type="password" autoComplete="new-password" />
          </Field>
        </div>
        {error && <p role="alert" className="text-sm text-alert">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={change.isPending}>
            Update password
          </Button>
        </div>
      </form>
    </Panel>
  )
}
