import { useRef, useEffect, useMemo } from 'react'
import { asset } from '../asset.js'
import gsap from 'gsap'

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

    // radii follow the band size, so the ring always reaches its edges
    let baseRX = 320
    let baseRY = 110
    const measure = () => {
      baseRX = Math.max(220, (band.clientWidth - TILE_W) / 2)
      baseRY = Math.max(60, (band.clientHeight - TILE_H) / 2)
    }
    measure()

    const s = { rotation: 0, angVel: BASE_VEL, radius: baseRX, speed: 0, dragging: false, lastDelta: 0 }

    const place = () => {
      const rx = s.radius
      const ry = baseRY * (s.radius / baseRX) // keep the ellipse proportional
      for (let i = 0; i < tiles.length; i++) {
        const a = angles[i] + s.rotation
        const x = Math.cos(a) * rx
        const y = Math.sin(a) * ry
        tiles[i].style.transform = `translate(-50%, -50%) translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
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
      const extra = Math.min(Math.max(s.speed - BASE_VEL, 0) * SPEED_TO_GAP, MAX_EXTRA)
      s.radius += (baseRX + extra - s.radius) * 0.1
      place()
    }
    gsap.ticker.add(update)

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
