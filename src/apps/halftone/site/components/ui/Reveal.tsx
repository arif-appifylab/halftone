import { motion, type HTMLMotionProps } from 'framer-motion'
import { fadeUp, inView, stagger } from '../../lib/motion'

/** Fades children up once they enter the viewport. */
export function Reveal({ delay = 0, ...props }: HTMLMotionProps<'div'> & { delay?: number }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={inView}
      variants={{
        hidden: fadeUp.hidden,
        show: { ...(fadeUp.show as object), transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1], delay } },
      }}
      {...props}
    />
  )
}

/** Parent that staggers any `RevealItem` children by 80ms. */
export function RevealGroup({ gap = 0.08, delay = 0, ...props }: HTMLMotionProps<'div'> & { gap?: number; delay?: number }) {
  return <motion.div initial="hidden" whileInView="show" viewport={inView} variants={stagger(gap, delay)} {...props} />
}

export function RevealItem(props: HTMLMotionProps<'div'>) {
  return <motion.div variants={fadeUp} {...props} />
}
