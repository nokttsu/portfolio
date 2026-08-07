import { useState, useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { asset } from '../asset.js'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import MaskedHeading from './MaskedHeading.jsx'
import { useLang } from '../i18n.jsx'

gsap.registerPlugin(ScrollToPlugin)

/** Where I am, in local terms: the date and time in Moscow. */
function useMoscowStamp() {
  const { lang } = useLang()
  const format = useMemo(
    () =>
      new Intl.DateTimeFormat(lang === 'ru' ? 'ru-RU' : 'en-US', {
        timeZone: 'Europe/Moscow',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    [lang]
  )
  const [stamp, setStamp] = useState(() => format.format(new Date()))

  useEffect(() => {
    const tick = () => setStamp(format.format(new Date())) // same string = no re-render
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [format])

  return stamp
}

const BLACK = '#000000'

/**
 * The strip along the bottom of a phone browser is the toolbar, and a page
 * cannot draw into it — the one thing it can do is say what colour it should
 * be. So the hero keeps that colour in step with the bottom edge of its own
 * video: the strip reads as part of the footage instead of a black band, and
 * goes back to black once the content has scrolled over the hero.
 */
function useToolbarTint(videoRef) {
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    const video = videoRef.current
    if (!meta || !video) return

    const canvas = document.createElement('canvas')
    canvas.width = 8
    canvas.height = 2
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    let last = ''
    let lastRgb = null
    const apply = (css, rgb) => {
      // only when the footage has actually moved on: Safari eases between bar
      // colours, and nudging it every half-second would keep it shimmering
      if (css === last) return
      if (rgb && lastRgb && rgb.every((v, i) => Math.abs(v - lastRgb[i]) < 8)) return
      meta.setAttribute('content', css)
      last = css
      lastRgb = rgb || null
    }

    const sample = () => {
      // past the hero — or behind an open case — the toolbar sits over the
      // black page, as it should
      if (window.scrollY > window.innerHeight * 0.6 || document.querySelector('.case-modal')) {
        return apply(BLACK)
      }
      if (!video.videoWidth) return
      // the video is object-fit: cover, so its own bottom edge is what shows
      const strip = Math.max(2, Math.round(video.videoHeight * 0.06))
      try {
        ctx.drawImage(video, 0, video.videoHeight - strip, video.videoWidth, strip, 0, 0, 8, 2)
      } catch {
        return // a tainted frame — leave whatever colour is set
      }
      const px = ctx.getImageData(0, 0, 8, 2).data
      let r = 0
      let g = 0
      let b = 0
      for (let i = 0; i < px.length; i += 4) {
        r += px[i]
        g += px[i + 1]
        b += px[i + 2]
      }
      const n = px.length / 4
      const rgb = [Math.round(r / n), Math.round(g / n), Math.round(b / n)]
      apply(`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`, rgb)
    }

    sample()
    const id = setInterval(sample, 500)
    return () => {
      clearInterval(id)
      meta.setAttribute('content', BLACK)
    }
  }, [videoRef])
}

export default function Hero() {
  const { content, tr } = useLang()
  const hero = content.hero
  const stamp = useMoscowStamp()
  const videoRef = useRef(null)
  useToolbarTint(videoRef)

  const scrollTo = (e, target) => {
    e.preventDefault()
    gsap.to(window, {
      duration: 1,
      ease: 'power3.inOut',
      scrollTo: { y: target, offsetY: 80 },
    })
  }

  return (
    <section className="hero" id="top">
      <video
        className="hero__bg"
        ref={videoRef}
        src={asset(hero.video)}
        poster={asset(hero.poster)}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />

      <div className="hero__inner" data-anim="hero-inner">
        {/* on phones the stamp is a line of its own above the title; on wider
            screens it is the last item of the nav row (only one is ever shown) */}
        <span className="hero__time">{stamp}</span>

        <MaskedHeading as="h1" className="hero__title" text={tr(hero.title)} onLoad />

        <nav className="hero__nav" data-anim="hero-nav">
          <a href="#experience" onClick={(e) => scrollTo(e, '#experience')}>{tr(hero.nav.experience)}</a>
          <a href="#works" className="hero__nav-works" onClick={(e) => scrollTo(e, '#works')}>
            {tr(hero.nav.works)}
            <span className="hero__nav-count">({content.cases.length})</span>
          </a>
          <a href="#about" onClick={(e) => scrollTo(e, '#about')}>{tr(hero.nav.about)}</a>
          <span className="hero__nav-time">{stamp}</span>
        </nav>
      </div>
    </section>
  )
}
