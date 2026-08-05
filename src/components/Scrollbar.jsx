import { useEffect, useRef } from 'react'
import gsap from 'gsap'

const MIN_THUMB = 48
const IDLE_MS = 900 // how long it stays visible after the last scroll
const EDGE_ZONE = 60 // pointer distance from the right edge that reveals it

/**
 * Overlay scrollbar: floats above the content and takes no layout width (native
 * bars are hidden site-wide). Visible only while scrolling, while the pointer is
 * near the right edge, or while dragging. Works for the page (default) or any
 * scrollable element (the case modal).
 */
export default function Scrollbar({ hidden = false, getTarget }) {
  const barRef = useRef(null)
  const thumbRef = useRef(null)

  useEffect(() => {
    const bar = barRef.current
    const thumb = thumbRef.current
    if (!bar || !thumb) return

    const setY = gsap.quickSetter(thumb, 'y', 'px')
    let trackH = 0
    let thumbH = MIN_THUMB
    let maxScroll = 0
    let dragging = false
    let nearEdge = false
    let idleTimer = null

    const target = () => (getTarget ? getTarget() : window)
    const isWin = (t) => !t || t === window
    const scrollTop = (t) => (isWin(t) ? window.scrollY : t.scrollTop)
    const viewH = (t) => (isWin(t) ? window.innerHeight : t.clientHeight)
    const fullH = (t) => (isWin(t) ? document.documentElement.scrollHeight : t.scrollHeight)

    const reveal = () => {
      bar.classList.add('is-visible')
      clearTimeout(idleTimer)
      idleTimer = setTimeout(() => {
        if (!dragging && !nearEdge) bar.classList.remove('is-visible')
      }, IDLE_MS)
    }

    // Measuring on every frame forced a layout recalc 60x/sec and made the whole
    // page feel heavy — take the sizes only when they can actually change.
    let scrollable = false
    const measure = () => {
      const t = target()
      if (hidden || !t) {
        scrollable = false
        bar.classList.remove('is-on')
        return
      }
      const total = fullH(t)
      const view = viewH(t)
      maxScroll = total - view
      scrollable = maxScroll > 1
      bar.classList.toggle('is-on', scrollable)
      if (!scrollable) return
      trackH = bar.clientHeight
      const h = Math.max(MIN_THUMB, (view / total) * trackH)
      if (h !== thumbH) {
        thumbH = h
        thumb.style.height = `${h}px`
      }
    }

    let lastTop = -1
    const update = () => {
      if (!scrollable || dragging) return
      const top = scrollTop(target()) // cheap read; no layout is invalidated here
      if (top === lastTop) return
      lastTop = top
      setY((top / maxScroll) * (trackH - thumbH))
      reveal() // scrolling reveals it
    }

    measure()
    gsap.ticker.add(update) // stays in sync with the eased wheel scrolling
    window.addEventListener('resize', measure)
    // content height changes (Show more, view switch, images loading)
    const ro = new ResizeObserver(measure)
    const observed = isWin(target()) ? document.documentElement : target()
    if (observed) ro.observe(observed)

    // reveal when the pointer comes near the right edge
    const onPointerMove = (e) => {
      const near = window.innerWidth - e.clientX <= EDGE_ZONE
      if (near !== nearEdge) {
        nearEdge = near
        if (near) bar.classList.add('is-visible')
        else reveal()
      }
    }
    window.addEventListener('pointermove', onPointerMove)

    // drag the thumb to scroll
    let startY = 0
    let startScroll = 0
    const onDown = (e) => {
      dragging = true
      startY = e.clientY
      startScroll = scrollTop(target())
      bar.classList.add('is-visible')
      thumb.setPointerCapture?.(e.pointerId)
      e.preventDefault()
    }
    const onMove = (e) => {
      if (!dragging) return
      const span = trackH - thumbH
      if (span <= 0) return
      const t = target()
      const delta = ((e.clientY - startY) / span) * maxScroll
      const y = gsap.utils.clamp(0, maxScroll, startScroll + delta)
      if (isWin(t)) window.scrollTo(0, y)
      else t.scrollTop = y
      setY((y / maxScroll) * span)
    }
    const onUp = () => {
      if (!dragging) return
      dragging = false
      reveal()
    }
    thumb.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)

    return () => {
      clearTimeout(idleTimer)
      ro.disconnect()
      gsap.ticker.remove(update)
      window.removeEventListener('resize', measure)
      window.removeEventListener('pointermove', onPointerMove)
      thumb.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [hidden, getTarget])

  return (
    <div className="scrollbar" ref={barRef} aria-hidden="true">
      <div className="scrollbar__thumb" ref={thumbRef} />
    </div>
  )
}
