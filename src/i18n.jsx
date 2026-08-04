import { createContext, useContext, useState, useCallback } from 'react'
import gsap from 'gsap'

const INTRO_EN =
  "I'm Vadim, a product designer and art director with experience across fintech, aviation, sports and media — from Aeroflot and Yandex to experimental products of my own"
const INTRO_RU =
  'Я Вадим, продуктовый дизайнер и арт-директор с опытом в финтехе, авиации, спорте и медиа — от Аэрофлота и Яндекса до собственных экспериментальных продуктов'

const DICT = {
  en: {
    openCV: 'Open CV',
    contact: 'Contact via Telegram',
    backToTop: 'Back to top',
    langToggle: 'Русский язык', // shows the language you can switch TO
    email: 'nokttsu@mail.ru',
    copied: 'Copied!',

    heroTitle: 'Leaving a huuuuge digital trail and making users happy',
    heroIntro: INTRO_EN,
    navExperience: 'Experience',
    navWorks: 'Works',
    navAbout: 'About me',

    experience: 'Experience',
    roleArt: 'Art director',
    roleSenior: 'Senior designer',
    roleLead: 'Lead UX/UI designer',
    currentlyAt: 'Currently at :)',
    freelance: 'Freelance',
    expIntro: INTRO_EN,

    works: 'Works',
    listView: 'List view',
    tableView: 'Table view',
    showMore: 'Show more',

    about: 'About me',
    aboutP1: `${INTRO_EN} ${INTRO_EN}`,
    aboutP2: INTRO_EN,
    aboutP3: `${INTRO_EN} I'm Vadim`,
    watchPhotos: 'Watch my film photos',

    madeWith: 'Made /w Claude Code',
    location: 'Saint Petersburg, Russia',

    AWARD: 'AWARD',
    FINALIST: 'FINALIST',
    'HONORABLE MENTION': 'HONORABLE MENTION',
  },
  ru: {
    openCV: 'Открыть резюме',
    contact: 'Написать в Telegram',
    backToTop: 'Наверх',
    langToggle: 'English',
    email: 'nokttsu@mail.ru',
    copied: 'Скопировано!',

    heroTitle: 'Оставляю огро-о-омный цифровой след и делаю пользователей счастливыми',
    heroIntro: INTRO_RU,
    navExperience: 'Опыт',
    navWorks: 'Работы',
    navAbout: 'Обо мне',

    experience: 'Опыт',
    roleArt: 'Арт-директор',
    roleSenior: 'Старший дизайнер',
    roleLead: 'Ведущий UX/UI дизайнер',
    currentlyAt: 'Сейчас здесь :)',
    freelance: 'Фриланс',
    expIntro: INTRO_RU,

    works: 'Работы',
    listView: 'Списком',
    tableView: 'Таблицей',
    showMore: 'Показать ещё',

    about: 'Обо мне',
    aboutP1: `${INTRO_RU} ${INTRO_RU}`,
    aboutP2: INTRO_RU,
    aboutP3: `${INTRO_RU} Я Вадим`,
    watchPhotos: 'Смотреть мои плёночные фото',

    madeWith: 'Сделано с Claude Code',
    location: 'Санкт-Петербург, Россия',

    AWARD: 'НАГРАДА',
    FINALIST: 'ФИНАЛИСТ',
    'HONORABLE MENTION': 'ПООЩРЕНИЕ',
  },
}

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState('en')

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

  const t = useCallback((key) => (DICT[lang] && DICT[lang][key]) ?? key, [lang])

  return (
    <LangContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  return useContext(LangContext)
}
