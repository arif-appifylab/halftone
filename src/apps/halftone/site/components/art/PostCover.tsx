import type { Post } from '../../../shared/types'
import { cn } from '../../lib/cn'
import { Photo } from '../ui/Photo'

/** Journal cover: the post's photo if it has one, otherwise a generated halftone field. */
export function PostCover({ post, className, compact = false, priority = false }: { post: Pick<Post, 'palette' | 'category' | 'cover' | 'title'>; className?: string; compact?: boolean; priority?: boolean }) {
  const [a, b] = post.palette
  const label = !compact && (
    <span className="absolute left-4 top-4 z-10 rounded-full border border-white/10 bg-base/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted backdrop-blur">
      {post.category}
    </span>
  )

  if (post.cover) {
    return (
      <div className={cn('relative overflow-hidden', className)}>
        <Photo src={post.cover} alt="" priority={priority} className="absolute inset-0" imgClassName="group-hover:scale-[1.03]" sizes={compact ? '128px' : '(min-width: 768px) 50vw, 100vw'} />
        {label}
      </div>
    )
  }

  return (
    <div className={cn('relative overflow-hidden bg-elevated', className)} aria-hidden>
      <div className="absolute inset-0" style={{ background: `radial-gradient(80% 70% at 20% 20%, ${a}33, transparent 60%), radial-gradient(70% 70% at 90% 90%, ${b}33, transparent 60%)` }} />
      <div className="bg-halftone-lg absolute inset-0 [mask-image:radial-gradient(circle_at_80%_80%,#000,transparent_60%)]" style={{ color: b }} />
      <div className="bg-halftone absolute inset-0 [mask-image:radial-gradient(circle_at_15%_20%,#000,transparent_45%)]" style={{ color: a }} />
      <span className={cn('absolute bottom-[-0.18em] right-4 font-serif italic leading-none text-white/[0.12]', compact ? 'text-7xl' : 'text-[9rem] md:text-[12rem]')}>
        {post.category[0]}
      </span>
      {label}
    </div>
  )
}
