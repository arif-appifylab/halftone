import { AnimatePresence, motion } from 'framer-motion'
import { Check, Copy, ExternalLink, Mail } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import { EASE } from '../../lib/motion'
import { copyText } from '../../lib/clipboard'
import { useToast } from './Toast'

export type Draft = { to: string; subject: string; body: string }

const mailtoUrl = ({ to, subject, body }: Draft) => `mailto:${to}?${new URLSearchParams({ subject, body }).toString().replace(/\+/g, '%20')}`
const gmailUrl = ({ to, subject, body }: Draft) =>
  `https://mail.google.com/mail/?${new URLSearchParams({ view: 'cm', fs: '1', to, su: subject, body }).toString().replace(/\+/g, '%20')}`

/**
 * Email a person without depending on a configured mail app:
 * open the default mail app, open Gmail compose, or copy the address.
 */
export function EmailMenu({ draft, name }: { draft: Draft; name: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const toast = useToast()

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const item = 'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-[13px] text-fg hover:bg-white/[0.06]'

  return (
    // Lift the open menu above later rows in the list.
    <div ref={ref} className={cn('relative', open && 'z-30')}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Email ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        title={`Email ${draft.to}`}
        className={cn('inline-flex size-8 items-center justify-center rounded-lg transition-colors', open ? 'bg-white/[0.08] text-fg' : 'text-muted hover:bg-white/[0.06] hover:text-fg')}
      >
        <Mail className="size-4" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: EASE }}
            className="absolute right-0 top-full z-20 mt-1.5 w-64 rounded-xl border border-white/[0.08] bg-elevated p-1.5 shadow-window"
          >
            <p className="truncate px-2.5 pb-1.5 pt-1 font-mono text-[11px] text-muted">{draft.to}</p>
            <a role="menuitem" href={mailtoUrl(draft)} onClick={() => setOpen(false)} className={item}>
              <Mail className="size-4 text-muted" /> Open in email app
            </a>
            <a role="menuitem" href={gmailUrl(draft)} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className={item}>
              <ExternalLink className="size-4 text-muted" /> Open in Gmail
            </a>
            <button
              role="menuitem"
              type="button"
              onClick={() => {
                copyText(draft.to).then(() => toast('Email address copied'))
                setOpen(false)
              }}
              className={item}
            >
              <Copy className="size-4 text-muted" /> Copy address
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** The address as text with a one-click copy. */
export function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() =>
        copyText(email).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        })
      }
      title="Copy email address"
      className="group/copy inline-flex max-w-full items-center gap-1 hover:text-fg"
    >
      <span className="truncate">{email}</span>
      {copied ? <Check className="size-3 shrink-0 text-ok" /> : <Copy className="size-3 shrink-0 opacity-0 transition-opacity group-hover/copy:opacity-100" />}
      <span className="sr-only">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  )
}
