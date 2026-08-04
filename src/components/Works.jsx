import { useRef, useState, useLayoutEffect } from 'react'
import { asset } from '../asset.js'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import MaskedHeading from './MaskedHeading.jsx'
import WorksTable from './WorksTable.jsx'
import { useLang } from '../i18n.jsx'

function WorkCard({ w, onOpenCase, t }) {
  const cardRef = useRef(null)
  const open = () => onOpenCase(cardRef.current.querySelector('.work__cover'), w)

  return (
    <article className="work" data-anim="work" ref={cardRef} role="button" tabIndex={0}
      onClick={open} onKeyDown={(e) => (e.key === 'Enter' ? open() : null)}>
      <div className="work__cover">
        <img src={asset(w.cover)} alt={w.title} />
      </div>
      <div className="work__info">
        <div className="work__titles">
          <div className="work__title">{w.title}</div>
        </div>
        <div className="work__metrics">
          {w.metrics.map((m) => (
            <span key={m}>{t(m)}</span>
          ))}
        </div>
      </div>
    </article>
  )
}

export default function Works({ onOpenCase }) {
  const { content, t, tr } = useLang()
  const cases = content.cases
  const step = content.works?.step || 4

  const [view, setView] = useState('list')
  const [count, setCount] = useState(step)
  const bodyRef = useRef(null)
  const listRef = useRef(null)
  const prevCount = useRef(step)

  // animate the swap between List and Table views
  useLayoutEffect(() => {
    if (!bodyRef.current) return
    const ctx = gsap.context(() => {
      gsap.fromTo(bodyRef.current, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out' })
    }, bodyRef)
    prevCount.current = count // view change re-renders all visible cards
    // the swap changes the page height a lot — stale trigger positions would
    // leave the sections below stuck hidden (and looking like a blank gap)
    ScrollTrigger.refresh()
    return () => ctx.revert()
  }, [view])

  // smoothly reveal the cards added by "Show more"
  useLayoutEffect(() => {
    if (view !== 'list' || !listRef.current) return
    const cards = listRef.current.querySelectorAll('.work')
    if (count > prevCount.current) {
      const fresh = Array.from(cards).slice(prevCount.current)
      gsap.from(fresh, {
        y: 60,
        autoAlpha: 0,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.1,
      })
    }
    prevCount.current = count
    ScrollTrigger.refresh()
  }, [count, view])

  const visible = cases.slice(0, count)
  const hasMore = count < cases.length

  return (
    <section className="works" id="works">
      <div className="container">
        <div className="works__head">
          <MaskedHeading as="h2" className="section-title" text={tr(content.works?.heading)} />
          <div className="works__toggle" data-anim="fade">
            <button
              className={`works__toggle-btn${view === 'list' ? ' works__toggle-btn--active' : ''}`}
              onClick={() => setView('list')}
            >
              {t('listView')}
            </button>
            <button
              className={`works__toggle-btn${view === 'table' ? ' works__toggle-btn--active' : ''}`}
              onClick={() => setView('table')}
            >
              {t('tableView')}
            </button>
          </div>
        </div>

        <div className="works__body" ref={bodyRef} key={view}>
          {view === 'list' ? (
            <>
              <div className="works__list" ref={listRef}>
                {visible.map((w) => (
                  <WorkCard key={w.id} w={w} onOpenCase={onOpenCase} t={t} />
                ))}
              </div>
              {hasMore && (
                <div className="works__more">
                  <button className="pill pill--white" onClick={() => setCount((c) => c + step)}>
                    {t('showMore')}
                  </button>
                </div>
              )}
            </>
          ) : (
            <WorksTable onOpenCase={onOpenCase} rows={cases} />
          )}
        </div>
      </div>
    </section>
  )
}
