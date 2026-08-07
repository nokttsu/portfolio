import { useState, useEffect } from 'react'

/** live answer to a media query, so a component can restructure on resize */
export default function useMedia(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatches(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return matches
}

/** below this the layout switches to the mobile design */
export const PHONE = '(max-width: 767px)'
