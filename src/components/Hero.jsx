import gsap from 'gsap'
import { asset } from '../asset.js'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import MaskedHeading from './MaskedHeading.jsx'
import { useLang } from '../i18n.jsx'

gsap.registerPlugin(ScrollToPlugin)

export default function Hero() {
  const { t } = useLang()

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
        src={asset('/img/hero.mp4')}
        poster={asset('/img/hero.png')}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />

      <div className="hero__inner" data-anim="hero-inner">
        <MaskedHeading as="h1" className="hero__title" text={t('heroTitle')} onLoad />

        <p className="hero__intro" data-anim="intro">{t('heroIntro')}</p>

        <nav className="hero__nav" data-anim="hero-nav">
          <a href="#experience" onClick={(e) => scrollTo(e, '#experience')}>{t('navExperience')}</a>
          <a href="#works" className="hero__nav-works" onClick={(e) => scrollTo(e, '#works')}>
            {t('navWorks')}<span className="hero__nav-count">(15)</span>
          </a>
          <a href="#about" onClick={(e) => scrollTo(e, '#about')}>{t('navAbout')}</a>
        </nav>
      </div>
    </section>
  )
}
