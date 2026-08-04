import MaskedHeading from './MaskedHeading.jsx'
import AboutWheel from './AboutWheel.jsx'
import { useLang } from '../i18n.jsx'

export default function About() {
  const { content, tr } = useLang()
  const about = content.about

  return (
    <section className="about" id="about">
      <div className="container">
        <MaskedHeading as="h2" className="section-title" text={tr(about.heading)} />
        <p className="about__text" data-anim="fade">{tr(about.p1)}</p>

        <AboutWheel photos={about.photos} />

        <p className="about__text" data-anim="fade">{tr(about.p2)}</p>
        <p className="about__text" data-anim="fade">{tr(about.p3)}</p>
      </div>
    </section>
  )
}
