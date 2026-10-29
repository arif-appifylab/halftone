import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PostCover } from '../components/art/PostCover'
import { PageHero } from '../components/layout/PageHero'
import { Reveal, RevealGroup, RevealItem } from '../components/ui/Reveal'
import { Accent } from '../components/ui/SectionHeader'
import { formatDate } from '../lib/format'
import { usePosts } from '../lib/queries'
import { useDocumentTitle } from '../lib/useDocumentTitle'

export function Journal() {
  useDocumentTitle('Journal')
  const { data: posts, isPending, isError } = usePosts()

  return (
    <>
      <PageHero eyebrow="Journal" title={<>Notes from the <Accent>studio.</Accent></>} lead="Process, craft and the occasional strong opinion. Published when we have something to say." />
      <section className="pb-16 md:pb-24">
        <div className="container-x">
          {isPending ? (
            <JournalSkeleton />
          ) : isError ? (
            <p className="rounded-2xl border border-white/[0.06] p-8 text-muted">The journal couldn’t be loaded right now. Please try again in a moment.</p>
          ) : posts.length === 0 ? (
            <p className="rounded-2xl border border-white/[0.06] p-8 text-muted">Nothing published yet — check back soon.</p>
          ) : (
            <>
              <Reveal>
                <Link
                  to={`/journal/${posts[0].slug}`}
                  className="group grid overflow-hidden rounded-2xl bg-gradient-to-b from-white/[0.05] to-white/[0.015] shadow-card transition-[box-shadow,transform] duration-300 ease-expo hover:-translate-y-1 hover:shadow-card-hover md:grid-cols-2"
                >
                  <PostCover post={posts[0]} priority className="aspect-[16/10] md:aspect-auto md:min-h-80" />
                  <div className="flex flex-col justify-center gap-4 p-6 md:p-10">
                    <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                      Latest · {formatDate(posts[0].publishedAt)} · {posts[0].readingTime}
                    </p>
                    <h2 className="text-balance text-3xl font-semibold tracking-[-0.035em] text-fg transition-colors duration-200 group-hover:text-accent md:text-4xl">{posts[0].title}</h2>
                    <p className="leading-relaxed text-muted">{posts[0].excerpt}</p>
                    <p className="text-sm text-fg/80">By {posts[0].author}</p>
                  </div>
                </Link>
              </Reveal>

              <RevealGroup className="mt-10 divide-y divide-white/[0.06] border-y border-white/[0.06]">
                {posts.slice(1).map((p) => (
                  <RevealItem key={p.slug}>
                    <Link to={`/journal/${p.slug}`} className="group grid items-center gap-4 py-6 md:grid-cols-[8rem_1fr_auto] md:gap-8">
                      <PostCover post={p} compact className="hidden aspect-square rounded-xl md:block" />
                      <div>
                        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                          {p.category} · {formatDate(p.publishedAt)} · {p.readingTime}
                        </p>
                        <h3 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-fg transition-colors duration-200 group-hover:text-accent md:text-2xl">{p.title}</h3>
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">{p.excerpt}</p>
                      </div>
                      <span className="hidden size-10 items-center justify-center rounded-full border border-white/10 text-muted transition-all duration-300 ease-expo group-hover:border-accent group-hover:bg-accent group-hover:text-accent-ink md:inline-flex">
                        <ArrowUpRight className="size-4" />
                      </span>
                    </Link>
                  </RevealItem>
                ))}
              </RevealGroup>
            </>
          )}
        </div>
      </section>
    </>
  )
}

function JournalSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading posts" className="animate-pulse">
      <div className="grid overflow-hidden rounded-2xl bg-white/[0.03] md:grid-cols-2">
        <div className="aspect-[16/10] bg-white/[0.04] md:aspect-auto md:min-h-80" />
        <div className="flex flex-col gap-4 p-10">
          <div className="h-3 w-40 rounded bg-white/[0.06]" />
          <div className="h-8 w-4/5 rounded bg-white/[0.08]" />
          <div className="h-4 w-full rounded bg-white/[0.05]" />
        </div>
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="mt-6 h-24 rounded-xl bg-white/[0.03]" />
      ))}
    </div>
  )
}
