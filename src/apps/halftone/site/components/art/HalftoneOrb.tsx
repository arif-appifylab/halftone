import { useReducedMotion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { cn } from '../../lib/cn'

const LIME = [200, 245, 60]
const VIOLET = [142, 124, 255]
const BUCKETS = 10

const mix = (t: number) =>
  `rgb(${LIME.map((c, i) => Math.round(VIOLET[i] + (c - VIOLET[i]) * t)).join(' ')})`
const PALETTE = Array.from({ length: BUCKETS }, (_, i) => mix(i / (BUCKETS - 1)))

/**
 * A lit sphere rendered as a true halftone screen: each dot's radius is the
 * surface brightness at that point. The light orbits slowly and leans toward
 * the cursor. Dots are bucketed by color so each frame is ~10 fills, not 6,000.
 */
export function HalftoneOrb({ className, spacing = 9 }: { className?: string; spacing?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0
    let h = 0
    let raf = 0
    let visible = true
    let t = 0
    let last = performance.now()
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const rect = canvas.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      const cx = w / 2
      const cy = h / 2
      const R = Math.min(w, h) * 0.4
      const s = spacing

      // Light direction: slow orbit + cursor lean.
      let lx = Math.cos(t * 0.25) * 0.55 + mouse.x * 0.8
      let ly = -0.55 + Math.sin(t * 0.25) * 0.25 + mouse.y * 0.8
      let lz = 0.75
      const ll = Math.hypot(lx, ly, lz)
      lx /= ll
      ly /= ll
      lz /= ll

      const paths: Path2D[] = Array.from({ length: BUCKETS }, () => new Path2D())
      const cols = Math.ceil(w / s) + 1
      const rows = Math.ceil(h / s) + 1
      const ox = (w - (cols - 1) * s) / 2
      const oy = (h - (rows - 1) * s) / 2

      for (let j = 0; j < rows; j++) {
        // offset alternate rows — a classic 45° screen
        const shift = j % 2 ? s / 2 : 0
        for (let i = 0; i < cols; i++) {
          const x = ox + i * s + shift
          const y = oy + j * s
          const dx = (x - cx) / R
          const dy = (y - cy) / R
          const d2 = dx * dx + dy * dy
          let v: number
          let hue: number
          if (d2 < 1) {
            const nz = Math.sqrt(1 - d2)
            const lambert = Math.max(0, dx * lx + dy * ly + nz * lz)
            const rim = Math.pow(1 - nz, 3) * 0.35
            v = Math.min(1, Math.pow(lambert, 1.4) * 0.85 + rim + 0.16)
            hue = Math.min(1, lambert * 1.15)
          } else {
            // soft halo outside the sphere
            const d = Math.sqrt(d2)
            v = Math.exp(-(d - 1) * 7) * 0.22
            hue = 0
          }
          const r = (s / 2) * v
          if (r < 0.35) continue
          const b = Math.min(BUCKETS - 1, Math.floor(hue * BUCKETS))
          paths[b].moveTo(x + r, y)
          paths[b].arc(x, y, r, 0, Math.PI * 2)
        }
      }
      for (let b = 0; b < BUCKETS; b++) {
        ctx.fillStyle = PALETTE[b]
        ctx.fill(paths[b])
      }
    }

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      t += dt
      mouse.x += (mouse.tx - mouse.x) * 0.06
      mouse.y += (mouse.ty - mouse.y) * 0.06
      if (visible) draw()
      raf = requestAnimationFrame(loop)
    }

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.tx = Math.max(-1, Math.min(1, (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 1.2)))
      mouse.ty = Math.max(-1, Math.min(1, (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 1.2)))
    }

    resize()
    const ro = new ResizeObserver(() => {
      resize()
      draw()
    })
    ro.observe(canvas)
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting))
    io.observe(canvas)

    if (reduce) {
      t = 2
      draw()
    } else {
      window.addEventListener('pointermove', onMove)
      raf = requestAnimationFrame(loop)
    }

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      window.removeEventListener('pointermove', onMove)
    }
  }, [reduce, spacing])

  return <canvas ref={canvasRef} aria-hidden className={cn('block size-full', className)} />
}
