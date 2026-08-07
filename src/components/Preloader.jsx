import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useLang } from '../i18n.jsx'
import { markIntroOpen } from '../introGate.js'

const MIN_S = 0.6 // the counter still needs long enough to be read, not a flash
const BAIL_S = 10 // never hold the page hostage to a stalled asset

/**
 * Intro in the Obys Experiment Space manner: two black halves cover the screen,
 * a hairline across the middle fills left to right while a counter climbs,
 * then the halves split apart and reveal the hero.
 *
 * The counter reports real loading: fonts, the hero video and the page's own
 * `load` event each carry a share of it, so the number means something.
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
      markIntroOpen()
      setDone(true)
      return
    }

    // ---- what we are actually waiting for ----
    const settle = (fn) => new Promise((resolve) => fn(resolve))
    const jobs = [
      document.fonts.ready,
      settle((resolve) =>
        document.readyState === 'complete'
          ? resolve()
          : window.addEventListener('load', resolve, { once: true })
      ),
    ]
    const video = document.querySelector('.hero__bg')
    if (video) {
      jobs.push(
        settle((resolve) => {
          if (video.readyState >= 3) return resolve()
          video.addEventListener('canplay', resolve, { once: true })
          video.addEventListener('error', resolve, { once: true }) // a missing file still counts
        })
      )
    }

    const progress = { shown: 0 } // what the counter displays, eased toward `real`
    let real = 0
    let finished = 0
    const render = () => {
      const v = Math.round(progress.shown * 100)
      num.textContent = v < 100 ? String(v).padStart(2, '0') : '100'
      gsap.set('.preloader__fill', { width: `${progress.shown * 100}%` })
    }
    const to = (value, duration) =>
      gsap.to(progress, { shown: value, duration, ease: 'power1.out', onUpdate: render, overwrite: 'auto' })

    let exited = false
    const exit = () => {
      if (exited) return
      exited = true
      gsap
        .timeline({ onComplete: () => setDone(true) })
        // the number lands on 100 before anything moves
        .to(progress, { shown: 1, duration: 0.35, ease: 'power2.out', onUpdate: render })
        .to('.preloader__row, .preloader__line', { autoAlpha: 0, duration: 0.25, ease: 'power2.in' })
        // the hero's own reveal starts as the curtain opens, not behind it
        .to('.preloader__half--top', { yPercent: -100, duration: 0.9, ease: 'expo.inOut', onStart: markIntroOpen }, '<0.05')
        .to('.preloader__half--bottom', { yPercent: 100, duration: 0.9, ease: 'expo.inOut' }, '<')
    }

    jobs.forEach((job) =>
      Promise.resolve(job).then(() => {
        finished += 1
        real = finished / jobs.length
        // hold just short of the end until everything is in
        to(real < 1 ? real : 0.99, 0.45)
        if (real >= 1) gsap.delayedCall(Math.max(0, MIN_S - progress.shown * MIN_S), exit)
      })
    )

    render()
    const bail = gsap.delayedCall(BAIL_S, exit)

    return () => {
      bail.kill()
      gsap.killTweensOf(progress)
    }
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
