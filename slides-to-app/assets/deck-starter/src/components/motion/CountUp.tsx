import { animate, useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

/**
 * Counts up to the numeric part of a formatted figure ("$200M+", "~$400M", "425,000")
 * while preserving its prefix, suffix and thousands separators.
 */
export function CountUp({
  value,
  className,
  duration = 1.6,
  play,
  instant,
}: {
  value: string
  className?: string
  duration?: number
  /** When provided, counting starts when this becomes true (e.g. a slide build) instead of on scroll-into-view. */
  play?: boolean
  /** Show the final value immediately (e.g. a slide revisited fully built). */
  instant?: boolean
}) {
  const match = value.match(/^([^\d]*)([\d,.]+)(.*)$/)
  const ref = useRef<HTMLSpanElement>(null)
  const seen = useInView(ref, { once: true, amount: 0.6 })
  const inView = play ?? seen
  const reduce = useReducedMotion()
  const [display, setDisplay] = useState(match ? `${match[1]}0${match[3]}` : value)

  useEffect(() => {
    if (!match) return
    if (!inView) {
      setDisplay(`${match[1]}0${match[3]}`)
      return
    }
    const [, prefix, num, suffix] = match
    const target = Number(num.replace(/,/g, ''))
    const decimals = num.includes('.') ? num.split('.')[1].length : 0
    const grouped = num.includes(',')
    const format = (n: number) =>
      `${prefix}${n.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping: grouped,
      })}${suffix}`
    if (reduce || instant) {
      setDisplay(value)
      return
    }
    const controls = animate(0, target, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(format(v)),
      onComplete: () => setDisplay(value),
    })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView])

  return (
    <span ref={ref} className={`tabular ${className ?? ''}`} aria-label={value}>
      {display}
    </span>
  )
}
