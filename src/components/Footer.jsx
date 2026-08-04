import { useLang } from '../i18n.jsx'
import { asset } from '../asset.js'

export default function Footer() {
  const { content, tr } = useLang()
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__row" data-anim="fade">
          <div className="footer__made">
            <img src={asset('/img/claude-color.svg')} alt="" width="16" height="25" />
            <span className="footer__txt">{tr(content.footer.made)}</span>
          </div>
          <span className="footer__txt">{tr(content.footer.location)}</span>
        </div>
      </div>
    </footer>
  )
}
