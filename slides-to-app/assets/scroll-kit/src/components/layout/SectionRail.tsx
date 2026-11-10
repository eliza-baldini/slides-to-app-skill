import { motion } from 'motion/react'
import { allSections } from '../../content/navigation'
import { useDarkSurfaceAt } from '../../hooks/useSurfaceAt'
import { useScrollTo } from '../motion/SmoothScroll'

const railPoint = () => ({ x: window.innerWidth - 24, y: window.innerHeight / 2 })

/** Fixed dot navigation on the right edge, one dot per section. */
export function SectionRail({ active }: { active: string }) {
  const scrollTo = useScrollTo()
  const dark = useDarkSurfaceAt(railPoint)

  return (
    <nav
      aria-label="Sections"
      className="fixed top-1/2 right-5 z-40 hidden -translate-y-1/2 flex-col items-end gap-2.5 lg:flex"
    >
      {allSections.map((s) => {
        const isActive = s.id === active
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => scrollTo(s.id)}
            className="group relative flex h-4 items-center justify-end"
            aria-label={s.navLabel}
            aria-current={isActive ? 'true' : undefined}
          >
            <span
              className={`pointer-events-none absolute right-6 rounded-md px-2.5 py-1 text-[11px] font-medium whitespace-nowrap opacity-0 shadow-lg transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100 translate-x-1 ${
                dark ? 'bg-white text-navy-900' : 'bg-navy-900 text-white'
              }`}
            >
              {s.navLabel}
            </span>
            <motion.span
              className="block rounded-full"
              animate={{
                height: isActive ? 22 : 6,
                width: 6,
                backgroundColor: isActive
                  ? dark ? '#00b3ff' : '#022ac0'
                  : dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,30,91,0.2)',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          </button>
        )
      })}
    </nav>
  )
}
