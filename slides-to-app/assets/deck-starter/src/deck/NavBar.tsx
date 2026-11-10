import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { meta } from '../content/navigation'
import { TableauMark } from '../components/ui/TableauMark'
import { useDeck } from './DeckContext'
import { sectionTabs, slides } from './slides'

/** Presenter bar: deck sections, slide counter, Overview and prev/next. */
export function NavBar() {
  const { index, goTo, next, prev, overview, setOverview } = useDeck()
  const current = slides[index]
  const atStart = index === 0
  const atEnd = index === slides.length - 1

  return (
    <header className="relative z-50 shrink-0 bg-white">
      <div className="flex h-16 items-center gap-3 px-3 sm:gap-6 sm:px-5">
        <button type="button" onClick={() => goTo(0)} className="flex shrink-0 items-center gap-3" aria-label="Go to the first slide">
          <TableauMark size={22} className="text-royal" />
          <span className="hidden h-6 w-px bg-line xl:block" />
          <span className="hidden text-[14px] font-semibold tracking-tight whitespace-nowrap text-ink xl:inline">{meta.title}</span>
        </button>

        <nav className="hidden h-full min-w-0 flex-1 items-stretch gap-0.5 overflow-x-auto [scrollbar-width:none] lg:flex [&::-webkit-scrollbar]:hidden" aria-label="Deck sections">
          {sectionTabs.map((tab) => {
            const active = tab.id === current.chapter
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => goTo(tab.first)}
                className={`relative flex items-center px-3.5 text-[14px] font-medium whitespace-nowrap transition-colors ${
                  active ? 'text-royal' : 'text-ink-soft hover:text-ink'
                }`}
              >
                {tab.label}
                {active && (
                  <motion.span
                    layoutId="section-underline"
                    className="absolute inset-x-2 bottom-0 h-[3px] rounded-t-full bg-royal"
                    transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                  />
                )}
              </button>
            )
          })}
        </nav>
        <div className="flex-1 lg:hidden" />

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          <span className="hidden rounded-full bg-sky px-3.5 py-1.5 text-[13px] font-semibold text-ink tabular sm:inline" aria-live="polite">
            {current.number} / {slides.length}
          </span>
          <button
            type="button"
            onClick={() => setOverview(!overview)}
            className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors sm:px-4 ${
              overview ? 'bg-royal text-white' : 'bg-sky text-royal hover:bg-[#dcecfd]'
            }`}
            aria-pressed={overview}
            title="Overview (O)"
          >
            Overview
          </button>
          <RoundButton label="Previous (←)" onClick={prev} disabled={atStart}>
            <path d="M11 4L6 9l5 5" />
          </RoundButton>
          <RoundButton label="Next (→)" onClick={next} disabled={atEnd}>
            <path d="M7 4l5 5-5 5" />
          </RoundButton>
        </div>
      </div>

    </header>
  )
}

function RoundButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="grid size-10 place-items-center rounded-full bg-royal text-white shadow-[0_6px_16px_-6px_rgba(2,42,192,0.6)] transition hover:bg-royal-600 disabled:bg-sky disabled:text-ink-faint disabled:shadow-none"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  )
}
