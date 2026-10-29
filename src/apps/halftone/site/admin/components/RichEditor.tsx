import Image from '@tiptap/extension-image'
import { CharacterCount, Placeholder } from '@tiptap/extensions'
import type { EditorView } from '@tiptap/pm/view'
import { EditorContent, useEditor, useEditorState, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold, Code, Heading2, Heading3, ImagePlus, Italic, Link2, List, ListOrdered, Minus, Pilcrow, Quote, Redo2,
  Loader2, SquareCode, Strikethrough, Underline, Undo2, Unlink, Upload, type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react'
import { isSafeHref, isSafeImageSrc, readingTimeFromDoc, sanitizeDoc, type RichDoc } from '../../../shared/richtext'
import { cn } from '../../lib/cn'
import { imageSrc } from '../../lib/unsplash'
import { ACCEPTED_IMAGES, imageFrom, uploadImage } from '../upload'
import { useToast } from './Toast'

// Unsplash ids are stored as-is and resolved at render time; show them resolved in the editor too.
const StudioImage = Image.extend({
  renderHTML({ HTMLAttributes }) {
    const src = typeof HTMLAttributes.src === 'string' && !HTMLAttributes.src.startsWith('http') ? imageSrc(HTMLAttributes.src, 1600) : HTMLAttributes.src
    return ['img', { ...HTMLAttributes, src }]
  },
})

/**
 * WYSIWYG editor for journal posts (TipTap). Content is styled with the same
 * `.rich` rules as the public article. Markdown shortcuts work while typing:
 * "## " heading, "> " quote, "- " list, "1. " numbered list, ``` code block.
 */
export function RichEditor({ value, onChange }: { value: RichDoc; onChange: (doc: RichDoc) => void }) {
  const toast = useToast()
  const [uploading, setUploading] = useState(0)

  /** Upload a pasted/dropped image, then insert it at `pos` (or the cursor). */
  const insertUpload = (view: EditorView, file: File, pos?: number) => {
    setUploading((n) => n + 1)
    uploadImage(file)
      .then((src) => {
        const node = view.state.schema.nodes.image.create({ src, alt: '' })
        const at = pos ?? view.state.selection.from
        view.dispatch(view.state.tr.insert(Math.min(at, view.state.doc.content.size), node))
        toast('Image added')
      })
      .catch((e) => toast(e instanceof Error ? e.message : 'Upload failed', 'error'))
      .finally(() => setUploading((n) => n - 1))
  }

  const editor = useEditor({
    // The CSP blocks injected <style> tags; the editor's base styles are in halftone.css (.ProseMirror).
    injectCSS: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: 'https',
          protocols: ['http', 'https', 'mailto'],
          isAllowedUri: (url) => isSafeHref(url),
        },
      }),
      StudioImage.configure({ inline: false }),
      Placeholder.configure({ placeholder: 'Start writing… Type ## for a heading, > for a quote, - for a list. Paste or drop images to upload.' }),
      CharacterCount,
    ],
    content: value,
    editorProps: {
      attributes: { class: 'rich', 'aria-label': 'Post body', role: 'textbox', 'aria-multiline': 'true' },
      handlePaste: (view, event) => {
        const file = imageFrom(event.clipboardData?.files)
        if (!file) return false
        event.preventDefault()
        insertUpload(view, file)
        return true
      },
      handleDrop: (view, event, _slice, moved) => {
        const file = !moved ? imageFrom(event.dataTransfer?.files) : undefined
        if (!file) return false
        event.preventDefault()
        insertUpload(view, file, view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos)
        return true
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON() as RichDoc),
    immediatelyRender: true,
  })

  return (
    <div className="rich-editor overflow-hidden rounded-xl border border-white/10 bg-field focus-within:border-accent/50 focus-within:ring-4 focus-within:ring-accent/10">
      {editor && <Toolbar editor={editor} />}
      <div className="relative">
        {uploading > 0 && (
          <span role="status" className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-elevated/95 px-2.5 py-1 text-xs text-fg shadow-card">
            <Loader2 className="size-3 animate-spin" /> Uploading image…
          </span>
        )}
        <EditorContent editor={editor} className="px-5 py-6 md:px-8 md:py-8" />
      </div>
      {editor && <Footer editor={editor} />}
    </div>
  )
}

/* ── Toolbar ─────────────────────────────────────────────── */

type Panel = 'link' | 'image' | null

