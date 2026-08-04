import { useState, useRef, useLayoutEffect, useEffect } from 'react'
import { asset } from '../asset.js'
import gsap from 'gsap'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'
import { useLang } from '../i18n.jsx'

gsap.registerPlugin(ScrollToPlugin)

export default function Header() {
  const { content, t, toggleLang } = useLang()
  const site = content.site

  const LINKS = [
    { label: site.email, copy: true },
    ...(site.links || []),
    { label: t('langToggle'), lang: true },
  ]

  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  // back-to-top is inactive while the hero is in view (top of the page)
  const [pastHero, setPastHero] = useState(false)
  const kebabRef = useRef(null)
  const tlRef = useRef(null)

  // build the toggle timeline once (paused); play/reverse on `open`
  useLayoutEffect(() => {
    const ctx = gsap.context((self) => {
      const q = self.selector
      const tl = gsap.timeline({ paused: true })

      // "..." rotates out, "X" rotates in
      tl.to(q('.kebab__icon-dots'), { rotate: -90, scale: 0.3, autoAlpha: 0, duration: 0.2, ease: 'power3.in' }, 0)
      tl.fromTo(
        q('.kebab__icon-x'),
        { rotate: 90, scale: 0.3, autoAlpha: 0 },
        { rotate: 0, scale: 1, autoAlpha: 1, duration: 0.26, ease: 'back.out(3)' },
        0.04
      )

      // pills emerge iOS-style: out of blur with a soft spring; on reverse
      // (close) they melt back into blur.
      tl.fromTo(
        q('.kebab__pill'),
        { y: -12, scale: 0.82, autoAlpha: 0, filter: 'blur(12px)' },
        {
          y: 0,
          scale: 1,
          autoAlpha: 1,
          filter: 'blur(0px)',
          duration: 0.42,
          ease: 'back.out(1.7)',
          stagger: 0.045,
        },
        0.04
      )

      tlRef.current = tl
    }, kebabRef)
    return () => ctx.revert()
  }, [])

  useEffect(() => {
    const tl = tlRef.current
    if (!tl) return
    if (open) tl.timeScale(1).play()
    else tl.timeScale(1.6).reverse()
  }, [open])

  // close on outside click / Escape
  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (kebabRef.current && !kebabRef.current.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // track whether we've scrolled past the hero block
  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > window.innerHeight * 0.5)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToTop = () => {
    if (!pastHero) return // disabled inside the hero block
    gsap.to(window, { duration: 0.9, scrollTo: { y: 0 }, ease: 'power3.inOut' })
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(site.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch {
      /* clipboard blocked — ignore */
    }
  }

  const handleLang = () => {
    setOpen(false)
    toggleLang()
  }

  return (
    <header className="header" data-anim="header">
      {/* progressive blur backdrop (stacked masked layers) */}
      <div className="header__blur" aria-hidden="true">
        <div />
        <div />
        <div />
        <div />
      </div>

      <button
        className={`header__brand${pastHero ? ' is-active' : ''}`}
        onClick={scrollToTop}
        aria-label={t('backToTop')}
      >
        <span className="header__avatar">
          <img src={asset(site.avatar)} alt={site.name} width="40" height="40" />
          <span className="header__totop" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V6" />
              <path d="M6 12l6-6 6 6" />
            </svg>
          </span>
        </span>
        <span className="header__name">{site.name}</span>
      </button>

      <div className="header__actions">
        <div className="kebab" ref={kebabRef}>
          <button
            className="header__icon-btn kebab__btn"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="kebab__icon">
              <img className="kebab__icon-dots" src={asset('/img/menu.svg')} alt="" width="24" height="24" />
              <img className="kebab__icon-x" src={asset('/img/close.svg')} alt="" width="24" height="24" />
            </span>
          </button>

          <div className={`kebab__menu${open ? ' is-open' : ''}`}>
            {LINKS.map((l) =>
              l.copy ? (
                <button className="kebab__pill kebab__pill--copy" key="copy" onClick={handleCopy}>
                  <span>{copied ? t('copied') : l.label}</span>
                  <img src={asset('/img/copy.svg')} alt="Copy" width="16" height="16" />
                </button>
              ) : l.lang ? (
                <button className="kebab__pill" key="lang" onClick={handleLang}>
                  {l.label}
                </button>
              ) : (
                <a className="kebab__pill" href={l.href} key={l.label}>
                  {l.label}
                </a>
              )
            )}
          </div>
        </div>

        <a className="pill pill--grey" href={site.cvUrl} target="_blank" rel="noreferrer">{t('openCV')}</a>
        <a className="pill pill--white" href={site.telegram} target="_blank" rel="noreferrer">{t('contact')}</a>
      </div>
    </header>
  )
}
