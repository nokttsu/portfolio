import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useLang } from '../i18n.jsx'

const COUNT_S = 2 // the counter always gets at least this long

/**
 * Intro in the Obys Experiment Space manner: two black halves cover the screen,
 * a hairline across the middle fills left to right while a counter runs 0 → 100,
 * then the halves split apart and reveal the hero.
 */
export default function Preloader() {
  const root = useRef(null)
  const numRef = useRef(null)
  const [done, setDone] = useState(false)
  const { content } = useLang()

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

    tl.from('.preloader__row, .preloader__line', { autoAlpha: 0, duration: 0.4, ease: 'power2.out' })
      .to(
        '.preloader__fill',
        { width: '100%', duration: COUNT_S, ease: 'power1.inOut' },
        0
      )
      .to(
        counter,
        {
          v: 100,
          duration: COUNT_S,
          ease: 'power1.inOut',
          onUpdate: () => {
            const v = Math.round(counter.v)
            num.textContent = v < 100 ? String(v).padStart(2, '0') : '100'
          },
        },
        0
      )
      // the line and labels leave first, then the halves part
      .to('.preloader__row, .preloader__line', { autoAlpha: 0, duration: 0.25, ease: 'power2.in' })
      .to('.preloader__half--top', { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, '<0.05')
      .to('.preloader__half--bottom', { yPercent: 100, duration: 0.9, ease: 'expo.inOut' }, '<')

    return () => tl.kill()
  }, [])

  if (done) return null

  return (
    <div className="preloader" ref={root}>
      <div className="preloader__half preloader__half--top" />
      <div className="preloader__half preloader__half--bottom" />

      <div className="preloader__row">
        <span className="preloader__label">{content.site.name}</span>
        <span className="preloader__percent" ref={numRef}>00</span>
      </div>
      <div className="preloader__line">
        <span className="preloader__fill" />
      </div>
    </div>
  )
}
