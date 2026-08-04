import { useEffect } from 'react'
import gsap from 'gsap'
import { ScrollToPlugin } from 'gsap/ScrollToPlugin'

gsap.registerPlugin(ScrollToPlugin)

const SPEED = 1.35 // travel per wheel notch
const DURATION = 0.2 // short glide — snappy, but still eased

/**
 * Eased wheel scrolling. Instead of ScrollSmoother (which transforms a wrapper
 * and would break our `position: fixed` header/hero, and wouldn't reach the case
 * modal's own scroller), we simply animate the scroll position with GSAP.
 *
 * @param {() => (Window | HTMLElement | null)} getScroller
 * @param {{ enabled?: boolean, ignore?: string }} options
 */
export default function useSmoothWheel(getScroller, { enabled = true, ignore } = {}) {
  useEffect(() => {
    if (!enabled) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const isWindow = (s) => s === window
    const pos = (s) => (isWindow(s) ? window.scrollY : s.scrollTop)
    const maxScroll = (s) =>
      isWindow(s)
        ? document.documentElement.scrollHeight - window.innerHeight
        : s.scrollHeight - s.clientHeight

    let target = null
    let tween = null

    const onWheel = (e) => {
      const scroller = getScroller()
      if (!scroller) return
      if (e.ctrlKey) return // pinch-zoom
      // let another scroller (e.g. the case modal) handle its own area
      if (ignore && e.target.closest?.(ignore)) return

      const max = maxScroll(scroller)
      if (max <= 0) return

      const current = pos(scroller)
      if (target === null || !tween || !tween.isActive()) target = current
      target = gsap.utils.clamp(0, max, target + e.deltaY * SPEED)

      e.preventDefault()
      tween = gsap.to(scroller, {
        scrollTo: { y: target, autoKill: false },
        duration: DURATION,
        ease: 'power2.out',
        overwrite: true,
      })
    }

    // keep the target in sync when scrolling happens another way (anchors, keys)
    const onScroll = () => {
      if (!tween || !tween.isActive()) target = null
    }

    const el = getScroller()
    const evtTarget = el && !isWindow(el) ? el : window
    evtTarget.addEventListener('wheel', onWheel, { passive: false })
    evtTarget.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      evtTarget.removeEventListener('wheel', onWheel)
      evtTarget.removeEventListener('scroll', onScroll)
      tween?.kill()
    }
  }, [getScroller, enabled, ignore])
}
