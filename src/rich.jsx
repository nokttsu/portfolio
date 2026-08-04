import { Fragment } from 'react'

// tiny inline formatter used by the case blocks: **bold**, *italic*, ==highlight==
export function rich(text) {
  const parts = String(text ?? '').split(/(\*\*[^*]+\*\*|\*[^*]+\*|==[^=]+==)/g)
  return parts.map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) return <strong key={i}>{p.slice(2, -2)}</strong>
    if (/^==[^=]+==$/.test(p)) return <mark className="cs-mark" key={i}>{p.slice(2, -2)}</mark>
    if (/^\*[^*]+\*$/.test(p)) return <em key={i}>{p.slice(1, -1)}</em>
    return <Fragment key={i}>{p}</Fragment>
  })
}
