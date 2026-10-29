import { siteFetch } from '../../../../platform/browser'

/** Where this app's Site API is mounted (src/pages/site-api/apps/halftone/). */
export const API_BASE = '/site-api/apps/halftone/'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/**
 * JSON fetch for the app's Site API. Goes through `siteFetch`, which sends the
 * CSRF token every write needs, and turns `{ error, message }` answers into ApiError.
 */
export async function api<T>(path: string, init: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const res = await siteFetch(API_BASE + path, {
    method: init.method ?? 'GET',
    signal: init.signal,
    headers: {
      Accept: 'application/json',
      ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
  })
  const data = res.headers.get('content-type')?.includes('application/json') ? await res.json().catch(() => null) : null
  if (!res.ok) throw new ApiError(res.status, data?.message ?? `Request failed (${res.status})`)
  return data as T
}
