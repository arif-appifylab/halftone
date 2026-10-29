import { useCallback, useState } from 'react'
import { cn } from '../../lib/cn'
import { imageSrc, imageSrcSet } from '../../lib/unsplash'

type Tone = 'duotone' | 'natural'

/**
 * Brand treatment for stock photography so it sits in the dark UI:
 * desaturated + dimmed, a soft violet→lime color wash, a faint halftone
 * screen, and a bottom vignette. Color returns on hover inside a `group`.
 */
export function Photo({
  src,
  alt,
  className,
  imgClassName,
  sizes = '(min-width: 1024px) 50vw, 100vw',
  tone = 'duotone',
  priority = false,
  dots = true,
}: {
  src: string
  alt: string
  className?: string
  imgClassName?: string
  sizes?: string
  tone?: Tone
  priority?: boolean
  dots?: boolean
}) {
  const [loaded, setLoaded] = useState(false)
  // Cached images can finish before React wires up onLoad — check on mount too.
  const imgRef = useCallback((img: HTMLImageElement | null) => {
    if (img?.complete && img.naturalWidth > 0) setLoaded(true)
  }, [])
  // Callers may position the frame themselves (e.g. `absolute inset-0`); only default to `relative` otherwise.
  const positioned = /\b(absolute|fixed|sticky)\b/.test(className ?? '')
  return (
    <div className={cn(!positioned && 'relative', 'overflow-hidden bg-elevated', className)}>
      <img
        ref={imgRef}
        src={imageSrc(src)}
        srcSet={imageSrcSet(src)}
        sizes={sizes}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={cn(
          'absolute inset-0 size-full object-cover transition-[opacity,filter,transform] duration-700 ease-expo',
          tone === 'duotone' && 'brightness-[0.78] contrast-[1.08] grayscale group-hover:brightness-90 group-hover:grayscale-0',
          loaded ? 'opacity-100' : 'opacity-0',
          imgClassName,
        )}
      />
      {tone === 'duotone' && (
        <>
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-glow/40 via-transparent to-accent/25 mix-blend-soft-light transition-opacity duration-700 group-hover:opacity-50" />
          {dots && <span aria-hidden className="bg-halftone pointer-events-none absolute inset-0 text-black/30 [mask-image:linear-gradient(to_top,#000,transparent_70%)]" />}
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-base/70 via-transparent to-transparent" />
        </>
      )}
    </div>
  )
}
