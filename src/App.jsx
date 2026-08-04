import { useRef, useState, useCallback, useEffect } from 'react'
import gsap from 'gsap'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import Experience from './components/Experience.jsx'
import Works from './components/Works.jsx'
import About from './components/About.jsx'
import Footer from './components/Footer.jsx'
import CaseModal from './components/CaseModal.jsx'
import Scrollbar from './components/Scrollbar.jsx'
import useHomeAnimation from './hooks/useHomeAnimation.js'
import useButtonHover from './hooks/useButtonHover.js'
import useSmoothWheel from './hooks/useSmoothWheel.js'

// Lock the page behind the modal (so there's only one scrollbar). No width
// compensation needed: html reserves the scrollbar gutter permanently
// (`scrollbar-gutter: stable`), so hiding the scrollbar can't shift the layout.
function lockPageScroll() {
  document.documentElement.style.overflow = 'hidden'
}
function unlockPageScroll() {
  document.documentElement.style.overflow = ''
}

const getWindow = () => window

export default function App() {
  const scope = useRef(null)
  const [caseOpen, setCaseOpen] = useState(false)
  const [caseCover, setCaseCover] = useState(null)
  const [caseData, setCaseData] = useState(null)
  const originRef = useRef(null) // the clicked cover element

  useHomeAnimation(scope)
  useButtonHover()
  // eased page scrolling (the case modal smooths its own scroller)
  useSmoothWheel(getWindow, { enabled: !caseOpen, ignore: '.case-modal' })

  // safety net: never leave the page locked if a close animation is interrupted
  useEffect(() => {
    if (!caseOpen) unlockPageScroll()
  }, [caseOpen])

  // open the full-screen case modal; the clicked cover FLIP-expands into the hero
  const openCase = useCallback((coverEl, data) => {
    originRef.current = coverEl
    const img = coverEl.querySelector('img')
    setCaseCover(img ? img.src : null)
    if (data) setCaseData(data)
    const first = coverEl.getBoundingClientRect()
    setCaseOpen(true)
    lockPageScroll()

    requestAnimationFrame(() => {
      const heroImg = document.querySelector('.case-modal__hero-img')
      const modal = document.querySelector('.case-modal')
      if (!heroImg || !modal) return
      const last = heroImg.getBoundingClientRect()

      // stage everything *before* the modal becomes visible, so the first
      // painted frame already has the hero sitting exactly on the card
      gsap.set(heroImg, {
        x: first.left - last.left,
        y: first.top - last.top,
        scaleX: first.width / last.width,
        scaleY: first.height / last.height,
        transformOrigin: 'top left',
      })
      gsap.set(coverEl, { autoAlpha: 0 })
      gsap.set(modal, { autoAlpha: 1 })

      // pure morph — no cross-fade
      gsap.to(heroImg, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.7, ease: 'power3.inOut' })
    })
  }, [])

  const closeCase = useCallback(() => {
    const modal = document.querySelector('.case-modal')
    const heroImg = document.querySelector('.case-modal__hero-img')
    const coverEl = originRef.current
    const finish = () => {
      unlockPageScroll()
      if (coverEl) gsap.set(coverEl, { autoAlpha: 1 })
      setCaseOpen(false)
    }
    if (!modal || !heroImg || !coverEl) {
      finish()
      return
    }

    // If the hero is still on screen, morph it back into the card. If the
    // reader scrolled deep into the article, snapping to the top would flash —
    // fade out instead.
    const heroVisible = heroImg.getBoundingClientRect().bottom > 0
    if (!heroVisible) {
      finish()
      return
    }

    // clear the page instantly (no fade), then morph the hero back into the card
    gsap.set('.case-modal__article, .cs-nav, .case-modal__close', { visibility: 'hidden' })
    const first = coverEl.getBoundingClientRect() // where the card sits
    const last = heroImg.getBoundingClientRect() // current hero on screen
    gsap.to(heroImg, {
      x: first.left - last.left,
      y: first.top - last.top,
      scaleX: first.width / last.width,
      scaleY: first.height / last.height,
      transformOrigin: 'top left',
      duration: 0.6,
      ease: 'power3.inOut',
      onComplete: finish,
    })
  }, [])

  return (
    <div className="site" ref={scope}>
      <Header />
      <Hero />
      <main className="content">
        <Experience />
        <Works onOpenCase={openCase} />
        <About />
        <Footer />
      </main>

      <Scrollbar hidden={caseOpen} />

      {caseOpen && <CaseModal cover={caseCover} data={caseData} onClose={closeCase} />}
    </div>
  )
}
