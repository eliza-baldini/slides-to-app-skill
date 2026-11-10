import { motion, type Variants } from 'motion/react'
import type { ReactNode } from 'react'

export const easeOutExpo = [0.16, 1, 0.3, 1] as const

interface RevealProps {
  children: ReactNode
  className?: string
  delay?: number
  /** Distance travelled on entry, in px. */
  y?: number
  x?: number
  duration?: number
  /** Fraction of the element that must be visible before it animates. */
  amount?: number
  blur?: boolean
}

/** Fades and lifts content into place the first time it scrolls into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  x = 0,
  duration = 1,
  amount = 0.35,
  blur = false,
}: RevealProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, x, filter: blur ? 'blur(10px)' : 'blur(0px)' }}
      whileInView={{ opacity: 1, y: 0, x: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount }}
      transition={{ duration, delay, ease: easeOutExpo }}
    >
      {children}
    </motion.div>
  )
}

const container = (stagger: number, delay: number): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
})

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.9, ease: easeOutExpo } },
}

interface StaggerProps {
  children: ReactNode
  className?: string
  stagger?: number
  delay?: number
  amount?: number
}

/** Staggers its StaggerItem children as the group enters view. */
export function Stagger({ children, className, stagger = 0.08, delay = 0, amount = 0.25 }: StaggerProps) {
  return (
    <motion.div
      className={className}
      variants={container(stagger, delay)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
    >
      {children}
    </motion.div>
  )
}

export function StaggerItem({
  children,
  className,
  variants = itemVariants,
}: {
  children: ReactNode
  className?: string
  variants?: Variants
}) {
  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  )
}
