import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ExternalLink, Loader2, Trash2 } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { slugify } from '../../../shared/markdown'
import { emptyDoc } from '../../../shared/richtext'
import { POST_CATEGORIES, type Post, type PostCategory } from '../../../shared/types'
import { PostCover } from '../../components/art/PostCover'
import { Button } from '../../components/ui/Button'
import { Field, Input, Select, Textarea } from '../../components/ui/Field'
import { api } from '../../lib/api'
import { ImageDropzone } from '../components/ImageDropzone'
import { RichEditor } from '../components/RichEditor'
import { useToast } from '../components/Toast'
import { ConfirmButton, PageHeader, Panel, Spinner } from '../components/ui'
import { useMe } from '../hooks'

type Draft = Pick<Post, 'title' | 'slug' | 'excerpt' | 'category' | 'author' | 'palette' | 'cover' | 'body' | 'published'>

const blank = (author: string): Draft => ({
  title: '',
  slug: '',
  excerpt: '',
  category: 'Notes',
  author,
  palette: ['#c8f53c', '#8e7cff'],
  cover: '',
  body: emptyDoc(),
  published: false,
})

export function PostEditor() {
  const { id } = useParams()
  const isNew = !id
  const { data: me } = useMe()
  const { data: post, isPending } = useQuery({
    queryKey: ['admin-posts', id],
    queryFn: () => api<Post>(`admin/posts/${id}`),
    enabled: !isNew,
  })

  if (!isNew && isPending) return <Spinner className="mx-auto mt-24 size-5" />
  return <Editor key={post?.id ?? 'new'} initial={post ?? blank(me?.name ?? '')} id={post?.id} />
}

