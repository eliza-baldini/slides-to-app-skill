import { useEffect, useState } from 'react'

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = () => setMatches(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])
  return matches
}

/** Pinned, scroll-scrubbed layouts are used on wide screens; narrow screens get a simpler flow. */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)')
