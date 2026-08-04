import { useMemo, useRef, useState, useLayoutEffect } from 'react'
import { asset } from '../asset.js'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import MaskedHeading from './MaskedHeading.jsx'
import WorksTable from './WorksTable.jsx'
import { useLang } from '../i18n.jsx'

const WORKS = [
  { id: 'colozeo', title: 'Colozeo', metrics: ['AWARD', '+20% CTR', '+10% MAU'] },
  { id: 'innovaflow', title: 'InnovaFlow', metrics: ['FINALIST', '+18% CTR', '+9% MAU'] },
  { id: 'spectratech', title: 'SpectraTech', metrics: ['AWARD', '+25% CTR', '+12% MAU'] },
  { id: 'nexify', title: 'Nexify', metrics: ['FINALIST', '+15% CTR', '+8% MAU'] },
  { id: 'trackfusion', title: 'TrackFusion', metrics: ['HONORABLE MENTION', '+12% CTR', '+5% MAU'] },
  { id: 'pulsewave', title: 'PulseWave', metrics: ['HONORABLE MENTION', '+14% CTR', '+7% MAU'] },
  { id: 'echostream', title: 'EchoStream', metrics: ['AWARD', '+30% CTR', '+15% MAU'] },
  { id: 'visionarygrid', title: 'VisionaryGrid', metrics: ['FINALIST', '+10% CTR', '+6% MAU'] },
  { id: 'brightminds', title: 'BrightMinds', metrics: ['HONORABLE MENTION', '+22% CTR', '+11% MAU'] },
  { id: 'orbitx', title: 'OrbitX', metrics: ['AWARD', '+27% CTR', '+13% MAU'] },
  { id: 'catalyst90', title: 'Catalyst90', metrics: ['FINALIST', '+16% CTR', '+8% MAU'] },
  { id: 'devpulse', title: 'DevPulse', metrics: ['HONORABLE MENTION', '+19% CTR', '+10% MAU'] },
]

const COVERS = [asset('/img/covers/cover1.png'), asset('/img/covers/cover2.png'), asset('/img/covers/cover3.png'), asset('/img/covers/cover4.png')]
const STEP = 4

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function WorkCard({ w, cover, onOpenCase, t }) {
  const cardRef = useRef(null)
  const open = () => onOpenCase(cardRef.current.querySelector('.work__cover'))

  return (
    <article className="work" data-anim="work" ref={cardRef} role="button" tabIndex={0}
      onClick={open} onKeyDown={(e) => (e.key === 'Enter' ? open() : null)}>
      <div className="work__cover">
        <img src={cover} alt={w.title} />
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
  const { t } = useLang()
  const covers = useMemo(() => shuffle(COVERS), [])
  const [view, setView] = useState('list')
  const [count, setCount] = useState(STEP)
  const bodyRef = useRef(null)
  const listRef = useRef(null)
  const prevCount = useRef(STEP)

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

  const visible = WORKS.slice(0, count)
  const hasMore = count < WORKS.length

  return (
    <section className="works" id="works">
      <div className="container">
        <div className="works__head">
          <MaskedHeading as="h2" className="section-title" text={t('works')} />
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
                {visible.map((w, i) => (
                  <WorkCard key={w.id} w={w} cover={covers[i % covers.length]} onOpenCase={onOpenCase} t={t} />
                ))}
              </div>
              {hasMore && (
                <div className="works__more">
                  <button className="pill pill--white" onClick={() => setCount((c) => c + STEP)}>
                    {t('showMore')}
                  </button>
                </div>
              )}
            </>
          ) : (
            <WorksTable onOpenCase={onOpenCase} />
          )}
        </div>
      </div>
    </section>
  )
}
