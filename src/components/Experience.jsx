import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import gsap from 'gsap'
import MaskedHeading from './MaskedHeading.jsx'
import { asset } from '../asset.js'
import useMedia, { PHONE } from '../hooks/useMedia.js'
import { useLang } from '../i18n.jsx'

const TAIL_H = 16 // the tail hides behind the card's bottom edge by its own height
const GROW = 0.22 // how long the highlight takes to open out to the card
const OUTLINE = 'rgba(255, 255, 255, 0.1)'

export default function Experience() {
  const { content, tr } = useLang()
  const exp = content.experience

  // the company marked `highlight` in the content opens by default (Aeroflot,
  // the most recent one); pointing at any other card switches to it
  const defaultIndex = Math.max(
    exp.items.findIndex((i) => i.highlight),
    exp.items.findIndex((i) => !i.divider)
  )
  const [active, setActive] = useState(defaultIndex)
  // on phones the companies are a reel: whichever card the scroll settles on
  // is the selected one, so there is nothing to tap
  const phone = useMedia(PHONE)
  const textRef = useRef(null)
  const storyRef = useRef(null)
  const rowRef = useRef(null)
  const markerRef = useRef(null)
  const tailRef = useRef(null)
  const tailBoxRef = useRef(null)
  const tlRef = useRef(null)
  const pointerRef = useRef(null) // where the highlight should open from
  const placed = useRef(false)
  const prevActive = useRef(defaultIndex)
  const prevHeight = useRef(0)

  // The highlight is not a thing that travels — it grows out of the middle of
  // the card you point at: a small square opens up to the card's size, rounds
  // off, and only then does the tail slide out from under it. Leaving pulls the
  // whole thing back in the same order, reversed.
  useLayoutEffect(() => {
    const row = rowRef.current
    const marker = markerRef.current
    const tail = tailRef.current
    const tailBox = tailBoxRef.current
    if (!row || !marker || !tail || !tailBox) return

    // The marker is absolutely placed inside the row, so it has to be measured
    // in the row's own coordinates — offset* is exactly that, and unlike
    // client rects it doesn't shift when the row scrolls sideways (which it
    // does on phones, where the companies become a reel).
    const boxOf = (card) => ({
      x: card.offsetLeft,
      y: card.offsetTop,
      width: card.offsetWidth,
      height: card.offsetHeight,
    })
    // screen point -> the same coordinates
    const toLocal = (p) => {
      const r = row.getBoundingClientRect()
      const cs = getComputedStyle(row)
      return {
        x: p.x - r.left - parseFloat(cs.paddingLeft) + row.scrollLeft,
        y: p.y - r.top - parseFloat(cs.paddingTop) + row.scrollTop,
      }
    }
    const middleOf = (box) => ({
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
      width: 0,
      height: 0,
    })
    // it opens from wherever the pointer actually is, falling back to the
    // middle when the tab was reached by keyboard or set on first render
    const seedOf = (box) => {
      const p = pointerRef.current
      if (!p) return middleOf(box)
      const local = toLocal(p)
      return {
        x: gsap.utils.clamp(box.x, box.x + box.width, local.x),
        y: gsap.utils.clamp(box.y, box.y + box.height, local.y),
        width: 0,
        height: 0,
      }
    }

    const card = row.querySelector('.exp__card--active')
    if (!card) return
    const full = boxOf(card)

    tlRef.current?.kill()
    const tl = gsap.timeline()
    tlRef.current = tl

    // every card is outlined; the highlighted one drops its outline at the very
    // end of the grow, when the fill has all but reached the edges
    tl.set(row.querySelectorAll('.exp__card'), { borderColor: OUTLINE }, 0)

    // pull the previous highlight back into its own centre first
    if (placed.current) {
      const here = {
        x: gsap.getProperty(marker, 'x'),
        y: gsap.getProperty(marker, 'y'),
        width: gsap.getProperty(marker, 'width'),
        height: gsap.getProperty(marker, 'height'),
      }
      tl.to(tail, { y: -TAIL_H, duration: 0.1, ease: 'power2.in' }, 0)
      tl.set(tailBox, { autoAlpha: 0 }, 0.1)
      tl.to(
        marker,
        { ...middleOf(here), borderRadius: 0, autoAlpha: 0, duration: 0.16, ease: 'power2.in' },
        0.03
      )
    }

    const growAt = tl.duration()
    tl.fromTo(
      marker,
      { ...seedOf(full), borderRadius: 0, autoAlpha: 0 },
      { ...full, borderRadius: 12, autoAlpha: 1, duration: GROW, ease: 'power3.out' },
      growAt
    )
    // The outline goes out late but *finishes* before the fill's edge reaches
    // it — both are 10% white, so any overlap would read as a bright rim.
    tl.to(
      card,
      { borderColor: 'rgba(255, 255, 255, 0)', duration: GROW * 0.25, ease: 'power2.in' },
      growAt + GROW * 0.35
    )
    // the tail creeps out from under the card's edge — no overshoot, or it
    // would visibly detach from the card for a frame or two
    tl.set(tailBox, { autoAlpha: 1 }, '-=0.06')
    tl.fromTo(tail, { y: -TAIL_H }, { y: 0, duration: 0.18, ease: 'power3.out' }, '<')
    placed.current = true

    const onResize = () => {
      const live = row.querySelector('.exp__card--active')
      if (live && !tl.isActive()) gsap.set(marker, boxOf(live))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [active])

  // Reel behaviour: the card sitting at the snap position (the row's left edge)
  // is the selected one. Cards carry no pointer handlers on a phone, so this is
  // the only way in — scroll it into place and it lights up.
  useEffect(() => {
    const row = rowRef.current
    if (!phone || !row) return
    let raf = 0
    let settle = 0
    const pick = () => {
      raf = 0
      const cards = Array.from(row.querySelectorAll('.exp__card'))
      // the snap position is the row's content start (its padding edge), so the
      // selected card is whichever one is resting closest to it
      const r = row.getBoundingClientRect()
      const anchor = r.left + parseFloat(getComputedStyle(row).paddingLeft)
      let best = 0
      let bestD = Infinity
      cards.forEach((c, i) => {
        const d = Math.abs(c.getBoundingClientRect().left - anchor)
        if (d < bestD) {
          bestD = d
          best = i
        }
      })
      pointerRef.current = null // no pointer to grow the highlight from here
      setActive(best)
    }
    // one read per frame while the reel is moving, plus one after it stops:
    // scroll events can stop coming mid-glide (or coalesce), and the card the
    // reel actually settled on is the one that has to end up selected
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(pick)
      clearTimeout(settle)
      settle = setTimeout(pick, 100)
    }
    row.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      row.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
      clearTimeout(settle)
    }
  }, [phone])

  // The copy swaps instantly; the box it lives in eases between the old and new
  // heights so nothing below the section jumps.
  useLayoutEffect(() => {
    const story = storyRef.current
    const el = textRef.current
    if (!story || !el) return

    const from = prevHeight.current
    const to = el.getBoundingClientRect().height
    prevActive.current = active
    prevHeight.current = to

    // the words themselves swap instantly; only the box eases between heights,
    // so the sections below glide instead of snapping
    if (!from || Math.abs(to - from) <= 1) return
    const tween = gsap.fromTo(
      story,
      { height: from },
      {
        height: to,
        duration: 0.5,
        ease: 'power3.out',
        onComplete: () => gsap.set(story, { clearProps: 'height' }),
      }
    )
    return () => tween.kill()
  }, [active])

  const current = exp.items[active]

  return (
    <section className="experience" id="experience">
      <div className="container">
        <MaskedHeading as="h2" className="section-title" text={tr(exp.heading)} />

        <div className="exp__row" data-anim="stagger" ref={rowRef}>
          <div className="exp__marker" ref={markerRef} aria-hidden="true">
            <div className="exp__marker-tailbox" ref={tailBoxRef}>
              <img
                className="exp__marker-tail"
                ref={tailRef}
                src={asset('/img/exp-tail.svg')}
                alt=""
                width="32"
                height="16"
              />
            </div>
          </div>
          {exp.items.map((item, i) => (
            <div
              className={`exp__card${i === active ? ' exp__card--active' : ''}${item.role ? '' : ' exp__card--between'}`}
              data-anim="stagger-item"
              key={`c${i}`}
              tabIndex={phone ? -1 : 0}
              onPointerEnter={
                phone
                  ? undefined
                  : (e) => {
                      pointerRef.current = { x: e.clientX, y: e.clientY }
                      setActive(i)
                    }
              }
              onFocus={
                phone
                  ? undefined
                  : () => {
                      pointerRef.current = null // keyboard: open from the middle
                      setActive(i)
                    }
              }
            >
              {item.role ? (
                <>
                  <div className="exp__card-top">
                    <div className="exp__card-main">
                      <div className="exp__name">{tr(item.company)}</div>
                      <div className="exp__role">{tr(item.role)}</div>
                    </div>
                    {item.logo && (
                      <div className={`exp__logo${item.round ? ' exp__logo--round' : ''}`}>
                        <img src={asset(item.logo)} alt={tr(item.company)} />
                      </div>
                    )}
                  </div>
                  <div className="exp__meta">{tr(item.meta)}</div>
                </>
              ) : (
                <>
                  <div className="exp__name">{tr(item.company)}</div>
                  <div className="exp__meta">{tr(item.meta)}</div>
                </>
              )}
            </div>
          ))}
        </div>

        {current?.text && (
          <div className="exp__story" ref={storyRef}>
            <p className="exp__text" ref={textRef} key={active}>
              {tr(current.text)}
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
