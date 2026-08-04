import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { asset } from '../asset.js'
import gsap from 'gsap'
import { rich } from '../rich.jsx'
import WorksTable from './WorksTable.jsx'
import useSmoothWheel from '../hooks/useSmoothWheel.js'
import Scrollbar from './Scrollbar.jsx'
import { useLang } from '../i18n.jsx'

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
          <img src={asset(b.src)} alt="" />
          {b.caption && <figcaption>{tr(b.caption)}</figcaption>}
        </figure>
      )
    case 'gallery':
      return (
        <figure className="cs-figure cs-figure--wide">
          <div className="cs-gallery" style={{ gridTemplateColumns: `repeat(${b.columns || 3}, 1fr)` }}>
            {(b.images || []).map((src, i) => <img src={asset(src)} alt="" key={i} />)}
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

export default function CaseModal({ cover, data, onClose }) {
  const { content, t, tr } = useLang()
  const CASE = data || content.cases[0]
  const SECTIONS = (CASE.blocks || []).filter((b) => b.type === 'section')

  const scrollRef = useRef(null)
  const [active, setActive] = useState(0)
  const [navOn, setNavOn] = useState(false)
  // four other cases, shuffled
  const readAlso = useMemo(
    () => content.cases.filter((c) => c.id !== CASE.id).sort(() => Math.random() - 0.5).slice(0, 4),
    [content.cases, CASE.id]
  )

  // eased wheel scrolling inside the case
  const getScroller = useCallback(() => scrollRef.current, [])
  useSmoothWheel(getScroller, { ignore: '.cs-lightbox' })

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

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
      /* hidden on first paint so the FLIP can be staged before anything shows */
      style={{ opacity: 0, visibility: 'hidden' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="case-modal__panel">
        <button className="case-modal__close header__icon-btn" onClick={onClose} aria-label={t('close')}>
          <img src={asset('/img/close.svg')} alt="" width="24" height="24" />
        </button>

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
              <WorksTable
                rows={readAlso}
                onOpenCase={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              />
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
