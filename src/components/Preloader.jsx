import { useEffect, useRef, useState, useMemo } from 'react'
import gsap from 'gsap'
import { Flip } from 'gsap/Flip'
import { asset } from '../asset.js'
import { useLang } from '../i18n.jsx'

gsap.registerPlugin(Flip)

const COUNT_S = 2 // the counter always gets at least this long
const CELLS = 12 // 4 x 3 bento

/**
 * Intro screen: a bento wall of case covers with the hero poster in the middle,
 * a counter running 0 → 100 from the left edge to the right, and a Flip finish
 * where the middle tile expands to full screen and becomes the hero.
 */
export default function Preloader() {
  const root = useRef(null)
  const numRef = useRef(null)
  const centerRef = useRef(null)
  const [done, setDone] = useState(false)
  const { content } = useLang()

  // random covers around a fixed centre (the hero poster)
  const tiles = useMemo(() => {
    const covers = (content.cases || []).map((c) => c.cover).filter(Boolean)
    const pool = covers.length ? [...covers].sort(() => Math.random() - 0.5) : ['/img/covers/cover1.png']
    return Array.from({ length: CELLS }, (_, i) => pool[i % pool.length])
  }, [content.cases])

  useEffect(() => {
    const el = root.current
    const num = numRef.current
    const center = centerRef.current
    if (!el || !num || !center) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDone(true)
      return
    }

    const others = gsap.utils.toArray('.pre-tile:not(.pre-tile--center)', el)
    const counter = { v: 0 }
    const tl = gsap.timeline({ onComplete: () => setDone(true) })

    // wall builds up
    tl.from(others, {
      scale: 0.86,
      autoAlpha: 0,
      duration: 0.7,
      ease: 'power2.out',
      stagger: { each: 0.045, from: 'center' },
    })
      .from(center, { scale: 0.9, autoAlpha: 0, duration: 0.7, ease: 'power2.out' }, 0.1)
      // slow drift so the wall never sits still
      .to(others, { y: () => gsap.utils.random(-14, 14), duration: COUNT_S, ease: 'sine.inOut' }, 0)

    // counter: 0 at the left edge, 100 landing at the right
    tl.to(
      counter,
      {
        v: 100,
        duration: COUNT_S,
        ease: 'power1.inOut',
        onUpdate: () => {
          const v = Math.round(counter.v)
          num.textContent = String(v)
          gsap.set(num, { xPercent: -v, left: `${v}%` })
        },
      },
      0
    )

    // finish: the wall zooms through while the centre tile takes over the screen
    tl.add(() => {
      // drop any leftover intro transform so the tile lands exactly on the viewport
      gsap.set(center, { scale: 1, x: 0, y: 0 })
      const state = Flip.getState(center)
      center.classList.add('is-final')
      Flip.from(state, {
        duration: 1,
        ease: 'expoScale(1, 5)',
        absolute: true,
      })
    })
      .to(others, { scale: 2.4, autoAlpha: 0, duration: 0.9, ease: 'expoScale(1, 5)' }, '<')
      .to('.preloader__track', { autoAlpha: 0, duration: 0.3 }, '<')
      // hand the frame over to the real hero underneath
      .to(el, { autoAlpha: 0, duration: 0.25 }, '>-0.15')

    return () => tl.kill()
  }, [])

  if (done) return null

  return (
    <div className="preloader" ref={root}>
      <div className="pre-grid">
        {tiles.map((src, i) => {
          const isCenter = i === 5 // centre cell of the bento
          return (
            <div
              className={`pre-tile${isCenter ? ' pre-tile--center' : ''}`}
              key={i}
              ref={isCenter ? centerRef : undefined}
            >
              <img src={asset(isCenter ? content.hero.poster : src)} alt="" />
            </div>
          )
        })}
      </div>

      <div className="preloader__track">
        <span className="preloader__num" ref={numRef}>0</span>
      </div>
    </div>
  )
}
