import { useRef, useState, useLayoutEffect } from 'react'
import useMedia, { PHONE } from '../hooks/useMedia.js'
import { asset } from '../asset.js'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import MaskedHeading from './MaskedHeading.jsx'
import { useLang } from '../i18n.jsx'

const HANDLE = 40 // the round button sitting in the photo's corner
const INSET = 24 // ...tucked this far in from the bottom-right corner
const OVERHANG = 1 // the panel hangs 1px below the photo (see .work__panel)
const HANDLE_TRAVEL = 64 // far enough below the edge to park the button out of sight
const CORNER = 88 // the pointer target around the closed button (inset + button + inset)

function WorkCard({ w, onOpenCase, t, tr }) {
  const cardRef = useRef(null)
  const tlRef = useRef(null)
  const phone = useMedia(PHONE)
  const open = () => onOpenCase(cardRef.current.querySelector('.work__cover'), w)

  // The handle and the panel are the same element: at rest a clip-path crops
  // the panel down to a 40px button around its icon, and hovering opens the
  // crop out to the full panel. Because the icon sits 32px in from the panel's
  // corner and the button is inset 24px with 8px of its own padding, the icon
  // lands on the same pixel in both states — so it never moves, the panel just
  // unfolds around it. Clipping (rather than resizing) also means the text
  // inside is never re-laid-out mid-animation.
  useLayoutEffect(() => {
    // no hover on touch, and on phones the panel is a block under the photo
    // rather than a crop of it — nothing to fold open either way
    if (phone || window.matchMedia('(hover: none)').matches) return
    const ctx = gsap.context((self) => {
      const q = self.selector
      const panel = q('.work__panel')[0]
      if (!panel) return

      const hitbox = q('.work__hitbox')[0]
      const cover = cardRef.current.querySelector('.work__cover')

      const build = () => {
        tlRef.current?.kill()
        const { width, height } = panel.getBoundingClientRect()
        const bottom = INSET + OVERHANG // measured from the panel, which hangs 1px lower
        const top = Math.max(0, height - bottom - HANDLE)
        const left = Math.max(0, width - INSET - HANDLE)
        // both strings need the same shape for GSAP to interpolate them, hence
        // the four explicit corner radii on each side
        const closed = `inset(${top}px ${INSET}px ${bottom}px ${left}px round 20px 20px 20px 20px)`
        const opened = 'inset(0px 0px 0px 0px round 12px 12px 12px 12px)'

        // the hit area spans the whole photo and is cropped the same way, only
        // wider while closed — a comfortable corner rather than a 40px target
        const cb = cover.getBoundingClientRect()
        const hitClosed = `inset(${Math.max(0, cb.height - CORNER)}px 0px 0px ${Math.max(0, cb.width - CORNER)}px)`
        const hitOpen = `inset(${Math.max(0, cb.height - height)}px 0px 0px ${Math.max(0, cb.width - width)}px)`

        const tl = gsap.timeline({ paused: true })
        tl.fromTo(panel, { clipPath: closed }, { clipPath: opened, duration: 0.72, ease: 'power3.inOut' }, 0)
        tl.fromTo(hitbox, { clipPath: hitClosed }, { clipPath: hitOpen, duration: 0.72, ease: 'power3.inOut' }, 0)
        // the copy drifts in behind the opening edge, a beat late
        tl.fromTo(
          q('.work__main'),
          { autoAlpha: 0, x: 28 },
          { autoAlpha: 1, x: 0, duration: 0.55, ease: 'power3.out' },
          0.18
        )
        tlRef.current = tl
      }

      build()
      window.addEventListener('resize', build)
      return () => window.removeEventListener('resize', build)
    }, cardRef)
    return () => {
      tlRef.current = null
      ctx.revert()
    }
  }, [phone])

  // opening runs at normal speed; folding back is a touch quicker
  const show = () => tlRef.current?.timeScale(1).play()
  const collapse = () => tlRef.current?.timeScale(1.6).reverse()

  // The button only exists while the card is under the pointer. It dissolves
  // iOS-style: the arrow smears into blur while the disc holds its colour and
  // only lets go at the end (a plain fade reads as a light switch). Opacity
  // rather than autoAlpha — a hidden element takes no pointer events, and the
  // button has to be hoverable the instant it appears.
  const fadeHandle = (visible) => {
    if (!tlRef.current) return // touch: the panel is always open
    const handle = cardRef.current.querySelector('.work__handle')
    gsap.killTweensOf(handle)
    if (visible) {
      // arrives at full strength, rising in from under the photo's edge
      gsap.set(handle, { opacity: 1, filter: 'blur(0px)' })
      gsap.to(handle, { y: 0, duration: 0.5, ease: 'power3.out' })
    } else {
      // ...and leaves by dissolving on the spot
      gsap.to(handle, {
        opacity: 0,
        duration: 0.34,
        ease: 'power2.in',
        onComplete: () => gsap.set(handle, { y: HANDLE_TRAVEL }), // reset for the next rise
      })
      gsap.to(handle, { filter: 'blur(12px)', duration: 0.28, ease: 'power2.out' })
    }
  }

  const enter = () => {
    tlRef.current?.eventCallback('onReverseComplete', null) // cancel a pending dismissal
    fadeHandle(true)
  }

  // Leaving folds the panel back into the button first and only then lets the
  // button go — fading both at once would hide the fold behind the fade.
  const leave = () => {
    const tl = tlRef.current
    if (!tl) return
    if (!tl.progress()) {
      fadeHandle(false) // never opened: just the button to put away
      return
    }
    tl.eventCallback('onReverseComplete', () => {
      tl.eventCallback('onReverseComplete', null)
      fadeHandle(false)
    })
    collapse()
  }

  const panel = (
    <div className="work__panel">
      <div className="work__main">
        <div className="work__titles">
          <h3 className="work__title">{w.title}</h3>
          <p className="work__intro">{tr(w.intro)}</p>
        </div>
        <div className="work__metrics">
          {w.metrics.map((m) => (
            <span key={m}>{t(m)}</span>
          ))}
        </div>
      </div>
      <img className="work__open" src={asset('/img/arrow-open.svg')} alt="" width="24" height="24" />
    </div>
  )

  return (
    <article
      className="work"
      data-anim="work"
      ref={cardRef}
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => (e.key === 'Enter' ? open() : null)}
      onPointerEnter={enter}
      onPointerLeave={leave}
      onFocus={() => {
        enter()
        show()
      }}
      onBlur={leave}
    >
      <div className="work__cover">
        <img className="work__img" src={asset(w.cover)} alt={w.title} loading="lazy" decoding="async" />

        {/* The blur lives on the wrapper, not the panel: a filter is applied
            before clipping, so blurring the panel itself would be cropped back
            to a hard-edged disc. Out here it softens the already-cropped shape. */}
        {!phone && (
          <div className="work__handle">
            {/* the pointer target: the whole corner around the button while it
                is closed, the panel's full area once open (see the timeline) */}
            <div className="work__hitbox" onPointerEnter={show} onPointerLeave={collapse} />
            {panel}
          </div>
        )}
      </div>

      {/* on a phone there is no room to crop the panel into the photo, so it
          simply follows it inside the card */}
      {phone && panel}
    </article>
  )
}

