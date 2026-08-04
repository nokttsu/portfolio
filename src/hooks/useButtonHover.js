import { useEffect } from 'react'
import gsap from 'gsap'

// Every button-ish control on the site (header actions, kebab pills, view tabs,
// Show more, case-modal buttons…) shrinks a touch on hover.
const SELECTOR = [
  '.pill',
  '.header__icon-btn',
  '.kebab__pill',
  '.works__toggle-btn',
  '.cs-head__cta',
].join(',')

const SCALE = 0.94

export default function useButtonHover() {
  useEffect(() => {
    // delegated so it also covers buttons inside the case modal, which mounts later
    const over = (e) => {
      const btn = e.target.closest?.(SELECTOR)
      if (!btn || btn.contains(e.relatedTarget)) return
      gsap.to(btn, { scale: SCALE, duration: 0.3, ease: 'power3', overwrite: 'auto' })
    }
    const out = (e) => {
      const btn = e.target.closest?.(SELECTOR)
      if (!btn || btn.contains(e.relatedTarget)) return
      gsap.to(btn, { scale: 1, duration: 0.35, ease: 'power3', overwrite: 'auto' })
    }
    document.addEventListener('pointerover', over)
    document.addEventListener('pointerout', out)
    return () => {
      document.removeEventListener('pointerover', over)
      document.removeEventListener('pointerout', out)
    }
  }, [])
}
