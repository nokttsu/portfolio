import { useState, useEffect, useMemo } from 'react'
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

export default function Hero() {
  const { content, tr } = useLang()
  const hero = content.hero
  const stamp = useMoscowStamp()

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
