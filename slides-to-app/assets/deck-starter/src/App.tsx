import { useEffect, useRef, type TouchEvent } from 'react'
import { DeckProvider, useDeck } from './deck/DeckContext'
import { NavBar } from './deck/NavBar'
import { Overview } from './deck/Overview'
import { Stage } from './deck/Stage'
import { slides } from './deck/slides'

export default function App() {
  return (
    <DeckProvider>
      <Deck />
    </DeckProvider>
  )
}

function Deck() {
  useDeckKeys()
  const swipe = useSwipe()
  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-paper" {...swipe}>
      <NavBar />
      <Stage />
      <Overview />
    </div>
  )
}

/** → / Space / PageDown next slide · ← / PageUp previous · Home / End · O overview · Esc. */
function useDeckKeys() {
  const { next, prev, goTo, overview, setOverview } = useDeck()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target instanceof HTMLElement ? e.target : null
      if (target?.closest('input, textarea, select, button, [contenteditable="true"]') && e.key === ' ') return
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
        case 'PageDown':
        case ' ':
          e.preventDefault()
          if (!overview) next()
          break
        case 'ArrowLeft':
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault()
          if (!overview) prev()
          break
        case 'Home':
          goTo(0)
          break
        case 'End':
          goTo(slides.length - 1)
          break
        case 'o':
        case 'O':
          setOverview(!overview)
          break
        case 'Escape':
          setOverview(false)
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, goTo, overview, setOverview])
}

/** Horizontal swipe to change slides on touch screens. */
function useSwipe() {
  const { next, prev, overview } = useDeck()
  const start = useRef<{ x: number; y: number } | null>(null)
  return {
    onTouchStart: (e: TouchEvent) => {
      const t = e.touches[0]
      start.current = { x: t.clientX, y: t.clientY }
    },
    onTouchEnd: (e: TouchEvent) => {
      if (!start.current || overview) return
      const t = e.changedTouches[0]
      const dx = t.clientX - start.current.x
      const dy = t.clientY - start.current.y
      start.current = null
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) (dx < 0 ? next : prev)()
    },
  }
}
