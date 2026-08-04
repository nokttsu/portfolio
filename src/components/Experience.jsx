import MaskedHeading from './MaskedHeading.jsx'
import { asset } from '../asset.js'
import { useLang } from '../i18n.jsx'

export default function Experience() {
  const { content, tr } = useLang()
  const exp = content.experience

  return (
    <section className="experience" id="experience">
      <div className="container">
        <MaskedHeading as="h2" className="section-title" text={tr(exp.heading)} />

        <div className="exp__row" data-anim="stagger">
          {exp.items.map((item, i) =>
            item.divider ? (
              <div className="exp__divider" data-anim="stagger-item" key={`d${i}`} />
            ) : (
              <div
                className={`exp__card${item.highlight ? ' exp__card--active' : ''}${item.role ? '' : ' exp__card--between'}`}
                data-anim="stagger-item"
                key={`c${i}`}
              >
                {item.role ? (
                  <>
                    <div className="exp__card-top">
                      <div className="exp__card-main">
                        <div className="exp__name">{tr(item.company)}</div>
                        <div className="exp__role">{tr(item.role)}</div>
                      </div>
                      {item.logo && (
                        <div className={`exp__logo${item.round ? ' exp__logo--round' : ''}`}>
                          <img src={asset(item.logo)} alt={tr(item.company)} />
                        </div>
                      )}
                    </div>
                    <div className="exp__meta">{tr(item.meta)}</div>
                  </>
                ) : (
                  <>
                    <div className="exp__name">{tr(item.company)}</div>
                    <div className="exp__meta">{tr(item.meta)}</div>
                  </>
                )}
              </div>
            )
          )}
        </div>

        <p className="exp__text" data-anim="fade">{tr(exp.text)}</p>
      </div>
    </section>
  )
}
