import { useEffect, useLayoutEffect, useRef, useState, useMemo, useCallback } from 'react'
import { asset } from '../asset.js'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { rich } from '../rich.jsx'
import WorksTable from './WorksTable.jsx'
import useSmoothWheel from '../hooks/useSmoothWheel.js'
import Scrollbar from './Scrollbar.jsx'
import { useLang } from '../i18n.jsx'

// how far below the screen edge the contents button parks (see .cs-toc)
const TOC_TRAVEL = 96

function Block({ b, tr }) {
  switch (b.type) {
    case 'section':
      return (
        <div className="cs-section">
          <div className="cs-section__eyebrow">
            <span className="cs-section__name">{tr(b.name)}</span>
          </div>
          <h2 className="cs-section__title">{tr(b.title)}</h2>
        </div>
      )
    case 'lead':
      return <p className="cs-lead">{rich(tr(b.text))}</p>
    case 'heading':
      return <h2 className="cs-h2">{tr(b.text)}</h2>
    case 'subheading':
      return <h3 className="cs-h3">{tr(b.text)}</h3>
    case 'paragraph':
      return <p className="cs-p">{rich(tr(b.text))}</p>
    case 'list': {
      const items = (b.items || []).map((it, i) => <li key={i}>{rich(tr(it))}</li>)
      const list = b.ordered ? (
        <ol className="cs-list cs-list--ol">{items}</ol>
      ) : (
        <ul className="cs-list">{items}</ul>
      )
      return b.title ? (
        <div className="cs-listblock">
          {/* lead-in line before a list always ends with a colon */}
          <p className="cs-label">{String(tr(b.title)).replace(/\s*:\s*$/, '')}:</p>
          {list}
        </div>
      ) : (
        list
      )
    }
    case 'quote':
      return (
        <blockquote className="cs-quote">
          <p>{rich(tr(b.text))}</p>
          {b.author && (
            <cite>{b.href ? <a href={b.href}>{tr(b.author)}</a> : tr(b.author)}</cite>
          )}
        </blockquote>
      )
    case 'callout':
      return (
        <div className="cs-callout">
          {b.icon && <span className="cs-callout__icon">{b.icon}</span>}
          <p>{rich(tr(b.text))}</p>
        </div>
      )
    case 'metrics':
      return (
        <div className="cs-metrics">
          {(b.items || []).map((m, i) => (
            <div className="cs-metric" key={i}>
              <div className="cs-metric__val">{tr(m.value)}</div>
              <div className="cs-metric__label">{tr(m.label)}</div>
            </div>
          ))}
        </div>
      )
    case 'image':
      return (
        <figure className={`cs-figure cs-figure--${b.size || 'wide'}`}>
          <img src={asset(b.src)} alt="" loading="lazy" decoding="async" />
          {b.caption && <figcaption>{tr(b.caption)}</figcaption>}
        </figure>
      )
    case 'gallery':
      return (
        <figure className="cs-figure cs-figure--wide">
          <div className="cs-gallery" style={{ gridTemplateColumns: `repeat(${b.columns || 3}, 1fr)` }}>
            {(b.images || []).map((im, i) => (
              <img src={asset(im)} alt="" key={i} loading="lazy" decoding="async" />
            ))}
          </div>
          {b.caption && <figcaption>{tr(b.caption)}</figcaption>}
        </figure>
      )
    case 'columns':
      return (
        <div className="cs-columns">
          <p>{rich(tr(b.left))}</p>
          <p>{rich(tr(b.right))}</p>
        </div>
      )
    case 'divider':
      return <hr className="cs-divider" />
    default:
      return null
  }
}

