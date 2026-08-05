import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import gsap from 'gsap'
import { DEFAULTS } from './content.js'
import { asset } from './asset.js'

const LangContext = createContext(null)

// deep-merge content.json over the bundled defaults (arrays are replaced whole)
function merge(base, over) {
  if (Array.isArray(over)) return over
  if (over && typeof over === 'object' && !Array.isArray(base) && typeof base === 'object') {
    const out = { ...base }
    for (const k of Object.keys(over)) out[k] = merge(base?.[k], over[k])
    return out
  }
  return over === undefined ? base : over
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState('en')
  const [content, setContent] = useState(DEFAULTS)

  // keep the document language in sync for screen readers and hyphenation
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  // content.json is written by admin.html; fall back to the bundled defaults
  useEffect(() => {
    let alive = true
    fetch(asset('/content.json'), { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (alive && json) setContent(merge(DEFAULTS, json))
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  // translate the site with a quick fade while the text swaps
  const toggleLang = useCallback(() => {
    const el = document.querySelector('.site')
    if (!el) {
      setLang((l) => (l === 'en' ? 'ru' : 'en'))
      return
    }
    gsap
      .timeline()
      .to(el, { autoAlpha: 0, duration: 0.22, ease: 'power2.in' })
      .add(() => setLang((l) => (l === 'en' ? 'ru' : 'en')))
      .to(el, { autoAlpha: 1, duration: 0.4, ease: 'power2.out' }, '+=0.03')
  }, [])

  const value = useMemo(() => {
    // resolve a bilingual field ({en, ru}) or pass a plain string through
    const tr = (field) => {
      if (field == null) return ''
      if (typeof field === 'string') return field
      return field[lang] ?? field.en ?? ''
    }
    const t = (key) => tr(content.ui?.[key]) || key
    return { lang, toggleLang, content, t, tr }
  }, [lang, content, toggleLang])

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>
}

export function useLang() {
  return useContext(LangContext)
}
