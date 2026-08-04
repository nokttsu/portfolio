import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { asset } from '../asset.js'
import gsap from 'gsap'
import { CASE, rich } from '../data/caseData.jsx'
import WorksTable from './WorksTable.jsx'
import useSmoothWheel from '../hooks/useSmoothWheel.js'
import Scrollbar from './Scrollbar.jsx'

const SECTIONS = CASE.blocks.filter((b) => b.type === 'section')

const READ_ALSO_POOL = [
  { name: 'InnovaFlow', metrics: ['FINALIST', '+18% CTR', '+9% MAU'] },
  { name: 'SpectraTech', metrics: ['AWARD', '+25% CTR', '+12% MAU'] },
  { name: 'Nexify', metrics: ['FINALIST', '+15% CTR', '+8% MAU'] },
  { name: 'TrackFusion', metrics: ['HONORABLE MENTION', '+12% CTR', '+5% MAU'] },
  { name: 'PulseWave', metrics: ['HONORABLE MENTION', '+14% CTR', '+7% MAU'] },
  { name: 'EchoStream', metrics: ['AWARD', '+30% CTR', '+15% MAU'] },
  { name: 'VisionaryGrid', metrics: ['FINALIST', '+10% CTR', '+6% MAU'] },
  { name: 'OrbitX', metrics: ['AWARD', '+27% CTR', '+13% MAU'] },
]
const pickReadAlso = () => [...READ_ALSO_POOL].sort(() => Math.random() - 0.5).slice(0, 4)

function Block({ b }) {
  switch (b.type) {
    case 'section':
      return (
        <div className="cs-section">
          <div className="cs-section__eyebrow">
            <span className="cs-section__name">{b.name}</span>
          </div>
          <h2 className="cs-section__title">{b.title}</h2>
        </div>
      )
    case 'lead':
      return <p className="cs-lead">{rich(b.text)}</p>
    case 'heading':
      return <h2 className="cs-h2">{b.text}</h2>
    case 'subheading':
      return <h3 className="cs-h3">{b.text}</h3>
    case 'paragraph':
      return <p className="cs-p">{rich(b.text)}</p>
    case 'list': {
      const items = b.items.map((it, i) => <li key={i}>{rich(it)}</li>)
      const list = b.ordered ? (
        <ol className="cs-list cs-list--ol">{items}</ol>
      ) : (
        <ul className="cs-list">{items}</ul>
      )
      return b.title ? (
        <div className="cs-listblock">
          {/* lead-in line before a list always ends with a colon */}
          <p className="cs-label">{String(b.title).replace(/\s*:\s*$/, '')}:</p>
          {list}
        </div>
      ) : (
        list
      )
    }
    case 'people':
      return (
        <ul className="cs-people">
          {b.items.map((p, i) => (
            <li key={i}>
              <span className="cs-people__role">{p.role}</span>
              {p.href ? <a href={p.href}>{p.name}</a> : <span>{p.name}</span>}
            </li>
          ))}
        </ul>
      )
    case 'quote':
      return (
        <blockquote className="cs-quote">
          <p>{rich(b.text)}</p>
          {b.author && (
            <cite>
              {b.href ? <a href={b.href}>{b.author}</a> : b.author}
              {b.role ? `, ${b.role}` : ''}
            </cite>
          )}
        </blockquote>
      )
    case 'cta':
      return (
        <div className="cs-endcta">
          <h2 className="cs-endcta__title">{b.title}</h2>
          <p className="cs-endcta__text">{b.text}</p>
          <a className="pill pill--white" href={b.href}>{b.button}</a>
        </div>
      )
    case 'callout':
      return (
        <div className="cs-callout">
          {b.icon && <span className="cs-callout__icon">{b.icon}</span>}
          <p>{rich(b.text)}</p>
        </div>
      )
    case 'metrics':
      return (
        <div className="cs-metrics">
          {b.items.map((m, i) => (
            <div className="cs-metric" key={i}>
              <div className="cs-metric__val">{m.value}</div>
              <div className="cs-metric__label">{m.label}</div>
            </div>
          ))}
        </div>
      )
    case 'image':
      return (
        <figure className={`cs-figure cs-figure--${b.size || 'wide'}`}>
          <img src={b.src} alt="" />
          {b.caption && <figcaption>{b.caption}</figcaption>}
        </figure>
      )
    case 'gallery':
      return (
        <figure className="cs-figure cs-figure--wide">
          <div className="cs-gallery" style={{ gridTemplateColumns: `repeat(${b.columns || 3}, 1fr)` }}>
            {b.images.map((src, i) => <img src={src} alt="" key={i} />)}
          </div>
          {b.caption && <figcaption>{b.caption}</figcaption>}
        </figure>
      )
    case 'columns':
      return (
        <div className="cs-columns">
          <p>{rich(b.left)}</p>
          <p>{rich(b.right)}</p>
        </div>
      )
    case 'divider':
      return <hr className="cs-divider" />
    default:
      return null
  }
}

export default function CaseModal({ cover, onClose }) {
  const scrollRef = useRef(null)
  const [active, setActive] = useState(0)
  const [navOn, setNavOn] = useState(false)
  const readAlso = useMemo(pickReadAlso, [])

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
        <button className="case-modal__close header__icon-btn" onClick={onClose} aria-label="Close">
          <img src={asset('/img/close.svg')} alt="" width="24" height="24" />
        </button>

        <nav className={`cs-nav${navOn ? ' is-visible' : ''}`} aria-label="Sections">
          {SECTIONS.map((s, i) => (
            <button
              key={s.num}
              className={`cs-nav__item${i === active ? ' is-active' : ''}`}
              onClick={() => goTo(i)}
            >
              <span className="cs-nav__name">{s.name}</span>
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
            {CASE.intro && <p className="cs-subtitle">{CASE.intro}</p>}
            {CASE.cta && (
              <a className="cs-head__cta pill pill--white" href={CASE.cta.href}>{CASE.cta.label}</a>
            )}
            <dl className="cs-meta">
              {CASE.meta.map((m) => (
                <div className="cs-meta__item" key={m.k}>
                  <dt>{m.k}</dt>
                  <dd>{m.v}</dd>
                </div>
              ))}
            </dl>
          </header>

            <div className="cs-body">
              {CASE.blocks.map((b, i) => <Block key={i} b={b} />)}
            </div>

            <section className="cs-readalso">
              <h2 className="cs-readalso__title">Read also</h2>
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
