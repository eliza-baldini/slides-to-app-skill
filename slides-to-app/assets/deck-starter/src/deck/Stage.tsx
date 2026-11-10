import { AnimatePresence, motion } from 'motion/react'
import { useLayoutEffect, useRef, useState, type RefObject } from 'react'
import { SlideStepContext, easeOutExpo, timed } from './Build'
import { useDeck } from './DeckContext'
import { CANVAS_H, CANVAS_W, slides, surfaceBg, type SlideDef } from './slides'

/** Fits the fixed 1600×900 slide canvas into the space below the top bar. */
function useFitScale(ref: RefObject<HTMLDivElement | null>) {
  const [scale, setScale] = useState(1)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => {
      const pad = window.innerWidth < 768 ? 12 : 32
      const s = Math.min((el.clientWidth - pad * 2) / CANVAS_W, (el.clientHeight - pad * 2) / CANVAS_H)
      setScale(Math.max(0.1, s))
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return scale
}

export function Stage() {
  const { index, step, direction, arrivedFromAfter, setStep } = useDeck()
  const ref = useRef<HTMLDivElement>(null)
  const scale = useFitScale(ref)
  const slide = slides[index]

  return (
    <main
      ref={ref}
      className={`relative flex-1 overflow-hidden transition-colors duration-700 ${slide.surface === 'paper' ? '' : 'grain'}`}
      style={{ background: surfaceBg[slide.surface] }}
      aria-live="polite"
    >
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <SlideView
          key={slide.group ?? slide.id}
          slide={slide}
          step={step}
          arrivalStep={arrivedFromAfter ? step : -1}
          direction={direction}
          scale={scale}
          goToStep={setStep}
        />
      </AnimatePresence>
    </main>
  )
}

const variants = {
  enter: (d: number) => ({ opacity: 0, x: d * 90, filter: 'blur(10px)' }),
  center: { opacity: 1, x: 0, filter: 'blur(0px)' },
  exit: (d: number) => ({ opacity: 0, x: d * -90, filter: 'blur(10px)' }),
}

function SlideView({
  slide,
  step,
  arrivalStep,
  direction,
  scale,
  goToStep,
}: {
  slide: SlideDef
  step: number
  arrivalStep: number
  direction: number
  scale: number
  goToStep: (step: number) => void
}) {
  // Builds reached before arrival show instantly; stepping back lowers that mark so they replay.
  const [settled, setSettled] = useState(arrivalStep)
  if (step < settled) setSettled(step)

  const { Component, props } = slide
  return (
    <motion.div
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={timed({ duration: 0.7, ease: easeOutExpo })}
      className="absolute inset-0"
    >
      <div
        className="absolute top-1/2 left-1/2"
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          transform: `translate(-50%, -50%) scale(${scale})`,
          transformOrigin: 'center',
        }}
        role="group"
        aria-roledescription="slide"
        aria-label={`${slide.number}. ${slide.title}`}
      >
        <SlideStepContext.Provider value={{ step, settled: Math.min(settled, step), goToStep }}>
          <Component {...props} />
        </SlideStepContext.Provider>
      </div>
    </motion.div>
  )
}
