import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useRef } from 'react'
import type { Rich } from '../../content/types'
import { parseRich, tokenClass } from '../ui/RichText'

interface Props {
  text: Rich
  className?: string
  accentClass?: string
  /** Opacity of words not yet reached by the scroll. */
  dim?: number
  /** Optional externally driven progress (0–1); otherwise tracks the element through the viewport. */
  progress?: MotionValue<number>
}

/** Words brighten one after another, tied directly to scroll position. */
export function ScrollWords({ text, className, accentClass, dim = 0.16, progress }: Props) {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] })
  const p = progress ?? scrollYProgress

  const words = parseRich(text).flatMap((t) =>
    t.text
      .split(/(\s+)/)
      .filter((w) => w.length > 0)
      .map((w) => ({ word: w, cls: tokenClass(t, accentClass) })),
  )
  const count = words.filter((w) => w.word.trim()).length
  let index = 0

  return (
    <p ref={ref} className={className}>
      {words.map((w, i) => {
        if (!w.word.trim()) return w.word
        const start = index / count
        const end = (index + 1) / count
        index++
        return <Word key={i} progress={p} range={[start, end]} className={w.cls} dim={dim}>{w.word}</Word>
      })}
    </p>
  )
}

function Word({
  children,
  progress,
  range,
  className,
  dim,
}: {
  children: string
  progress: MotionValue<number>
  range: [number, number]
  className?: string
  dim: number
}) {
  const opacity = useTransform(progress, range, [dim, 1])
  return (
    <motion.span style={{ opacity }} className={className}>
      {children}
    </motion.span>
  )
}
