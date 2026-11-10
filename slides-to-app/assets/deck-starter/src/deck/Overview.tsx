import { AnimatePresence, motion } from 'motion/react'
import { useDeck } from './DeckContext'
import { easeOutExpo } from './Build'
import { sectionTabs, slides, surfaceBg } from './slides'

/** Grid of every slide, grouped by deck section; click one to jump to it. */
export function Overview() {
  const { overview, setOverview, index, goTo } = useDeck()

  return (
    <AnimatePresence>
      {overview && (
        <motion.div
          key="overview"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="absolute inset-x-0 top-[67px] bottom-0 z-40 overflow-y-auto bg-paper/95 backdrop-blur-md"
          role="dialog"
          aria-label="Slide overview"
          onClick={() => setOverview(false)}
        >
          <div className="mx-auto max-w-[1280px] px-8 py-10" onClick={(e) => e.stopPropagation()}>
            {sectionTabs.map((tab, ti) => {
              const items = slides.filter((s) => s.chapter === tab.id)
              return (
                <section key={tab.id} className="mb-10 last:mb-0">
                  <h2 className="eyebrow mb-4 text-[12px] text-royal">{tab.label}</h2>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                    {items.map((s, si) => {
                      const i = slides.indexOf(s)
                      const dark = s.surface !== 'paper'
                      return (
                        <motion.button
                          key={s.id}
                          type="button"
                          onClick={() => goTo(i)}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, delay: ti * 0.05 + si * 0.03, ease: easeOutExpo }}
                          className={`group relative aspect-video overflow-hidden rounded-2xl p-5 text-left transition-shadow hover:shadow-[0_18px_40px_-16px_rgba(0,30,91,0.45)] ${
                            i === index ? 'ring-3 ring-cyan' : 'ring-1 ring-line'
                          }`}
                          style={{ background: surfaceBg[s.surface] }}
                        >
                          <span className={`text-[12px] font-semibold tabular ${dark ? 'text-white/55' : 'text-ink-faint'}`}>
                            {String(s.number).padStart(2, '0')}
                          </span>
                          <span className={`display mt-2 block text-[19px] leading-snug ${dark ? 'text-white' : 'text-ink'}`}>{s.title}</span>
                        </motion.button>
                      )
                    })}
                  </div>
                </section>
              )
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
