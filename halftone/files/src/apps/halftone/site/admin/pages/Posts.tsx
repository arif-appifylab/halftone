import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Post } from '../../../shared/types'
import { PostCover } from '../../components/art/PostCover'
import { ButtonLink } from '../../components/ui/Button'
import { api } from '../../lib/api'
import { cn } from '../../lib/cn'
import { formatDate } from '../../lib/format'
import { EmptyState, PageHeader, Panel, Spinner } from '../components/ui'

export function Posts() {
  const { data, isPending, isError } = useQuery({ queryKey: ['admin-posts'], queryFn: () => api<Post[]>('admin/posts') })

  return (
    <>
      <PageHeader
        title="Journal"
        description="Write, edit and publish posts on /journal."
        actions={
          <ButtonLink to="/admin/journal/new">
            <Plus className="size-4" /> New post
          </ButtonLink>
        }
      />
      {isPending ? (
        <Spinner className="mx-auto mt-16 size-5" />
      ) : isError ? (
        <EmptyState title="Couldn’t load posts" body="Check that the API server is running." />
      ) : data.length === 0 ? (
        <EmptyState title="No posts yet" body="Your first journal entry is one click away." action={<ButtonLink to="/admin/journal/new">Write a post</ButtonLink>} />
      ) : (
        <Panel className="divide-y divide-white/[0.05] overflow-hidden">
          {data.map((p) => (
            <Link key={p.id} to={`/admin/journal/${p.id}`} className="group flex items-center gap-4 p-4 transition-colors duration-200 hover:bg-white/[0.03] md:px-5">
              <PostCover post={p} compact className="size-14 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-fg group-hover:text-accent">{p.title}</p>
                <p className="truncate text-xs text-muted">
                  {p.category} · {p.author} · {p.readingTime} · /journal/{p.slug}
                </p>
              </div>
              <span
                className={cn(
                  'rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]',
                  p.published ? 'border-ok/40 bg-ok/10 text-ok' : 'border-white/10 bg-white/[0.04] text-muted',
                )}
              >
                {p.published ? 'Published' : 'Draft'}
              </span>
              <span className="hidden w-24 text-right text-xs text-muted md:block">{formatDate(p.publishedAt ?? p.updatedAt)}</span>
            </Link>
          ))}
        </Panel>
      )}
    </>
  )
}
