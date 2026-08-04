import MaskedHeading from './MaskedHeading.jsx'
import AboutWheel from './AboutWheel.jsx'
import { useLang } from '../i18n.jsx'

export default function About() {
  const { t } = useLang()

  return (
    <section className="about" id="about">
      <div className="container">
        <MaskedHeading as="h2" className="section-title" text={t('about')} />
        <p className="about__text" data-anim="fade">{t('aboutP1')}</p>

        <AboutWheel />

        <p className="about__text" data-anim="fade">{t('aboutP2')}</p>
        <p className="about__text" data-anim="fade">{t('aboutP3')}</p>
      </div>
    </section>
  )
}
