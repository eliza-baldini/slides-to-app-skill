import { motion, useScroll, useTransform } from 'motion/react'
import { useRef } from 'react'
import type { Chapter } from '../../content/navigation'

/** A typographic interlude that opens each chapter, scrubbed by scroll. */
export function ChapterIntro({ chapter, inverted = false }: { chapter: Chapter; inverted?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const numberY = useTransform(scrollYProgress, [0, 1], ['30%', '-30%'])
  const titleX = useTransform(scrollYProgress, [0.1, 0.5], ['6%', '0%'])
  const titleOpacity = useTransform(scrollYProgress, [0.12, 0.42, 0.78, 0.95], [0, 1, 1, 0])
  const lineScale = useTransform(scrollYProgress, [0.2, 0.55], [0, 1])

  return (
    <section
      id={chapter.id}
      ref={ref}
      data-surface={inverted ? 'dark' : undefined}
      className={`relative flex min-h-[78vh] items-center overflow-hidden ${inverted ? 'rounded-t-[48px] bg-navy-950 text-white' : ''}`}
    >
      <div className="mx-auto w-full max-w-[1240px] px-6 sm:px-10">
        <motion.span
          aria-hidden
          style={{ y: numberY }}
          className={`display pointer-events-none absolute top-1/2 right-[4vw] -translate-y-1/2 text-[clamp(10rem,30vw,28rem)] leading-none select-none ${
            inverted ? 'text-white/[0.04]' : 'text-royal/[0.05]'
          }`}
        >
          {chapter.index}
        </motion.span>
        <motion.div style={{ opacity: titleOpacity, x: titleX }} className="relative">
          <p className={`eyebrow mb-6 ${inverted ? 'text-cyan' : 'text-royal'}`}>Chapter {chapter.index}</p>
          <h2 className="display text-[clamp(3.2rem,9vw,8.5rem)]">{chapter.title}</h2>
          <motion.div
            style={{ scaleX: lineScale }}
            className={`mt-10 h-px w-full max-w-[640px] origin-left ${inverted ? 'bg-white/25' : 'bg-navy-900/15'}`}
          />
          <ul className={`mt-6 flex flex-wrap gap-x-8 gap-y-2 text-[14px] ${inverted ? 'text-white/55' : 'text-ink-soft'}`}>
            {chapter.sections.map((s) => (
              <li key={s.id}>{s.navLabel}</li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  )
}
