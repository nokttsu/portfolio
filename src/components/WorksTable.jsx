import { useRef, useEffect } from 'react'
import { asset } from '../asset.js'
import gsap from 'gsap'
import { useLang } from '../i18n.jsx'

const COVERS = [asset('/img/covers/cover1.png'), asset('/img/covers/cover2.png'), asset('/img/covers/cover3.png'), asset('/img/covers/cover4.png')]

const ROWS = [
  { name: 'InnovaFlow', metrics: ['FINALIST', '+18% CTR', '+9% MAU'] },
  { name: 'SpectraTech', metrics: ['AWARD', '+25% CTR', '+12% MAU'] },
  { name: 'Nexify', metrics: ['FINALIST', '+15% CTR', '+8% MAU'] },
  { name: 'TrackFusion', metrics: ['HONORABLE MENTION', '+12% CTR', '+5% MAU'] },
  { name: 'Colozeo', metrics: ['AWARD', '+20% CTR', '+10% MAU'] },
  { name: 'PulseWave', metrics: ['HONORABLE MENTION', '+14% CTR', '+7% MAU'] },
  { name: 'EchoStream', metrics: ['AWARD', '+30% CTR', '+15% MAU'] },
  { name: 'VisionaryGrid', metrics: ['FINALIST', '+10% CTR', '+6% MAU'] },
  { name: 'BrightMinds', metrics: ['HONORABLE MENTION', '+22% CTR', '+11% MAU'] },
  { name: 'OrbitX', metrics: ['AWARD', '+27% CTR', '+13% MAU'] },
  { name: 'Catalyst90', metrics: ['FINALIST', '+16% CTR', '+8% MAU'] },
  { name: 'DevPulse', metrics: ['HONORABLE MENTION', '+19% CTR', '+10% MAU'] },
  { name: 'SkyMetrics', metrics: ['AWARD', '+23% CTR', '+14% MAU'] },
]

export default function WorksTable({ onOpenCase, rows = ROWS }) {
  const { t } = useLang()
  const tableRef = useRef(null)
  const highlightRef = useRef(null)
  const thumbRef = useRef(null)

  useEffect(() => {
    const table = tableRef.current
    const hl = highlightRef.current
    const thumb = thumbRef.current
    if (!table) return

    gsap.set(thumb, { xPercent: -50, yPercent: -50, autoAlpha: 0, scale: 0.8 })
    const xTo = gsap.quickTo(thumb, 'x', { duration: 0.5, ease: 'power3' })
    const yTo = gsap.quickTo(thumb, 'y', { duration: 0.5, ease: 'power3' })

    const rowEls = [...table.querySelectorAll('.wt-row')]
    const cleanups = []

    const moveThumb = (e) => {
      const r = table.getBoundingClientRect()
      xTo(e.clientX - r.left)
      yTo(e.clientY - r.top)
    }

    rowEls.forEach((row) => {
      const enter = () => {
        // slide the highlight to this row (magic-line style)
        gsap.to(hl, {
          y: row.offsetTop + (row.offsetHeight - 64) / 2,
          autoAlpha: 1,
          duration: 0.4,
          ease: 'power3',
        })
        // swap + reveal the floating cover preview
        const img = thumb.querySelector('img')
        img.src = row.dataset.cover
        gsap.to(thumb, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' })
      }
      row.addEventListener('mouseenter', enter)
      cleanups.push(() => row.removeEventListener('mouseenter', enter))
    })

    const leave = () => {
      gsap.to(hl, { autoAlpha: 0, duration: 0.3, ease: 'power2.out' })
      gsap.to(thumb, { autoAlpha: 0, scale: 0.8, duration: 0.25, ease: 'power2.in' })
    }
    table.addEventListener('mousemove', moveThumb)
    table.addEventListener('mouseleave', leave)
    cleanups.push(() => table.removeEventListener('mousemove', moveThumb))
    cleanups.push(() => table.removeEventListener('mouseleave', leave))

    return () => cleanups.forEach((fn) => fn())
  }, [rows])

  return (
    <div className="works__table" ref={tableRef}>
      <div className="wt-highlight" ref={highlightRef} aria-hidden="true" />

      {rows.map((row, i) => (
        <div
          className="wt-row"
          key={row.name}
          data-cover={COVERS[i % COVERS.length]}
          onClick={() => onOpenCase(thumbRef.current)}
        >
          <div className="wt-name">{row.name}</div>
          <div className="wt-metrics">
            {row.metrics.map((m) => (
              <span key={m}>{t(m)}</span>
            ))}
          </div>
        </div>
      ))}

      <div className="wt-thumb" ref={thumbRef} aria-hidden="true">
        <img src={COVERS[0]} alt="" />
      </div>
    </div>
  )
}
