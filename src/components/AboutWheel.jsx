import { useRef, useEffect, useMemo } from 'react'
import { asset } from '../asset.js'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const N = 12
const BASE_VEL = 0.0016 // idle orbit speed (rad / frame)
const SPEED_TO_GAP = 650 // how strongly spin speed widens the gap
const MAX_EXTRA = 150 // max extra radius from fast spinning
const TILE_W = 168 // widest tile — kept inside the band edges
const TILE_H = 168 // tallest tile

/**
 * Draggable 3D orbit wheel (madewithgsap tutorial106 vibe): tiles orbit a
 * central point; drag to spin — the faster you spin, the wider the gap grows.
 * Photos come from the CMS (`about.photos`) and repeat to fill the ring.
 */
export default function AboutWheel({ photos = [] }) {
  const bandRef = useRef(null)
  const ringRef = useRef(null)

  // landscape photos -> 4:3 tiles, portrait -> 3:4, repeated around the ring
  const tilesData = useMemo(() => {
    const list = photos.length ? photos : [{ src: '/img/about/1.jpg' }]
    const wide = list.filter((p) => !p.tall)
    const tall = list.filter((p) => p.tall)
    const pick = (arr, i) => (arr.length ? arr[i % arr.length] : list[i % list.length])
    return Array.from({ length: N }, (_, i) => {
      const isTall = i % 2 === 1
      const p = pick(isTall ? tall : wide, Math.floor(i / 2))
      return { tall: isTall, src: asset(p.src) }
    })
  }, [photos])

  useEffect(() => {
    const band = bandRef.current
    const ring = ringRef.current
    if (!band || !ring) return
    const tiles = Array.from(ring.querySelectorAll('.wheel__tile'))
    const angles = tiles.map((_, i) => (i / tiles.length) * Math.PI * 2)

    // radii follow the band size, so the ring always reaches its edges.
    // Tile sizes are read from the DOM (CSS shrinks them on small screens),
    // otherwise the ring would orbit wider than the band on a phone.
    let baseRX = 320
    let baseRY = 110
    let maxExtra = MAX_EXTRA
    const measure = () => {
      const tw = tiles[0]?.offsetWidth || TILE_W
      const th = tiles.reduce((m, t) => Math.max(m, t.offsetHeight), 0) || TILE_H
      baseRX = Math.max(90, (band.clientWidth - tw) / 2)
      baseRY = Math.max(40, (band.clientHeight - th) / 2)
      maxExtra = Math.min(MAX_EXTRA, baseRX * 0.5)
    }
    measure()

    const s = { rotation: 0, angVel: BASE_VEL, radius: baseRX, speed: 0, dragging: false, lastDelta: 0 }

    // Until the section is reached the photos sit in one pile in the middle,
    // each dropped at a slight angle. `spread` carries them out to the ring.
    const spread = tiles.map(() => ({ v: 0 }))
    const tilt = tiles.map(() => gsap.utils.random(-14, 14))

    const place = () => {
      const rx = s.radius
      const ry = baseRY * (s.radius / baseRX) // keep the ellipse proportional
      for (let i = 0; i < tiles.length; i++) {
        const a = angles[i] + s.rotation
        const out = spread[i].v
        const x = Math.cos(a) * rx * out
        const y = Math.sin(a) * ry * out
        const r = (1 - out) * tilt[i] // straightens as it leaves the pile
        tiles[i].style.transform =
          `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${r.toFixed(2)}deg)`
      }
    }

    const update = () => {
      if (s.dragging) {
        s.lastDelta *= 0.85 // decay if the pointer pauses mid-drag
      } else {
        s.angVel += (BASE_VEL - s.angVel) * 0.03 // momentum eases back to idle spin
        s.rotation += s.angVel
      }
      const inst = Math.abs(s.dragging ? s.lastDelta : s.angVel)
      s.speed += (inst - s.speed) * 0.15
      const extra = Math.min(Math.max(s.speed - BASE_VEL, 0) * SPEED_TO_GAP, maxExtra)
      s.radius += (baseRX + extra - s.radius) * 0.1
      place()
    }
    gsap.ticker.add(update)

    // deal the pile out into the ring when the block comes into view
    const reveal = ScrollTrigger.create({
      trigger: band,
      start: 'top bottom',
      once: true,
      onEnter: () =>
        gsap.to(spread, {
          v: 1,
          duration: 1.3,
          ease: 'power3.out',
          stagger: { each: 0.06, from: 'random' },
        }),
    })

    // ---- drag to spin ----
    const angleOf = (e) => {
      const r = band.getBoundingClientRect()
      return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2))
    }
    let lastAngle = 0
    const onDown = (e) => {
      s.dragging = true
      band.classList.add('is-dragging')
      lastAngle = angleOf(e)
      band.setPointerCapture?.(e.pointerId)
    }
    const onMove = (e) => {
      if (s.dragging) {
        const a = angleOf(e)
        let d = a - lastAngle
        if (d > Math.PI) d -= Math.PI * 2
        if (d < -Math.PI) d += Math.PI * 2
        s.rotation += d
        s.angVel = d // carried as momentum on release
        s.lastDelta = d
        lastAngle = a
      } else {
        const r = band.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width - 0.5
        const py = (e.clientY - r.top) / r.height - 0.5
        gsap.to(ring, { rotationX: -py * 14, rotationY: px * 14, duration: 0.6, ease: 'power3', overwrite: 'auto' })
      }
    }
    const onUp = () => {
      s.dragging = false
      band.classList.remove('is-dragging')
    }
    const onLeave = () => {
      if (!s.dragging) gsap.to(ring, { rotationX: 0, rotationY: 0, duration: 0.6, ease: 'power3' })
    }
    band.addEventListener('pointerdown', onDown)
    band.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    band.addEventListener('pointerleave', onLeave)
    window.addEventListener('resize', measure)

    return () => {
      reveal.kill()
      gsap.ticker.remove(update)
      band.removeEventListener('pointerdown', onDown)
      band.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      band.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('resize', measure)
    }
  }, [tilesData])

  return (
    <div className="about__wheel" data-anim="fade" ref={bandRef}>
      <div className="wheel__ring" ref={ringRef}>
        {tilesData.map((t, i) => (
          <div key={i} className={`wheel__tile ${t.tall ? 'wheel__tile--tall' : 'wheel__tile--wide'}`}>
            <img src={t.src} alt="" draggable="false" loading="lazy" decoding="async" />
          </div>
        ))}
      </div>
    </div>
  )
}
