import { motion, useScroll, useSpring } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { PostCover } from '../components/art/PostCover'
import { RichContent } from '../components/journal/RichContent'
import { CTA } from '../components/sections/CTA'
import { Eyebrow } from '../components/ui/Eyebrow'
import { Reveal } from '../components/ui/Reveal'
import { ApiError } from '../lib/api'
import { formatDate } from '../lib/format'
import { usePost, usePosts } from '../lib/queries'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export function Post() {
  const { slug } = useParams()
  const { data: post, isPending, error } = usePost(slug)
  const { data: all } = usePosts()
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 40, restDelta: 0.001 })
  useDocumentTitle(post?.title)

  if (error instanceof ApiError && error.status === 404) return <Navigate to="/journal" replace />
  if (isPending || !post) {
    return (
      <div className="container-x max-w-3xl animate-pulse pb-24 pt-40" aria-busy="true">
        <div className="h-4 w-24 rounded bg-white/[0.06]" />
        <div className="mt-6 h-12 w-4/5 rounded bg-white/[0.08]" />
        <div className="mt-4 h-5 w-full rounded bg-white/[0.05]" />
        {error && <p className="mt-8 text-muted">This post couldn’t be loaded. Please try again.</p>}
      </div>
    )
  }

  const more = (all ?? []).filter((p) => p.slug !== post.slug).slice(0, 2)

  return (
    <>
      <motion.div aria-hidden style={{ scaleX: progress }} className="fixed inset-x-0 top-16 z-40 h-px origin-left bg-accent shadow-[0_0_8px_var(--color-accent)]" />
      <article className="pb-16 pt-32 md:pt-40">
        <div className="container-x max-w-3xl">
          <Reveal className="flex flex-col items-start gap-6">
            <Link to="/journal" className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors duration-200 hover:text-fg">
              <ArrowLeft className="size-3.5" /> Journal
            </Link>
            <Eyebrow>{post.category}</Eyebrow>
            <h1 className="text-gradient text-balance text-4xl font-semibold leading-[1.04] tracking-[-0.04em] md:text-6xl">{post.title}</h1>
            <p className="text-pretty text-lg leading-relaxed text-muted md:text-xl">{post.excerpt}</p>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
              {post.author} · {formatDate(post.publishedAt)} · {post.readingTime} read
            </p>
          </Reveal>
        </div>
        <Reveal className="container-x mt-12 max-w-5xl">
          <PostCover post={post} priority className="aspect-[16/8] rounded-2xl shadow-card" />
        </Reveal>
        <div className="container-x mt-12 max-w-2xl md:mt-16">
          <RichContent doc={post.body} />
        </div>
      </article>

      {more.length > 0 && (
        <section className="border-t border-white/[0.05] py-16">
          <div className="container-x">
            <p className="mb-6 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">Keep reading</p>
            <div className="grid gap-4 md:grid-cols-2">
              {more.map((p) => (
                <Link key={p.slug} to={`/journal/${p.slug}`} className="group overflow-hidden rounded-2xl bg-white/[0.02] shadow-card transition-[box-shadow,transform] duration-300 ease-expo hover:-translate-y-1 hover:shadow-card-hover">
                  <PostCover post={p} className="aspect-[16/7]" />
                  <div className="p-5">
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">{formatDate(p.publishedAt)}</p>
                    <h3 className="mt-1.5 text-lg font-semibold tracking-[-0.02em] text-fg transition-colors duration-200 group-hover:text-accent">{p.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      <CTA />
    </>
  )
}
