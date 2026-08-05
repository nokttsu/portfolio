import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useLang } from '../i18n.jsx'

/**
 * Short intro mask: the name sits on a full-screen panel that slides up and
 * hands over to the hero title reveal. It also covers the hero video load.
 */
export default function Preloader() {
  const root = useRef(null)
  const [done, setDone] = useState(false)
  const { content } = useLang()

  useEffect(() => {
    const el = root.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDone(true)
      return
    }

    const tl = gsap.timeline({ onComplete: () => setDone(true) })
    tl.from('.preloader__name', { yPercent: 110, duration: 0.7, ease: 'power3.out' })
      .to('.preloader__name', { yPercent: -110, duration: 0.5, ease: 'power3.in' }, 0.75)
      // the panel leaves just as the hero title starts rising
      .to(el, { yPercent: -100, duration: 0.8, ease: 'power3.inOut' }, 0.9)

    return () => tl.kill()
  }, [])

  if (done) return null

  return (
    <div className="preloader" ref={root}>
      <div className="preloader__mask">
        <span className="preloader__name">{content.site.name}</span>
      </div>
    </div>
  )
}