export default function Works({ onOpenCase }) {
  const { content, t, tr } = useLang()
  const cases = content.cases
  const step = content.works?.step || 4

  const [count, setCount] = useState(step)
  const listRef = useRef(null)
  const prevCount = useRef(step)

  // smoothly reveal the cards added by "Show more"
  useLayoutEffect(() => {
    if (!listRef.current) return
    const cards = listRef.current.querySelectorAll('.work')
    if (count > prevCount.current) {
      const fresh = Array.from(cards).slice(prevCount.current)
      gsap.from(fresh, {
        y: 60,
        autoAlpha: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.1,
      })
    }
    prevCount.current = count
    // the list just got taller — the sections below need fresh trigger positions
    ScrollTrigger.refresh()
  }, [count])

  const visible = cases.slice(0, count)
  const hasMore = count < cases.length

  return (
    <section className="works" id="works">
      <div className="container">
        <MaskedHeading as="h2" className="section-title" text={tr(content.works?.heading)} />

        <div className="works__list" ref={listRef}>
          {visible.map((w) => (
            <WorkCard key={w.id} w={w} onOpenCase={onOpenCase} t={t} tr={tr} />
          ))}
        </div>

        {hasMore && (
          <div className="works__more">
            <button className="pill pill--ghost" onClick={() => setCount((c) => c + step)}>
              {t('showMore')}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
