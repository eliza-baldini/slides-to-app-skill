import { motion } from 'motion/react'
import { meta } from '../content/navigation'
import { easeOutExpo, useSlideStep } from '../deck/Build'
import { TableauMark } from '../components/ui/TableauMark'

const bars = [
  { h: 0.62, color: 'bg-cyan-soft', delay: 0.5 },
  { h: 0.86, color: 'bg-cyan', delay: 0.62 },
  { h: 0.5, color: 'bg-cyan-soft', delay: 0.74 },
]

const sparkles = [
  { x: '88%', y: '12%', s: 34, d: 0 },
  { x: '6%', y: '48%', s: 16, d: 0.8 },
  { x: '96%', y: '34%', s: 14, d: 1.6 },
  { x: '14%', y: '78%', s: 20, d: 2.2 },
]

/** Slide 1 · Title. */
export function Opening() {
  return (
    // The final word is set in cyan; match whatever the source title slide highlights.
    <TitleSlide words={`${meta.title} ${meta.subtitle}`.split(' ')} cue />
  )
}

/** Section divider slides: the title treatment with the section name. */
export function Divider({ title }: { title: string }) {
  return <TitleSlide words={title.split(' ')} size="divider" />
}

function TitleSlide({ words, cue, size = 'title' }: { words: string[]; cue?: boolean; size?: 'title' | 'divider' }) {
  const { settled } = useSlideStep()
  const instant = settled >= 0
  const t = (delay: number, duration = 1.1) => (instant ? { duration: 0 } : { duration, delay, ease: easeOutExpo })

  return (
    <div className="relative h-full text-white">
      {/* oversized so the glow continues into the letterbox instead of ending at the canvas edge */}
      <div aria-hidden className="pointer-events-none absolute -inset-x-[480px] -inset-y-[320px]">
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_80%_0%,#0b4bf0_0%,transparent_55%),radial-gradient(90%_70%_at_0%_100%,#0016a0_0%,transparent_60%)]" />
        <div className="absolute -bottom-[34%] left-1/2 h-[70%] w-[130%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(closest-side,#00b3ff_0%,rgba(0,179,255,0.35)_40%,transparent_75%)] blur-2xl" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] [mask-image:radial-gradient(70%_60%_at_70%_40%,black,transparent)] bg-[size:72px_72px]" />
      </div>

      <div className="relative grid h-full grid-cols-[1.15fr_0.85fr] items-center gap-12 px-28">
        <div>
          <motion.div initial={instant ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={t(0.1, 1)} className="mb-14 flex items-center gap-4">
            <TableauMark size={34} className="text-white" />
            <span className="text-[20px] font-semibold tracking-[0.32em] lowercase">tableau</span>
            <span className="text-[15px] text-white/50">from Salesforce</span>
          </motion.div>
          <h1 className={`display leading-[0.98] ${size === 'title' ? 'max-w-[13ch] text-[104px]' : 'max-w-[14ch] text-[96px]'}`}>
            {words.map((word, i) => (
              <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                <motion.span
                  className={`inline-block ${cue && i === words.length - 1 ? 'text-cyan' : ''}`}
                  initial={instant ? false : { y: '105%' }}
                  animate={{ y: 0 }}
                  transition={t(0.35 + i * 0.08, 1.2)}
                >
                  {word}&nbsp;
                </motion.span>
              </span>
            ))}
          </h1>
          <motion.p initial={instant ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={t(0.9, 1.2)} className="mt-12 text-[24px] text-white/70">
            {meta.date}
          </motion.p>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-[560px]" aria-hidden>
          <div className="absolute inset-x-[12%] top-[10%] bottom-[14%] flex items-end gap-[5%]">
            {bars.map((b, i) => (
              <motion.div
                key={i}
                className={`${b.color} flex-1 origin-bottom rounded-[22px] shadow-[0_30px_60px_-20px_rgba(0,20,120,0.6)]`}
                style={{ height: `${b.h * 100}%` }}
                initial={instant ? false : { scaleY: 0, opacity: 0 }}
                animate={{ scaleY: 1, opacity: 1 }}
                transition={t(b.delay, 1.4)}
              />
            ))}
          </div>
          <motion.div
            className="absolute right-[6%] bottom-[6%] grid size-[24%] place-items-center rounded-full bg-white shadow-[0_20px_50px_-12px_rgba(0,20,120,0.6)]"
            initial={instant ? false : { scale: 0, rotate: -40 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={instant ? { duration: 0 } : { type: 'spring', stiffness: 160, damping: 16, delay: 1.2 }}
          >
            <TableauMark size={68} className="text-royal" />
          </motion.div>
          {sparkles.map((s, i) => (
            <motion.svg
              key={i}
              width={s.s}
              height={s.s}
              viewBox="0 0 24 24"
              className="absolute text-cyan"
              style={{ left: s.x, top: s.y }}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.1, 0.85], rotate: [0, 45, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: s.d, ease: 'easeInOut' }}
            >
              <path d="M12 0C12.8 7 17 11.2 24 12 17 12.8 12.8 17 12 24 11.2 17 7 12.8 0 12 7 11.2 11.2 7 12 0Z" fill="currentColor" />
            </motion.svg>
          ))}
        </div>
      </div>

      {cue && (
      <motion.p
        initial={instant ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={t(1.6)}
        className="absolute bottom-12 left-1/2 flex -translate-x-1/2 items-center gap-3 text-[13px] font-medium tracking-[0.2em] text-white/60 uppercase"
      >
        Press
        <kbd className="rounded-md bg-white/10 px-2 py-1 font-sans text-[13px] tracking-normal text-white ring-1 ring-white/20">→</kbd>
        to begin
      </motion.p>
      )}
    </div>
  )
}
