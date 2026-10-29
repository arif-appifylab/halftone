import { useQuery } from '@tanstack/react-query'
import { refreshSession, siteFetch } from '../../../../platform/browser'

/** The signed-in person, from the site's own sign-in (`/site-api/me`). */
export type Me = { id: number; name: string; email: string; canManage: boolean }

/** null = signed out. `canManage` = holds `site:halftone:manage` (owners always do). */
export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async (): Promise<Me | null> => {
      let data = await readMe()
      // 'returning': the 10-minute access token ran out but the session is alive. Refresh it once
      // (the site's own sign-in system), then ask again: still signed in, no trip to the login.
      if (data.viewer.state === 'returning' && (await refreshSession())) data = await readMe()
      if (data.viewer.state !== 'user') return null
      return {
        id: data.viewer.id ?? 0,
        name: data.viewer.name ?? '',
        email: data.viewer.email ?? '',
        canManage: data.abilities.manageHalftone === true || data.roles.includes('owner'),
      }
    },
    staleTime: 60_000,
    retry: false,
  })
}

type MeAnswer = {
  viewer: { state: string; id?: number; name?: string; email?: string }
  abilities: Record<string, boolean>
  roles: string[]
}

async function readMe(): Promise<MeAnswer> {
  const res = await siteFetch('/site-api/me', { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Request failed (${res.status})`)
  return (await res.json()) as MeAnswer
}