function Toolbar({ editor }: { editor: Editor }) {
  const [panel, setPanel] = useState<Panel>(null)
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      paragraph: e.isActive('paragraph'),
      h2: e.isActive('heading', { level: 2 }),
      h3: e.isActive('heading', { level: 3 }),
      bold: e.isActive('bold'),
      italic: e.isActive('italic'),
      underline: e.isActive('underline'),
      strike: e.isActive('strike'),
      code: e.isActive('code'),
      link: e.isActive('link'),
      bullet: e.isActive('bulletList'),
      ordered: e.isActive('orderedList'),
      quote: e.isActive('blockquote'),
      codeBlock: e.isActive('codeBlock'),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  })
  const chain = () => editor.chain().focus()

  return (
    <div className="sticky top-0 z-10 border-b border-white/[0.07] bg-elevated/95 backdrop-blur">
      <div role="toolbar" aria-label="Formatting" className="no-scrollbar flex items-center gap-0.5 overflow-x-auto px-2 py-1.5">
        <Tool icon={Pilcrow} label="Paragraph" active={s.paragraph} onClick={() => chain().setParagraph().run()} />
        <Tool icon={Heading2} label="Heading" shortcut="⌘⌥2" active={s.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()} />
        <Tool icon={Heading3} label="Subheading" shortcut="⌘⌥3" active={s.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()} />
        <Divider />
        <Tool icon={Bold} label="Bold" shortcut="⌘B" active={s.bold} onClick={() => chain().toggleBold().run()} />
        <Tool icon={Italic} label="Italic" shortcut="⌘I" active={s.italic} onClick={() => chain().toggleItalic().run()} />
        <Tool icon={Underline} label="Underline" shortcut="⌘U" active={s.underline} onClick={() => chain().toggleUnderline().run()} />
        <Tool icon={Strikethrough} label="Strikethrough" active={s.strike} onClick={() => chain().toggleStrike().run()} />
        <Tool icon={Code} label="Inline code" shortcut="⌘E" active={s.code} onClick={() => chain().toggleCode().run()} />
        <Tool icon={Link2} label="Link" shortcut="⌘K" active={s.link || panel === 'link'} onClick={() => setPanel((p) => (p === 'link' ? null : 'link'))} />
        {s.link && <Tool icon={Unlink} label="Remove link" onClick={() => chain().extendMarkRange('link').unsetLink().run()} />}
        <Divider />
        <Tool icon={List} label="Bulleted list" active={s.bullet} onClick={() => chain().toggleBulletList().run()} />
        <Tool icon={ListOrdered} label="Numbered list" active={s.ordered} onClick={() => chain().toggleOrderedList().run()} />
        <Tool icon={Quote} label="Pull quote" active={s.quote} onClick={() => chain().toggleBlockquote().run()} />
        <Tool icon={SquareCode} label="Code block" active={s.codeBlock} onClick={() => chain().toggleCodeBlock().run()} />
        <Tool icon={Minus} label="Divider" onClick={() => chain().setHorizontalRule().run()} />
        <Tool icon={ImagePlus} label="Image" active={panel === 'image'} onClick={() => setPanel((p) => (p === 'image' ? null : 'image'))} />
        <div className="ml-auto flex shrink-0 items-center gap-0.5 pl-2">
          <Tool icon={Undo2} label="Undo" shortcut="⌘Z" disabled={!s.canUndo} onClick={() => chain().undo().run()} />
          <Tool icon={Redo2} label="Redo" shortcut="⇧⌘Z" disabled={!s.canRedo} onClick={() => chain().redo().run()} />
        </div>
      </div>
      {panel === 'link' && <LinkPanel editor={editor} onDone={() => setPanel(null)} />}
      {panel === 'image' && <ImagePanel editor={editor} onDone={() => setPanel(null)} />}
      <LinkShortcut editor={editor} onOpen={() => setPanel('link')} />
    </div>
  )
}

/** ⌘K / Ctrl+K opens the link panel. */
function LinkShortcut({ editor, onOpen }: { editor: Editor; onOpen: () => void }) {
  useEffect(() => {
    const dom = editor.view.dom
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onOpen()
      }
    }
    dom.addEventListener('keydown', onKey)
    return () => dom.removeEventListener('keydown', onKey)
  }, [editor, onOpen])
  return null
}

function Tool({ icon: Icon, label, shortcut, active, disabled, onClick }: { icon: LucideIcon; label: string; shortcut?: string; active?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // keep the editor selection
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={shortcut ? `${label} (${shortcut})` : label}
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center rounded-md transition-colors duration-150 disabled:opacity-30',
        active ? 'bg-accent/15 text-accent' : 'text-muted hover:bg-white/[0.06] hover:text-fg',
      )}
    >
      <Icon className="size-4" strokeWidth={1.75} />
    </button>
  )
}

const Divider = () => <span aria-hidden className="mx-1 h-5 w-px shrink-0 bg-white/10" />

/**
 * Not a <form>: the editor lives inside the post's form, and nested forms are
 * invalid HTML (Enter would submit — and reload — the page). Enter/Escape are
 * handled here instead.
 */
