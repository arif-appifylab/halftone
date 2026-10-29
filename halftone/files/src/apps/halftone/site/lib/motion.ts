import type { Variants } from 'framer-motion'

/** Expo-out — the only easing curve in the system. */
export const EASE = [0.16, 1, 0.3, 1] as const

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: EASE } },
}

export const stagger = (gap = 0.08, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } },
})

/** Shared viewport config: trigger at ~18% visibility, animate once. */
export const inView = { once: true, amount: 0.18 } as const
