import { motion } from 'motion/react'
import type { Rich } from '../content/types'
import { parseRich, tokenClass } from '../components/ui/RichText'
import { easeOutExpo, useSlideStep, timed } from './Build'

interface Props {
  text: Rich
  /** Build step at which the words light up. */
  at?: number
  className?: string
  accentClass?: string
  /** Opacity of words before they light up. 0 hides them entirely. */
  dim?: number
  /** Seconds between words. */
  stagger?: number
  delay?: number
}

/** Words brighten one after another when the slide reaches the given build. */
export function Words({ text, at = 0, className, accentClass, dim = 0.15, stagger = 0.045, delay = 0 }: Props) {
  const { step, settled } = useSlideStep()
  const lit = step >= at
  const instant = at <= settled

  const words = parseRich(text).flatMap((t) =>
    t.text
      .split(/(\s+)/)
      .filter((w) => w.length > 0)
      .map((w) => ({ word: w, cls: tokenClass(t, accentClass) })),
  )
  let i = 0

  return (
    <p className={className}>
      {words.map((w, k) => {
        if (!w.word.trim()) return w.word
        const n = i++
        return (
          <motion.span
            key={k}
            className={w.cls}
            initial={instant && lit ? false : { opacity: dim }}
            animate={{ opacity: lit ? 1 : dim }}
            transition={
              instant ? { duration: 0 } : timed({ duration: 0.5, delay: lit ? (at === 0 ? 0.35 : 0.05) + delay + n * stagger : 0, ease: easeOutExpo })
            }
          >
            {w.word}
          </motion.span>
        )
      })}
    </p>
  )
}
