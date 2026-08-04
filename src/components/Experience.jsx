import MaskedHeading from './MaskedHeading.jsx'
import { asset } from '../asset.js'
import { useLang } from '../i18n.jsx'

export default function Experience() {
  const { t } = useLang()

  return (
    <section className="experience" id="experience">
      <div className="container">
        <MaskedHeading as="h2" className="section-title" text={t('experience')} />

        <div className="exp__row" data-anim="stagger">
          <div className="exp__card exp__card--active" data-anim="stagger-item">
            <div className="exp__card-top">
              <div className="exp__card-main">
                <div className="exp__name">Aeroflot</div>
                <div className="exp__role">{t('roleArt')}</div>
              </div>
              <div className="exp__logo">
                <img src={asset('/img/exp-aeroflot.svg')} alt="Aeroflot" />
              </div>
            </div>
            <div className="exp__meta">{t('currentlyAt')}</div>
          </div>

          <div className="exp__card" data-anim="stagger-item">
            <div className="exp__card-top">
              <div className="exp__card-main">
                <div className="exp__name">Plan9</div>
                <div className="exp__role">{t('roleSenior')}</div>
              </div>
              <div className="exp__logo exp__logo--round">
                <img src={asset('/img/exp-plan9.png')} alt="Plan9" />
              </div>
            </div>
            <div className="exp__meta">2023-2024</div>
          </div>

          <div className="exp__divider" data-anim="stagger-item" />

          <div className="exp__card" data-anim="stagger-item">
            <div className="exp__card-top">
              <div className="exp__card-main">
                <div className="exp__name">div.</div>
                <div className="exp__role">{t('roleLead')}</div>
              </div>
              <div className="exp__logo">
                <img src={asset('/img/exp-div.svg')} alt="div." />
              </div>
            </div>
            <div className="exp__meta">2023-2024</div>
          </div>

          <div className="exp__divider" data-anim="stagger-item" />

          <div className="exp__card exp__card--between" data-anim="stagger-item">
            <div className="exp__name">{t('freelance')}</div>
            <div className="exp__meta">2023-2024</div>
          </div>
        </div>

        <p className="exp__text" data-anim="fade">{t('expIntro')}</p>
      </div>
    </section>
  )
}
