export type Block = { type: 'p' | 'h2' | 'quote'; text: string }

/**
 * Deliberately tiny markdown dialect for journal posts:
 *   blank line → new block, "## " → heading, "> " → pull quote.
 * Output is plain text blocks — never HTML — so it's safe to render.
 */
export function parseBlocks(src: string): Block[] {
  return src
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      if (chunk.startsWith('## ')) return { type: 'h2', text: chunk.slice(3).trim() }
      if (chunk.startsWith('>')) return { type: 'quote', text: chunk.replace(/^>\s?/gm, '').trim() }
      return { type: 'p', text: chunk.replace(/\n/g, ' ') }
    })
}

export function blocksToMarkdown(blocks: Block[]) {
  return blocks.map((b) => (b.type === 'h2' ? `## ${b.text}` : b.type === 'quote' ? `> ${b.text}` : b.text)).join('\n\n')
}

/** ~220 wpm, rounded up, minimum 1. */
export function readingTime(src: string) {
  const words = src.trim().split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.ceil(words / 220))} min`
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}
