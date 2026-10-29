import type { ReactNode } from 'react'
import { isSafeHref, isSafeImageSrc, type RichDoc, type RichMark, type RichNode } from '../../../shared/richtext'
import { cn } from '../../lib/cn'
import { imageSrc } from '../../lib/unsplash'

/**
 * Renders a journal document into React elements. No HTML strings, no
 * dangerouslySetInnerHTML — unknown nodes are skipped and URLs re-checked.
 */
export function RichContent({ doc, className }: { doc: RichDoc; className?: string }) {
  return <div className={cn('rich', className)}>{doc.content.map((n, i) => renderNode(n, i))}</div>
}

function renderMarks(text: string, marks: RichMark[] = [], key: number): ReactNode {
  return marks.reduce<ReactNode>((child, mark) => {
    switch (mark.type) {
      case 'bold':
        return <strong>{child}</strong>
      case 'italic':
        return <em>{child}</em>
      case 'underline':
        return <u>{child}</u>
      case 'strike':
        return <s>{child}</s>
      case 'code':
        return <code>{child}</code>
      case 'link': {
        const href = mark.attrs?.href
        if (!isSafeHref(href)) return child
        const external = !href.startsWith('/')
        return (
          <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer nofollow' } : {})}>
            {child}
          </a>
        )
      }
      default:
        return child
    }
  }, <span key={key}>{text}</span>)
}

function children(node: RichNode) {
  return node.content?.map((c, i) => renderNode(c, i))
}

function renderNode(node: RichNode, key: number): ReactNode {
  switch (node.type) {
    case 'text':
      return <span key={key}>{renderMarks(node.text ?? '', node.marks, key)}</span>
    case 'paragraph':
      return <p key={key}>{children(node)}</p>
    case 'heading':
      return node.attrs?.level === 3 ? <h3 key={key}>{children(node)}</h3> : <h2 key={key}>{children(node)}</h2>
    case 'blockquote':
      return <blockquote key={key}>{children(node)}</blockquote>
    case 'bulletList':
      return <ul key={key}>{children(node)}</ul>
    case 'orderedList':
      return (
        <ol key={key} start={typeof node.attrs?.start === 'number' ? node.attrs.start : undefined}>
          {children(node)}
        </ol>
      )
    case 'listItem':
      return <li key={key}>{children(node)}</li>
    case 'codeBlock':
      return (
        <pre key={key}>
          <code>{node.content?.map((c) => c.text ?? '').join('')}</code>
        </pre>
      )
    case 'horizontalRule':
      return <hr key={key} />
    case 'hardBreak':
      return <br key={key} />
    case 'image': {
      const src = node.attrs?.src
      if (!isSafeImageSrc(src)) return null
      const alt = typeof node.attrs?.alt === 'string' ? node.attrs.alt : ''
      return <img key={key} src={imageSrc(src, 1600)} alt={alt} loading="lazy" decoding="async" />
    }
    default:
      return null
  }
}
