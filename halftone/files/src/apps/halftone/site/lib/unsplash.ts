/**
 * Free stock imagery from Unsplash (unsplash.com/license — free for commercial use).
 * Accepts a bare Unsplash id ("photo-…"), any full image URL, or an image uploaded in the admin ("/__platform/files/…").
 */
const isPlain = (src: string) => src.startsWith('/') || (/^https?:\/\//.test(src) && !src.includes('images.unsplash.com'))
const WIDTHS = [480, 800, 1200, 1600, 2000]

export function imageSrc(src: string, width = 1200) {
  if (isPlain(src)) return src
  const base = src.startsWith('http') ? src.split('?')[0] : `https://images.unsplash.com/${src}`
  return `${base}?auto=format&fit=crop&q=72&w=${width}`
}

export function imageSrcSet(src: string) {
  if (isPlain(src)) return undefined
  return WIDTHS.map((w) => `${imageSrc(src, w)} ${w}w`).join(', ')
}
