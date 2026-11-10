import Lenis from 'lenis'
import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react'

type ScrollTo = (target: string | number, opts?: { offset?: number; immediate?: boolean }) => void

const ScrollContext = createContext<ScrollTo>(() => {})

/** Inertial smooth scrolling (disabled when the user prefers reduced motion). */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ lerp: 0.18, wheelMultiplier: 1 })
    lenisRef.current = lenis
    let frame = 0
    const raf = (time: number) => {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    }
    frame = requestAnimationFrame(raf)
    return () => {
      cancelAnimationFrame(frame)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  const scrollTo: ScrollTo = (target, opts) => {
    const el = typeof target === 'string' ? document.getElementById(target) : null
    if (typeof target === 'string' && !el) return
    const dest = el ?? (target as number)
    if (lenisRef.current) {
      lenisRef.current.scrollTo(dest, { offset: opts?.offset ?? 0, immediate: opts?.immediate, duration: 1.6 })
    } else {
      const top = el ? el.getBoundingClientRect().top + window.scrollY + (opts?.offset ?? 0) : (target as number)
      window.scrollTo({ top, behavior: opts?.immediate ? 'auto' : 'smooth' })
    }
    if (typeof target === 'string') history.replaceState(null, '', `#${target}`)
  }

  return <ScrollContext.Provider value={scrollTo}>{children}</ScrollContext.Provider>
}

export const useScrollTo = () => useContext(ScrollContext)