function Editor({ initial, id }: { initial: Draft; id?: number }) {
  const [draft, setDraft] = useState<Draft>(initial)
  const [slugTouched, setSlugTouched] = useState(!!id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }))
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial)

  // Slug follows the title until edited by hand.
  useEffect(() => {
    if (!slugTouched) setDraft((d) => ({ ...d, slug: slugify(d.title) }))
  }, [draft.title, slugTouched])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-posts'] })
    queryClient.invalidateQueries({ queryKey: ['posts'] })
    queryClient.invalidateQueries({ queryKey: ['stats'] })
  }
  const save = useMutation({
    mutationFn: (body: Draft) => api<Post>(id ? `admin/posts/${id}` : 'admin/posts', { method: id ? 'PUT' : 'POST', body }),
    onSuccess: (p) => {
      invalidate()
      queryClient.setQueryData(['admin-posts', String(p.id)], p)
      toast(
        p.published
          ? id && initial.published ? 'Changes published' : 'Published'
          : id && initial.published ? 'Unpublished — saved as draft' : 'Draft saved',
      )
      if (!id) navigate(`/admin/journal/${p.id}`, { replace: true })
    },
    onError: (e) => toast(e.message, 'error'),
  })
  const remove = useMutation({
    mutationFn: () => api(`admin/posts/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidate()
      toast('Post deleted')
      navigate('/admin/journal', { replace: true })
    },
    onError: (e) => toast(e.message, 'error'),
  })

  const submit = (e: FormEvent, published = draft.published) => {
    e.preventDefault()
    const next = { ...draft, published }
    setDraft(next)
    save.mutate(next)
  }

  return (
    <form onSubmit={(e) => submit(e)}>
      <Link to="/admin/journal" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft className="size-3.5" /> All posts
      </Link>
      <PageHeader
        title={id ? 'Edit post' : 'New post'}
        description={dirty ? 'Unsaved changes' : id ? 'All changes saved' : undefined}
        actions={
          <>
            {id && initial.published && (
              <a href={`/journal/${initial.slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-sm text-muted hover:bg-white/[0.05] hover:text-fg">
                <ExternalLink className="size-4" /> View
              </a>
            )}
            {draft.published ? (
              <>
                <Button type="button" variant="secondary" disabled={save.isPending} onClick={(e) => submit(e, false)}>
                  Unpublish
                </Button>
                <Button type="submit" disabled={save.isPending || !dirty}>
                  {save.isPending && <Loader2 className="size-4 animate-spin" />} Update
                </Button>
              </>
            ) : (
              <>
                <Button type="submit" variant="secondary" disabled={save.isPending}>
                  Save draft
                </Button>
                <Button type="button" disabled={save.isPending} onClick={(e) => submit(e, true)}>
                  {save.isPending && <Loader2 className="size-4 animate-spin" />} Publish
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Panel className="flex flex-col gap-5 p-5 md:p-6">
          <Field label="Title">
            <Input value={draft.title} onChange={(e) => set('title', e.target.value)} required placeholder="A headline worth reading" className="h-12 text-lg font-medium" />
          </Field>
          <Field label="Excerpt" hint={`${draft.excerpt.length}/400`}>
            <Textarea value={draft.excerpt} onChange={(e) => set('excerpt', e.target.value)} maxLength={400} className="min-h-20" placeholder="One or two sentences for listings and social cards." />
          </Field>

          <div>
            <p className="mb-2 text-[13px] font-medium text-fg/90">Body</p>
            <RichEditor value={draft.body} onChange={(body) => set('body', body)} />
          </div>
        </Panel>

        <div className="flex flex-col gap-4">
          <Panel className="flex flex-col gap-4 p-5">
            <Field label="Slug" hint="/journal/…">
              <Input
                value={draft.slug}
                onChange={(e) => {
                  setSlugTouched(true)
                  set('slug', slugify(e.target.value))
                }}
                required
                className="font-mono text-[13px]"
              />
            </Field>
            <Field label="Category">
              <Select value={draft.category} onChange={(e) => set('category', e.target.value as PostCategory)}>
                {POST_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </Select>
            </Field>
            <Field label="Author">
              <Input value={draft.author} onChange={(e) => set('author', e.target.value)} required />
            </Field>
          </Panel>

          <Panel className="flex flex-col gap-4 p-5">
            <ImageDropzone
              preview={<PostCover post={draft} compact className="aspect-[16/10]" />}
              hasImage={!!draft.cover}
              onUploaded={(url) => set('cover', url)}
              onClear={() => set('cover', '')}
            />
            <Field label="Cover image" hint="upload, URL or Unsplash id">
              <Input value={draft.cover} onChange={(e) => set('cover', e.target.value.trim())} placeholder="photo-1619410283995-…" className="font-mono text-[12px]" />
            </Field>
            <div>
              <p className="mb-2 text-[13px] font-medium text-fg/90">Fallback palette</p>
              <div className="flex gap-2">
                {[0, 1].map((i) => (
                  <label key={i} className="flex flex-1 items-center gap-2 rounded-lg border border-white/10 bg-field px-2 py-1.5">
                    <input
                      type="color"
                      value={draft.palette[i]}
                      onChange={(e) => set('palette', (i === 0 ? [e.target.value, draft.palette[1]] : [draft.palette[0], e.target.value]) as [string, string])}
                      className="size-6 cursor-pointer rounded border-0 bg-transparent p-0"
                      aria-label={`Palette color ${i + 1}`}
                    />
                    <span className="font-mono text-[11px] uppercase text-muted">{draft.palette[i]}</span>
                  </label>
                ))}
              </div>
            </div>
          </Panel>

          {id && (
            <Panel className="p-5">
              <p className="text-[13px] font-medium text-fg/90">Danger zone</p>
              <p className="mb-3 mt-1 text-xs text-muted">Deleting removes the post from the site permanently.</p>
              <ConfirmButton onConfirm={() => remove.mutate()} disabled={remove.isPending} className="-ml-3">
                <Trash2 className="size-3.5" /> Delete post
              </ConfirmButton>
            </Panel>
          )}
        </div>
      </div>
    </form>
  )
}
