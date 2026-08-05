import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

const MIN_MS = 2000 // always give the counter room to read as an intro

/**
 * Intro screen: a counter runs 0 → 100 while travelling from the left edge to
 * the right, then the panel leaves and hands over to the hero title reveal.
 * Also covers the hero video load.
 */
export default function Preloader() {
  const root = useRef(null)
  const numRef = useRef(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    const el = root.current
    const num = numRef.current
    if (!el || !num) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDone(true)
      return
    }

    const counter = { v: 0 }
    const tl = gsap.timeline({ onComplete: () => setDone(true) })

    tl.to(counter, {
      v: 100,
      duration: MIN_MS / 1000,
      ease: 'power1.inOut',
      onUpdate: () => {
        const v = Math.round(counter.v)
        num.textContent = String(v)
        // 0 sits at the left edge, 100 lands at the right edge
        gsap.set(num, { xPercent: -v, left: `${v}%` })
      },
    })
      .to(el, { yPercent: -100, duration: 0.8, ease: 'power3.inOut' }, '>-0.05')

    return () => tl.kill()
  }, [])

  if (done) return null

  return (
    <div className="preloader" ref={root}>
      <div className="preloader__track">
        <span className="preloader__num" ref={numRef}>0</span>
      </div>
    </div>
  )
}
