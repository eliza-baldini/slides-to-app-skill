import { useEffect, useState } from 'react'

type Point = { x: number; y: number }

/** True when an element marked data-surface="dark" sits under the given viewport point. */
export function useDarkSurfaceAt(point: () => Point) {
  const [dark, setDark] = useState(true)
  useEffect(() => {
    let frame = 0
    const check = () => {
      frame = 0
      const at = point()
      const els = document.querySelectorAll<HTMLElement>('[data-surface="dark"]')
      let isDark = false
      els.forEach((el) => {
        const r = el.getBoundingClientRect()
        if (r.top <= at.y && r.bottom >= at.y && r.left <= at.x && r.right >= at.x) isDark = true
      })
      setDark(isDark)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check)
    }
    check()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [point])
  return dark
}
