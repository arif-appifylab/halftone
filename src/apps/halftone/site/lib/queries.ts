import { useQuery } from '@tanstack/react-query'
import type { Post, PublicSettings } from '../../shared/types'
import { site } from '../data/site'
import { api } from './api'

export const usePosts = () => useQuery({ queryKey: ['posts'], queryFn: () => api<Post[]>('posts') })

export const usePost = (slug?: string) =>
  useQuery({ queryKey: ['posts', slug], queryFn: () => api<Post>(`posts/${encodeURIComponent(slug ?? '')}`), enabled: !!slug, retry: false })

/** Live availability line (edited in /admin → Settings), with the static copy as a fallback. */
export function useAvailability() {
  const { data } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api<PublicSettings>('settings'),
    staleTime: 5 * 60_000,
  })
  return data?.availability || site.availability
}
