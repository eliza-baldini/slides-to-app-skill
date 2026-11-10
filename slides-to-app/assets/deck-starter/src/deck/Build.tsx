import { motion, type Transition } from 'motion/react'
import { createContext, useContext, type CSSProperties, type ReactNode } from 'react'

export const easeOutExpo = [0.16, 1, 0.3, 1] as const

/** Multiplier on every animation's duration and delay: above 1 is slower, below 1 faster. */
export const MOTION_SCALE = 1

/** Applies MOTION_SCALE to a transition's duration and delay. */
export function timed(t: Transition): Transition {
  const { duration, delay } = t as { duration?: number; delay?: number }
  return {
    ...t,
    ...(typeof duration === 'number' ? { duration: duration * MOTION_SCALE } : {}),
    ...(typeof delay === 'number' ? { delay: delay * MOTION_SCALE } : {}),
  }
}

interface SlideStepState {
  /** Current build step on this slide (0 = initial state). */
  step: number
  /**
   * Builds at or below this step appear without animating. Set when a slide is entered
   * from a later one (so it arrives fully built) and lowered as the presenter steps back.
   */
  settled: number
  /** Jump to a build on this slide (e.g. clicking a step in a diagram). */
  goToStep: (step: number) => void
}

export const SlideStepContext = createContext<SlideStepState>({ step: 0, settled: -1, goToStep: () => {} })

/** Current build step and whether builds should appear instantly. */
export const useSlideStep = () => useContext(SlideStepContext)

/** True once the slide has reached build `at`. */
export function useBuilt(at: number) {
  return useSlideStep().step >= at
}

interface BuildProps {
  /** Build step at which this content appears. 0 = on arrival. */
  at?: number
  children: ReactNode
  className?: string
  style?: CSSProperties
  /** Extra delay after the build is triggered, for staggering siblings. */
  delay?: number
  y?: number
  x?: number
  scale?: number
  blur?: boolean
  duration?: number
}

/**
 * Content that fades and moves into place when the slide reaches its build step.
 * Stepping back hides it again; entering a slide from later shows it instantly.
 */
export function Build({
  at = 0,
  children,
  className,
  style,
  delay = 0,
  y = 24,
  x = 0,
  scale = 1,
  blur = false,
  duration = 0.8,
}: BuildProps) {
  const { step, settled } = useSlideStep()
  const shown = step >= at
  const instant = at <= settled
  const transition: Transition = instant
    ? { duration: 0 }
    : timed(shown ? { duration, delay: (at === 0 ? 0.25 : 0.05) + delay, ease: easeOutExpo } : { duration: 0.35, ease: 'easeOut' })

  return (
    <motion.div
      className={className}
      style={style}
      initial={instant && shown ? false : { opacity: 0, y, x, scale, filter: blur ? 'blur(8px)' : 'blur(0px)' }}
      animate={
        shown
          ? { opacity: 1, y: 0, x: 0, scale: 1, filter: 'blur(0px)' }
          : { opacity: 0, y, x, scale, filter: blur ? 'blur(8px)' : 'blur(0px)' }
      }
      transition={transition}
    >
      {children}
    </motion.div>
  )
}

/** Transition helper for custom animated elements inside a slide. */
export function useBuildTransition(at: number, delay = 0, duration = 0.9): Transition {
  const { step, settled } = useSlideStep()
  if (at <= settled) return { duration: 0 }
  return timed(step >= at ? { duration, delay: (at === 0 ? 0.25 : 0.05) + delay, ease: easeOutExpo } : { duration: 0.3 })
}