export default function CaseModal({ cover, data, instant = false, onReady, onClose, onOpenCase }) {
  const { content, t, tr } = useLang()
  const CASE = data || content.cases[0]
  const SECTIONS = (CASE.blocks || []).filter((b) => b.type === 'section')

  const scrollRef = useRef(null)
  const [active, setActive] = useState(0)
  const [navOn, setNavOn] = useState(false)
  // the bottom contents dropdown (stands in for the rail on narrow screens)
  const [tocOpen, setTocOpen] = useState(false)
  const tocRef = useRef(null)
  const tocTlRef = useRef(null)
  const tocLabelRef = useRef(null)
  // four other cases, shuffled
  const readAlso = useMemo(
    () => content.cases.filter((c) => c.id !== CASE.id).sort(() => Math.random() - 0.5).slice(0, 4),
    [content.cases, CASE.id]
  )

  // tell the app the DOM is here so it can play the opening morph — this is a
  // lazy chunk, so on the first open the modal mounts later than the click
  const readyRef = useRef(onReady)
  readyRef.current = onReady
  useLayoutEffect(() => {
    readyRef.current?.()
  }, [CASE.id])

  // share: copy a direct link to this case
  const [copied, setCopied] = useState(false)
  const copyLink = useCallback(async () => {
    const url = `${location.origin}${location.pathname}?case=${encodeURIComponent(CASE.id)}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard blocked */
    }
  }, [CASE.id])

  // eased wheel scrolling inside the case
  const getScroller = useCallback(() => scrollRef.current, [])
  useSmoothWheel(getScroller, { ignore: '.cs-lightbox' })

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // keep keyboard focus inside the modal and hand it back on close
  const panelRef = useRef(null)
  useEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const active = document.activeElement
    const opener = active && active !== document.body ? active : null
    const sel =
      'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'
    panel.querySelector('.case-modal__close')?.focus()
    const onKey = (e) => {
      if (e.key !== 'Tab') return
      const items = [...panel.querySelectorAll(sel)].filter((n) => n.offsetParent !== null)
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      } else if (!panel.contains(document.activeElement)) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus()
    }
  }, [])

  // article blocks appear on scroll, like the sections on the home page
  useEffect(() => {
    const root = scrollRef.current
    if (!root) return
    const ctx = gsap.context(() => {
      const blocks = root.querySelectorAll('.cs-body > *, .cs-readalso')
      blocks.forEach((el) => {
        gsap.from(el, {
          y: 24,
          autoAlpha: 0,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: { scroller: root, trigger: el, start: 'top bottom-=40', once: true },
        })
      })
      // (images inside a case are deliberately static — no reveal on them)
      ScrollTrigger.refresh()
    }, root)
    return () => ctx.revert()
  }, [CASE])

  // scroll-spy: highlight the section currently in view
  useEffect(() => {
    const root = scrollRef.current
    if (!root) return
    const onScroll = () => {
      const rootTop = root.getBoundingClientRect().top
      const line = root.clientHeight * 0.35
      const secs = [...root.querySelectorAll('.cs-section')]
      let idx = 0
      secs.forEach((s, i) => {
        if (s.getBoundingClientRect().top - rootTop <= line) idx = i
      })
      setActive(idx)
      // the navigator appears/pins once the first section reaches the spy line
      const firstTop = secs[0] ? secs[0].getBoundingClientRect().top - rootTop : Infinity
      setNavOn(firstTop <= line)
    }
    root.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => root.removeEventListener('scroll', onScroll)
  }, [])

  const goTo = (i) => {
    const secs = scrollRef.current?.querySelectorAll('.cs-section')
    secs?.[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // The contents open the way the header menu does — pills out of blur with a
  // soft spring, melting back on close (built once, played/reversed on state).
  useLayoutEffect(() => {
    const el = tocRef.current
    if (!el) return
    const ctx = gsap.context((self) => {
      const tl = gsap.timeline({ paused: true })
      tl.fromTo(
        self.selector('.cs-toc__item'),
        { y: 12, scale: 0.82, autoAlpha: 0, filter: 'blur(12px)' },
        {
          y: 0,
          scale: 1,
          autoAlpha: 1,
          filter: 'blur(0px)',
          duration: 0.42,
          ease: 'back.out(1.7)',
          stagger: { each: 0.045, from: 'end' }, // nearest the button first
        }
      )
      // the icon points both ways, so it only shifts weight rather than flipping
      tl.fromTo(self.selector('.cs-toc__chev'), { scale: 1 }, { scale: 0.86, duration: 0.3, ease: 'power3.out' }, 0)
      tocTlRef.current = tl
    }, tocRef)
    return () => {
      tocTlRef.current = null
      ctx.revert()
    }
  }, [SECTIONS.length, CASE.id])

  useEffect(() => {
    const tl = tocTlRef.current
    if (!tl) return
    if (tocOpen) tl.timeScale(1).play()
    else tl.timeScale(1.6).reverse()
  }, [tocOpen])

  // It rides in from under the screen edge at full strength, and leaves the way
  // the cards' corner button does — smeared into blur, the colour letting go
  // only at the end (a plain fade reads as a light switch).
  useLayoutEffect(() => {
    const el = tocRef.current
    if (!el) return
    gsap.killTweensOf(el)
    if (navOn) {
      // `none`, not `blur(0px)`: an ancestor carrying any filter at all becomes
      // a backdrop root, and the pills inside would have nothing left to frost
      // with their own backdrop-filter. Setting it outright (rather than
      // clearing props) also means an interrupted exit can never leave the
      // button sitting there blurred.
      gsap.set(el, { opacity: 1, filter: 'none' })
      gsap.to(el, { y: 0, duration: 0.5, ease: 'power3.out' })
    } else {
      gsap.to(el, {
        opacity: 0,
        duration: 0.34,
        ease: 'power2.in',
        onComplete: () => gsap.set(el, { y: TOC_TRAVEL }), // reset for the next rise
      })
      // an explicit start value: GSAP cannot interpolate out of `none`
      gsap.fromTo(el, { filter: 'blur(0px)' }, { filter: 'blur(12px)', duration: 0.28, ease: 'power2.out' })
    }
  }, [navOn])

  // The name swaps outright and the pill takes the width that name needs —
  // no tweening in between. Animating the two against each other is what kept
  // leaving the chevron mid-jump; the reveal of the whole dropdown carries the
  // motion instead.
  useLayoutEffect(() => {
    const label = tocLabelRef.current
    if (!label) return
    label.textContent = tr(SECTIONS[active]?.name) || ''
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, CASE.id, tr])

  // a new section under the reader is a new label — don't leave the list open
  useEffect(() => setTocOpen(false), [active])

  // ...and neither does a tap anywhere else
  useEffect(() => {
    if (!tocOpen) return
    const onDown = (e) => {
      if (tocRef.current && !tocRef.current.contains(e.target)) setTocOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [tocOpen])

  // ---- lightbox: click any case image to expand it full screen (FLIP) ----
  const [lightbox, setLightbox] = useState(null)
  const lbImgRef = useRef(null)
  const lbOriginRef = useRef(null)

  useEffect(() => {
    const root = scrollRef.current
    if (!root) return
    const onClick = (e) => {
      const img = e.target.closest('.cs-figure img, .case-modal__hero-img')
      if (!img) return
      lbOriginRef.current = img
      setLightbox({ src: img.currentSrc || img.src, first: img.getBoundingClientRect() })
    }
    root.addEventListener('click', onClick)
    return () => root.removeEventListener('click', onClick)
  }, [])

  // expand from the clicked image to its full-screen size
  useEffect(() => {
    if (!lightbox) return
    const img = lbImgRef.current
    const overlay = img?.parentElement
    if (!img || !overlay) return
    const run = () => {
      const last = img.getBoundingClientRect()
      const { first } = lightbox
      gsap.set(lbOriginRef.current, { autoAlpha: 0 })
      gsap.set(overlay, { autoAlpha: 1 }) // no fade — pure morph
      gsap.fromTo(
        img,
        {
          x: first.left - last.left,
          y: first.top - last.top,
          scaleX: first.width / last.width,
          scaleY: first.height / last.height,
          transformOrigin: 'top left',
        },
        { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.6, ease: 'power3.inOut' }
      )
    }
    if (img.complete) run()
    else img.addEventListener('load', run, { once: true })
  }, [lightbox])

  const closeLightbox = useCallback(() => {
    const img = lbImgRef.current
    const overlay = img?.parentElement
    const origin = lbOriginRef.current
    const done = () => {
      if (origin) gsap.set(origin, { autoAlpha: 1 })
      setLightbox(null)
    }
    if (!img || !overlay || !origin) return done()
    const first = origin.getBoundingClientRect()
    const last = img.getBoundingClientRect()
    gsap.to(img, {
      x: first.left - last.left,
      y: first.top - last.top,
      scaleX: first.width / last.width,
      scaleY: first.height / last.height,
      transformOrigin: 'top left',
      duration: 0.55,
      ease: 'power3.inOut',
      onComplete: done,
    })
  }, [])

  // Esc closes the lightbox first, then the case
  useEffect(() => {
    if (!lightbox) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.stopImmediatePropagation()
        closeLightbox()
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [lightbox, closeLightbox])

  return (
    <div
      className="case-modal"
      role="dialog"
      aria-modal="true"
      /* hidden on first paint so the FLIP can be staged before anything shows;
         a deep link has nothing to morph from, so it shows straight away */
      style={instant ? undefined : { opacity: 0, visibility: 'hidden' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="case-modal__panel" ref={panelRef}>
        {/* the same progressive-blur backdrop the home header sits on */}
        <div className="header__blur case-modal__blur" aria-hidden="true">
          <div />
          <div />
          <div />
          <div />
        </div>

        <div className="case-modal__tools case-modal__tools--left">
          <button
            className="header__icon-btn"
            onClick={copyLink}
            aria-label={copied ? t('copied') : t('copyLink')}
            title={copied ? t('copied') : t('copyLink')}
          >
            {/* lucide: link */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              {copied ? (
                <polyline points="20 6 9 17 4 12" />
              ) : (
                <>
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </>
              )}
            </svg>
          </button>
        </div>

        <div className="case-modal__tools case-modal__tools--right">
          <button className="case-modal__close header__icon-btn" onClick={onClose} aria-label={t('close')}>
            <img src={asset('/img/close.svg')} alt="" width="24" height="24" />
          </button>
        </div>

        <nav className={`cs-nav${navOn ? ' is-visible' : ''}`} aria-label="Sections">
          {SECTIONS.map((s, i) => (
            <button
              key={i}
              className={`cs-nav__item${i === active ? ' is-active' : ''}`}
              onClick={() => goTo(i)}
            >
              <span className="cs-nav__name">{tr(s.name)}</span>
              <span className="cs-nav__tick" />
            </button>
          ))}
        </nav>

        {/* the same contents, where the side rail has no room: a dropdown
            parked at the bottom of the screen, on the home CTA's coordinates */}
        {SECTIONS.length > 0 && (
          <div className={`cs-toc${navOn ? ' is-visible' : ''}`} ref={tocRef}>
            <div className={`cs-toc__menu${tocOpen ? ' is-open' : ''}`}>
              {SECTIONS.map((s, i) => (
                <button
                  key={i}
                  className={`cs-toc__item${i === active ? ' is-active' : ''}`}
                  onClick={() => {
                    setTocOpen(false)
                    goTo(i)
                  }}
                >
                  {tr(s.name)}
                </button>
              ))}
            </div>

            <button
              className="cs-toc__btn"
              aria-expanded={tocOpen}
              onClick={() => setTocOpen((v) => !v)}
            >
              <span className="cs-toc__label" ref={tocLabelRef} />
              <svg
                className="cs-toc__chev"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {/* lucide: chevrons-up-down */}
                <path d="m7 15 5 5 5-5" />
                <path d="m7 9 5-5 5 5" />
              </svg>
            </button>
          </div>
        )}

        <div className="case-modal__scroll" ref={scrollRef}>
          <div className="case-modal__hero">
            {cover && <img className="case-modal__hero-img" src={cover} alt="" />}
          </div>

          <article className="case-modal__article">
          <header className="cs-head">
            <h1 className="cs-title">{CASE.title}</h1>
            {CASE.intro && <p className="cs-subtitle">{tr(CASE.intro)}</p>}
            {CASE.cta && (
              <a className="cs-head__cta pill pill--white" href={CASE.cta.href}>{tr(CASE.cta.label)}</a>
            )}
            <dl className="cs-meta">
              {(CASE.meta || []).map((m, i) => (
                <div className="cs-meta__item" key={i}>
                  <dt>{tr(m.k)}</dt>
                  <dd>{tr(m.v)}</dd>
                </div>
              ))}
            </dl>
          </header>

            <div className="cs-body">
              {(CASE.blocks || []).map((b, i) => <Block key={i} b={b} tr={tr} />)}
            </div>

            <section className="cs-readalso">
              <h2 className="cs-readalso__title">{t('readAlso')}</h2>
              {/* the hovered cover morphs into the next case, same as from home */}
              <WorksTable rows={readAlso} onOpenCase={onOpenCase} />
            </section>
          </article>
        </div>

        <Scrollbar getTarget={getScroller} hidden={!!lightbox} />

        {lightbox && (
          <div className="cs-lightbox" onClick={closeLightbox} style={{ opacity: 0 }}>
            <img ref={lbImgRef} src={lightbox.src} alt="" />
          </div>
        )}
      </div>
    </div>
  )
}
