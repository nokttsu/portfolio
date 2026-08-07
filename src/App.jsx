import { useRef, useState, useCallback, useEffect, lazy, Suspense } from 'react'
import gsap from 'gsap'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import Experience from './components/Experience.jsx'
import Works from './components/Works.jsx'
import About from './components/About.jsx'
import Footer from './components/Footer.jsx'
import Preloader from './components/Preloader.jsx'
import Scrollbar from './components/Scrollbar.jsx'
import useHomeAnimation from './hooks/useHomeAnimation.js'
import useButtonHover from './hooks/useButtonHover.js'
import useSmoothWheel from './hooks/useSmoothWheel.js'
import { useLang } from './i18n.jsx'

// the case reader is a separate chunk — nothing needs it until the first click
const CaseModal = lazy(() => import('./components/CaseModal.jsx'))

// Lock the page behind the modal (so there's only one scrollbar). Native
// scrollbars are hidden site-wide, so hiding the page scroll can't shift layout.
function lockPageScroll() {
  document.documentElement.style.overflow = 'hidden'
}
function unlockPageScroll() {
  document.documentElement.style.overflow = ''
}

const getWindow = () => window
const caseUrl = (id) => `${location.pathname}?case=${encodeURIComponent(id)}`
const readCaseId = () => new URLSearchParams(location.search).get('case')

export default function App() {
  const scope = useRef(null)
  const { content } = useLang()
  const [caseOpen, setCaseOpen] = useState(false)
  const [caseCover, setCaseCover] = useState(null)
  const [caseData, setCaseData] = useState(null)
  // deep links open without a morph, so the modal must not wait for staging
  const [caseInstant, setCaseInstant] = useState(false)
  const originRef = useRef(null) // the clicked cover element
  const openRef = useRef(false) // popstate handler needs the live value, not a closure
  const enterRef = useRef(null) // entrance geometry, replayed once the modal mounts

  useHomeAnimation(scope)
  useButtonHover()
  // eased page scrolling (the case modal smooths its own scroller)
  useSmoothWheel(getWindow, { enabled: !caseOpen, ignore: '.case-modal' })

  // The reader is a separate chunk, so the very first click would otherwise
  // spend a beat fetching it before the morph could start. Warm it once the
  // page is idle.
  useEffect(() => {
    const warm = () => import('./components/CaseModal.jsx')
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(warm, { timeout: 3000 })
      return () => cancelIdleCallback(id)
    }
    const id = setTimeout(warm, 1500)
    return () => clearTimeout(id)
  }, [])

  // safety net: never leave the page locked if a close animation is interrupted
  useEffect(() => {
    openRef.current = caseOpen
    if (!caseOpen) unlockPageScroll()
  }, [caseOpen])

  // The card a case grew out of is hidden for the duration of the morph. Give
  // it back before another card takes its place, or it stays invisible on the
  // page behind the modal and leaves a hole in the Works list.
  const releaseOrigin = useCallback((next) => {
    const prev = originRef.current
    if (prev && prev !== next) gsap.set(prev, { autoAlpha: 1 })
  }, [])

  // open a case with no origin element (deep link / back-forward): no morph
  const showCase = useCallback((data) => {
    releaseOrigin(null)
    originRef.current = null
    setCaseData(data)
    setCaseCover(data.cover)
    setCaseInstant(true)
    setCaseOpen(true)
    lockPageScroll()
  }, [releaseOrigin])

  // open the case modal; the clicked cover FLIP-expands into the hero image
  const openCase = useCallback(
    (coverEl, data, { push = true } = {}) => {
      const already = caseOpen
      releaseOrigin(coverEl) // diving from one case into the next
      originRef.current = coverEl
      // the cover photo, not the expand icon that also lives inside the card
      // (a table row hands over its thumbnail directly)
      const img = coverEl?.matches?.('img')
        ? coverEl
        : coverEl?.querySelector('.work__img') || coverEl?.querySelector('img')
      if (img) setCaseCover(img.src)
      if (data) setCaseData(data)
      setCaseInstant(!coverEl)
      if (push && data?.id) history.pushState({ case: data.id }, '', caseUrl(data.id))

      // the entrance runs once the modal reports it is mounted (it is a lazy
      // chunk — on the first open it is not in the DOM yet)
      enterRef.current = { coverEl, first: coverEl?.getBoundingClientRect(), already }
      setCaseOpen(true)
      lockPageScroll()
    },
    [caseOpen, releaseOrigin]
  )

  const playEntrance = useCallback(() => {
    // Consume the geometry: this may be called more than once for one open
    // (React runs layout effects twice in dev). A second staging pass would
    // measure the hero *after* the first one already displaced it, read a zero
    // offset, and animate from the finish line to the finish line — which is
    // exactly what a missing transition looks like.
    const entry = enterRef.current
    enterRef.current = null
    const { coverEl, first, already } = entry || {}
    const heroImg = document.querySelector('.case-modal__hero-img')
    const modal = document.querySelector('.case-modal')
    const scroller = document.querySelector('.case-modal__scroll')
    if (!modal) return
    // switching between cases: start the next one from the top
    if (already && scroller) scroller.scrollTop = 0
    if (!first || !heroImg) {
      gsap.set(modal, { autoAlpha: 1 })
      return
    }
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
    gsap.set('.case-modal__article, .cs-nav, .case-modal__tools', { clearProps: 'visibility' })

    // pure morph — no cross-fade. The card cover and the case hero share both
    // their width and their 12px corners, so nothing has to be tweened but the
    // position.
    gsap.to(heroImg, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 0.7, ease: 'power3.inOut' })
  }, [])

  const closeCase = useCallback(
    (opts) => {
      // may be called straight from onClick, where the arg is an event
      const pop = opts && typeof opts === 'object' && 'pop' in opts ? opts.pop : true
      const modal = document.querySelector('.case-modal')
      const heroImg = document.querySelector('.case-modal__hero-img')
      const coverEl = originRef.current
      if (pop && readCaseId()) history.pushState({}, '', location.pathname)

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
      gsap.set('.case-modal__article, .cs-nav, .case-modal__tools', { visibility: 'hidden' })
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
    },
    []
  )

  // ?case=<id> makes a case shareable: deep links, new tabs and the back button
  useEffect(() => {
    if (!content.cases?.length) return
    const sync = () => {
      const id = readCaseId()
      const found = id && content.cases.find((c) => c.id === id)
      if (found) {
        if (!openRef.current || readCaseId() !== caseData?.id) showCase(found)
      } else if (openRef.current) closeCase({ pop: false })
    }
    sync()
    window.addEventListener('popstate', sync)
    return () => window.removeEventListener('popstate', sync)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content.cases])

  return (
    <div className="site" ref={scope}>
      <Preloader />
      <Header />
      <Hero />
      <main className="content">
        <Experience />
        <Works onOpenCase={openCase} />
        <About />
        <Footer />
      </main>

      <Scrollbar hidden={caseOpen} />

      {caseOpen && (
        <Suspense fallback={null}>
          <CaseModal
            cover={caseCover}
            data={caseData}
            instant={caseInstant}
            onReady={playEntrance}
            onClose={closeCase}
            onOpenCase={openCase}
          />
        </Suspense>
      )}
    </div>
  )
}
