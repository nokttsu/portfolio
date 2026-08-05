import { useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// expose for manual ticking during preview verification (preview pane may not run rAF)
if (import.meta.env.DEV) {
  window.gsap = gsap
  window.ScrollTrigger = ScrollTrigger
}

export default function useHomeAnimation(scopeRef) {
  useLayoutEffect(() => {
    const ctx = gsap.context((self) => {
      const q = self.selector

      // ---- Hero intro (on load) ----
      // starts as the preloader panel clears the screen
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.9 })

      tl.from(q('[data-anim="header"]'), { y: -20, autoAlpha: 0, duration: 0.8 }, 0)
      // (the hero title uses the SplitText masked reveal set up below, after fonts load)
      tl.from(q('[data-anim="intro"]'), { y: 24, autoAlpha: 0, duration: 0.9 }, 0.35)
      tl.from(q('[data-anim="hero-nav"]'), { y: 16, autoAlpha: 0, duration: 0.8 }, 0.5)

      // ---- Hero scroll-out transition ----
      // The hero is fixed behind the page. As the black content slides up over
      // it, the hero fades to transparent and its text drifts upward. Scrubbed
      // over roughly one viewport of scroll.
      const heroOut = gsap.timeline({
        scrollTrigger: {
          start: 0,
          end: () => window.innerHeight,
          scrub: 0.4,
          invalidateOnRefresh: true,
        },
      })
      heroOut
        // "Slides Pinning" transition (GreenSock pen bGRdvMy): the hero scales
        // back and fades out as the next block slides up over it.
        .fromTo(
          q('.hero'),
          { scale: 1, autoAlpha: 1, borderRadius: 0 },
          { scale: 0.7, autoAlpha: 0.5, borderRadius: 24, duration: 0.9, ease: 'none' },
          0
        )
        .to(q('.hero'), { autoAlpha: 0, duration: 0.1, ease: 'none' }, 0.9)
        // the black sheet's rounded top corners shrink 64px -> 0 as it rises
        .to(q('.content'), { borderTopLeftRadius: 0, borderTopRightRadius: 0, duration: 1, ease: 'none' }, 0)

      // ---- Scroll reveals ----
      // Fire as soon as the element's top enters the viewport from the bottom.
      // A fixed "% of viewport" start (or any bottom-=N offset) can sit past the
      // page's max scroll for an element flush at the very bottom, leaving it
      // stuck hidden — that is what made the footer disappear in Chrome.
      // 'top bottom' is always reachable; a guard below covers any leftover edge.
      const START = 'top bottom'

      q('[data-anim="fade"]').forEach((el) => {
        gsap.from(el, {
          y: 40,
          autoAlpha: 0,
          duration: 0.9,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: START, once: true },
        })
      })

      q('[data-anim="stagger"]').forEach((row) => {
        gsap.from(row.querySelectorAll('[data-anim="stagger-item"]'), {
          y: 40,
          autoAlpha: 0,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: { trigger: row, start: START, once: true },
        })
      })

      // Cases behave like a deck: the one coming up from the bottom grows from
      // 80% to full size, and as it leaves the top it shrinks back to 80%.
      q('[data-anim="work"]').forEach((el) => {
        gsap.fromTo(
          el,
          { scale: 0.8 },
          {
            scale: 1,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'top 25%', scrub: 0.4 },
          }
        )
        // explicit start value + no immediate render, otherwise this tween bakes
        // 0.8 as its "from" (the entrance already set it) and never shrinks
        gsap.fromTo(
          el,
          { scale: 1 },
          {
            scale: 0.8,
            ease: 'none',
            immediateRender: false,
            scrollTrigger: { trigger: el, start: 'bottom 75%', end: 'bottom top', scrub: 0.4 },
          }
        )
      })

      // covers uncover themselves instead of fading in
      q('[data-reveal="clip"]').forEach((el) => {
        gsap.to(el, {
          clipPath: 'inset(0% 0 0 0)',
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: START, once: true },
        })
      })
    }, scopeRef)

    // (Headings use their own SplitText masked reveal in <MaskedHeading>.)

    // Media (hero video, images) loads after layout, shifting trigger
    // positions — recompute once everything has loaded. Also force-reveal any
    // one-shot trigger whose start ended up past the page's max scroll (an
    // element flush at the very bottom on a tall viewport).
    const refresh = () => {
      ScrollTrigger.refresh()
      const max = ScrollTrigger.maxScroll(window)
      ScrollTrigger.getAll().forEach((st) => {
        if (st.animation && !st.vars.scrub && st.start > max + 1) {
          st.animation.progress(1)
        }
      })
    }
    window.addEventListener('load', refresh)
    const t = setTimeout(refresh, 800)

    return () => {
      window.removeEventListener('load', refresh)
      clearTimeout(t)
      ctx.revert()
    }
  }, [scopeRef])
}