function InlinePanel({ onSubmit, onCancel, label, children, error }: { onSubmit: () => void; onCancel: () => void; label: string; children: ReactNode; error?: string | null }) {
  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      onSubmit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }
  return (
    <div role="group" aria-label={label} onKeyDown={onKeyDown} className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] px-3 py-2">
      {children}
      {error && <p role="alert" className="w-full text-xs text-alert">{error}</p>}
    </div>
  )
}

const panelInput =
  'h-8 min-w-0 flex-1 rounded-md border border-white/10 bg-base px-2.5 font-mono text-[12px] text-fg placeholder:text-muted/60 focus:border-accent/60 focus:outline-none'
const panelButton = 'h-8 rounded-md bg-accent px-3 text-[13px] font-medium text-accent-ink hover:bg-accent-bright'

function LinkPanel({ editor, onDone }: { editor: Editor; onDone: () => void }) {
  const current = (editor.getAttributes('link').href as string | undefined) ?? ''
  const [href, setHref] = useState(current)
  const [error, setError] = useState<string | null>(null)
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => ref.current?.focus(), [])

  const submit = () => {
    let url = href.trim()
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return onDone()
    }
    if (!/^(https?:|mailto:|\/)/i.test(url)) url = url.includes('@') && !url.includes('/') ? `mailto:${url}` : `https://${url}`
    if (!isSafeHref(url)) return setError('Use an https://, mailto: or /relative link.')
    const { empty } = editor.state.selection
    if (empty && !editor.isActive('link')) {
      // No selection: insert the URL itself as linked text.
      editor.chain().focus().insertContent({ type: 'text', text: url, marks: [{ type: 'link', attrs: { href: url } }] }).run()
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    }
    onDone()
  }

  return (
    <InlinePanel onSubmit={submit} onCancel={onDone} label="Link" error={error}>
      <Link2 className="size-4 text-muted" />
      <input
        ref={ref}
        value={href}
        onChange={(e) => {
          setHref(e.target.value)
          setError(null)
        }}
        placeholder="https://example.com — leave empty to remove"
        aria-label="Link URL"
        className={panelInput}
      />
      <button type="button" onClick={submit} className={panelButton}>
        {current ? 'Update' : 'Add link'}
      </button>
    </InlinePanel>
  )
}

function ImagePanel({ editor, onDone }: { editor: Editor; onDone: () => void }) {
  const [src, setSrc] = useState('')
  const [alt, setAlt] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  const file = useRef<HTMLInputElement>(null)
  useEffect(() => ref.current?.focus(), [])

  const upload = async (f?: File) => {
    if (!f) return
    setBusy(true)
    setError(null)
    try {
      const url = await uploadImage(f)
      editor.chain().focus().setImage({ src: url, alt: alt.trim() }).run()
      onDone()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  const submit = () => {
    const value = src.trim()
    if (!isSafeImageSrc(value)) return setError('Upload a file, or paste an https:// image URL or an Unsplash id like photo-1555066931-4365d14bab8c.')
    editor.chain().focus().setImage({ src: value, alt: alt.trim() }).run()
    onDone()
  }

  return (
    <InlinePanel onSubmit={submit} onCancel={onDone} label="Insert image" error={error}>
      <button
        type="button"
        onClick={() => file.current?.click()}
        disabled={busy}
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2.5 text-[12px] text-fg hover:bg-white/[0.08] disabled:opacity-60"
      >
        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Upload className="size-3.5" />} {busy ? 'Uploading…' : 'Upload'}
      </button>
      <input
        ref={file}
        type="file"
        accept={ACCEPTED_IMAGES}
        className="hidden"
        onChange={(e) => {
          upload(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      <span className="text-[11px] text-muted">or</span>
      <input
        ref={ref}
        value={src}
        onChange={(e) => {
          setSrc(e.target.value)
          setError(null)
        }}
        placeholder="paste an image URL or Unsplash id"
        aria-label="Image URL"
        className={panelInput}
      />
      <input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Alt text (describe the image)" aria-label="Alt text" className={cn(panelInput, 'font-sans')} />
      <button type="button" onClick={submit} className={panelButton}>
        Insert
      </button>
    </InlinePanel>
  )
}

function Footer({ editor }: { editor: Editor }) {
  const { words, reading } = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      words: e.storage.characterCount.words() as number,
      reading: readingTimeFromDoc(sanitizeDoc(e.getJSON())),
    }),
  })
  return (
    <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2 font-mono text-[11px] text-muted">
      <span>
        {words.toLocaleString()} words · {reading} read
      </span>
      <span className="hidden sm:block">⌘B bold · ⌘I italic · ⌘K link</span>
    </div>
  )
}
