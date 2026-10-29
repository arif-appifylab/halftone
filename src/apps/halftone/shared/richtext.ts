import { parseBlocks, type Block } from './markdown'

/**
 * Journal bodies are stored as a TipTap / ProseMirror JSON document.
 * Everything that reaches the database or the public renderer goes through
 * `sanitizeDoc`, which keeps only the node and mark types below and drops
 * unsafe link / image URLs. The public site renders the JSON into React
 * elements — never raw HTML — so there is no injection surface.
 */

export type RichMark = { type: string; attrs?: Record<string, unknown> }
export type RichNode = {
  type: string
  attrs?: Record<string, unknown>
  content?: RichNode[]
  text?: string
  marks?: RichMark[]
}
export type RichDoc = { type: 'doc'; content: RichNode[] }

export const NODE_TYPES = [
  'paragraph', 'heading', 'blockquote', 'bulletList', 'orderedList', 'listItem',
  'codeBlock', 'horizontalRule', 'hardBreak', 'image', 'text',
] as const
export const MARK_TYPES = ['bold', 'italic', 'underline', 'strike', 'code', 'link'] as const

const nodeSet = new Set<string>(NODE_TYPES)
const markSet = new Set<string>(MARK_TYPES)

export const emptyDoc = (): RichDoc => ({ type: 'doc', content: [{ type: 'paragraph' }] })

/** http(s), mailto, or a same-site path. Nothing else (no javascript:, data:, …). */
export function isSafeHref(href: unknown): href is string {
  if (typeof href !== 'string' || href.length > 2000) return false
  if (href.startsWith('/') && !href.startsWith('//')) return true
  return /^(https?:\/\/|mailto:)/i.test(href)
}

/** An https URL, a bare Unsplash id ("photo-…"), or an image uploaded in the admin ("/__platform/files/<id>/<name>"). */
export function isSafeImageSrc(src: unknown): src is string {
  if (typeof src !== 'string' || src.length > 2000) return false
  return /^https:\/\//i.test(src) || /^photo-[\w-]+$/.test(src) || /^\/__platform\/files\/[\w-]{1,32}\/[\w.%-]{1,200}$/.test(src)
}

const str = (v: unknown, max = 500) => (typeof v === 'string' ? v.slice(0, max) : undefined)

function cleanMarks(marks: unknown): RichMark[] | undefined {
  if (!Array.isArray(marks)) return undefined
  const out: RichMark[] = []
  for (const m of marks) {
    if (!m || typeof m !== 'object' || !markSet.has((m as RichMark).type)) continue
    const type = (m as RichMark).type
    if (type === 'link') {
      const href = (m as RichMark).attrs?.href
      if (!isSafeHref(href)) continue
      out.push({ type, attrs: { href } })
    } else {
      out.push({ type })
    }
  }
  return out.length ? out : undefined
}

function cleanNode(node: unknown, depth: number): RichNode | null {
  if (!node || typeof node !== 'object' || depth > 12) return null
  const n = node as RichNode
  if (!nodeSet.has(n.type)) return null

  if (n.type === 'text') {
    if (typeof n.text !== 'string' || !n.text) return null
    const marks = cleanMarks(n.marks)
    return marks ? { type: 'text', text: n.text.slice(0, 20_000), marks } : { type: 'text', text: n.text.slice(0, 20_000) }
  }

  const out: RichNode = { type: n.type }
  if (n.type === 'heading') {
    const level = Number(n.attrs?.level)
    out.attrs = { level: level === 3 ? 3 : 2 }
  } else if (n.type === 'orderedList') {
    const start = Number(n.attrs?.start)
    if (Number.isInteger(start) && start > 1) out.attrs = { start: Math.min(start, 9999) }
  } else if (n.type === 'codeBlock') {
    const language = str(n.attrs?.language, 40)
    if (language && /^[\w+-]+$/.test(language)) out.attrs = { language }
  } else if (n.type === 'image') {
    const src = n.attrs?.src
    if (!isSafeImageSrc(src)) return null
    out.attrs = { src, alt: str(n.attrs?.alt, 300) ?? '' }
    const title = str(n.attrs?.title, 300)
    if (title) out.attrs.title = title
    return out
  }

  if (n.type === 'horizontalRule' || n.type === 'hardBreak') return out

  if (Array.isArray(n.content)) {
    const children = n.content.map((c) => cleanNode(c, depth + 1)).filter((c): c is RichNode => !!c)
    if (children.length) out.content = children
  }
  return out
}

/** Accepts anything; returns a well-formed doc containing only allowed content. */
export function sanitizeDoc(input: unknown): RichDoc {
  const content = (input && typeof input === 'object' && Array.isArray((input as RichDoc).content) ? (input as RichDoc).content : [])
    .map((c) => cleanNode(c, 0))
    .filter((c): c is RichNode => !!c)
    .slice(0, 2000)
  return { type: 'doc', content: content.length ? content : [{ type: 'paragraph' }] }
}

/** Plain text, blocks separated by newlines — for reading time and search. */
export function docText(doc: RichDoc): string {
  const walk = (n: RichNode): string =>
    n.type === 'text' ? (n.text ?? '') : n.type === 'hardBreak' ? '\n' : (n.content ?? []).map(walk).join(n.type === 'doc' || n.type.endsWith('List') ? '\n' : '')
  return doc.content.map(walk).join('\n')
}

export function readingTimeFromDoc(doc: RichDoc) {
  const words = docText(doc).trim().split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.ceil(words / 220))} min`
}

const textNode = (text: string): RichNode[] => (text ? [{ type: 'text', text }] : [])

export function blocksToDoc(blocks: Block[]): RichDoc {
  return {
    type: 'doc',
    content: blocks.map((b) =>
      b.type === 'h2'
        ? { type: 'heading', attrs: { level: 2 }, content: textNode(b.text) }
        : b.type === 'quote'
          ? { type: 'blockquote', content: [{ type: 'paragraph', content: textNode(b.text) }] }
          : { type: 'paragraph', content: textNode(b.text) },
    ),
  }
}

/** Upgrades a legacy lightweight-markdown body to a rich doc. */
export const markdownToDoc = (md: string) => blocksToDoc(parseBlocks(md))
