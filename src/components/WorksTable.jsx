import { useRef, useEffect } from 'react'
import { asset } from '../asset.js'
import gsap from 'gsap'
import { useLang } from '../i18n.jsx'

export default function WorksTable({ onOpenCase, rows = [] }) {
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
    let shown = false // is the hover preview currently up?

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
        shown = true
      }
      row.addEventListener('mouseenter', enter)
      cleanups.push(() => row.removeEventListener('mouseenter', enter))
    })

    const leave = () => {
      if (!shown) return
      shown = false
      gsap.to(hl, { autoAlpha: 0, duration: 0.3, ease: 'power2.out' })
      gsap.to(thumb, { autoAlpha: 0, scale: 0.8, duration: 0.25, ease: 'power2.in' })
    }
    table.addEventListener('mousemove', moveThumb)
    table.addEventListener('mouseleave', leave)
    cleanups.push(() => table.removeEventListener('mousemove', moveThumb))
    cleanups.push(() => table.removeEventListener('mouseleave', leave))

    // `mouseleave` on the table can be missed (fast exits, overlapping controls),
    // which left the preview hanging in mid-air — so also watch the pointer
    // globally and hide as soon as it isn't over this table any more.
    const onDocMove = (e) => {
      const inside = e.target instanceof Element && table.contains(e.target)
      if (inside) shown = true
      else leave()
    }
    const onWinBlur = () => leave()
    document.addEventListener('pointermove', onDocMove, true)
    window.addEventListener('blur', onWinBlur)
    cleanups.push(() => document.removeEventListener('pointermove', onDocMove, true))
    cleanups.push(() => window.removeEventListener('blur', onWinBlur))

    return () => cleanups.forEach((fn) => fn())
  }, [rows])

  return (
    <div className="works__table" ref={tableRef}>
      <div className="wt-highlight" ref={highlightRef} aria-hidden="true" />

      {rows.map((row, i) => (
        <div
          className="wt-row"
          key={row.id || row.title || i}
          data-cover={asset(row.cover)}
          onClick={() => onOpenCase(thumbRef.current, row)}
        >
          <div className="wt-name">{row.title}</div>
          <div className="wt-metrics">
            {(row.metrics || []).map((m) => (
              <span key={m}>{t(m)}</span>
            ))}
          </div>
        </div>
      ))}

      <div className="wt-thumb" ref={thumbRef} aria-hidden="true">
        <img src={asset(rows[0]?.cover || '/img/covers/cover1.png')} alt="" />
      </div>
    </div>
  )
}
