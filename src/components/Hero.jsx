import gsap from 'gsap'
import { asset } from '../asset.js'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import MaskedHeading from './MaskedHeading.jsx'
import { useLang } from '../i18n.jsx'

gsap.registerPlugin(ScrollToPlugin)

export default function Hero() {
  const { content, tr } = useLang()
  const hero = content.hero

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
        preload="auto"
      />

      <div className="hero__inner" data-anim="hero-inner">
        <MaskedHeading as="h1" className="hero__title" text={tr(hero.title)} onLoad />

        <p className="hero__intro" data-anim="intro">{tr(hero.intro)}</p>

        <nav className="hero__nav" data-anim="hero-nav">
          <a href="#experience" onClick={(e) => scrollTo(e, '#experience')}>{tr(hero.nav.experience)}</a>
          <a href="#works" className="hero__nav-works" onClick={(e) => scrollTo(e, '#works')}>
            {tr(hero.nav.works)}
            <span className="hero__nav-count">({content.cases.length})</span>
          </a>
          <a href="#about" onClick={(e) => scrollTo(e, '#about')}>{tr(hero.nav.about)}</a>
        </nav>
      </div>
    </section>
  )
}
