import { useRef, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase)
if (!CustomEase.get?.('osmo-ease')) CustomEase.create('osmo-ease', '0.625, 0.05, 0, 1')

/**
 * Heading whose text slides up out of a per-line mask (Osmo / GSAP SplitText).
 * Re-splits whenever `text` changes, so switching language re-plays the reveal.
 */
export default function MaskedHeading({ as: Tag = 'h2', text, className = '', onLoad = false }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let split
    let tween
    let cancelled = false

    document.fonts.ready.then(() => {
      if (cancelled || !el) return
      // The previous effect's split.revert() restores the text captured when it
      // split — i.e. the old language — clobbering React's update. Re-assert the
      // current text before splitting again.
      if (el.textContent !== text) el.textContent = text
      split = new SplitText(el, {
        type: 'lines,words',
        mask: 'lines',
        linesClass: 'line',
        wordsClass: 'word',
      })
      gsap.set(el, { autoAlpha: 1 })
      tween = gsap.fromTo(
        split.words,
        { yPercent: 130 },
        {
          yPercent: 0,
          duration: 0.8,
          stagger: 0.06,
          ease: 'osmo-ease',
          ...(onLoad
            ? { delay: 0.45 }
            : { scrollTrigger: { trigger: el, start: 'top bottom', once: true } }),
        }
      )
      ScrollTrigger.refresh()
    })

    return () => {
      cancelled = true
      if (tween) {
        tween.scrollTrigger && tween.scrollTrigger.kill()
        tween.kill()
      }
      if (split) split.revert()
    }
  }, [text, onLoad])

  return (
    <Tag ref={ref} className={className} style={{ visibility: 'hidden' }}>
      {text}
    </Tag>
  )
}
