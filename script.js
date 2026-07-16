const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

// ---------- i18n ----------

const I18N = {
  en: {
    name: "Vadim Prisyachev",
    intro: "Leading visual systems and UI for digital products, aligning aesthetics with product and business goals",
    tabExperience: "Experience",
    tabSkills: "Skills",
    tabAbout: "About me",
    currentlyIn: "Currently in",
    exp1: "Senior Product Designer",
    exp2: "Art director",
    exp3: "communications & UI",
    exp4: "Freelance",
    skillsText:
      "UX/UI, design systems, prototyping and user research. Art direction, identity, illustration, motion. Figma, Adobe CC, Blender, AI workflows.",
    aboutText:
      "I'm Vadim, a product designer with 8+ years across fintech, aviation and communication design. I care about visual systems that scale and interfaces that feel effortless.",
    projectsTitle: "Projects",
    cta: "Contact via Telegram",
    projectTitle: "Project name",
    projectSubtitle: "Russia's largest airline with over 100 years of history",
    overviewTitle: "Overview",
    overviewP1: "Lead designer at Aeroflot — Russia's flag carrier and a member of the global SkyTeam alliance.",
    overviewP2:
      "I drive the redesign of the mobile app and the Aeroflot Bonus loyalty account, and act as art director for the product design team.",
    otherProjects: "Other projects",
    copied: "Copied",
  },
  ru: {
    name: "Вадим Присячев",
    intro: "Развиваю визуальные системы и интерфейсы цифровых продуктов, совмещая эстетику с целями продукта и бизнеса",
    tabExperience: "Опыт",
    tabSkills: "Навыки",
    tabAbout: "Обо мне",
    currentlyIn: "Сейчас",
    exp1: "Старший продуктовый дизайнер",
    exp2: "Арт-директор",
    exp3: "Коммуникации и UI",
    exp4: "Фриланс",
    skillsText:
      "UX/UI, дизайн-системы, прототипирование и исследования. Арт-дирекшн, айдентика, иллюстрация, моушн. Figma, Adobe CC, Blender, AI-инструменты.",
    aboutText:
      "Я Вадим, продуктовый дизайнер с опытом 8+ лет в финтехе, авиации и коммуникационном дизайне. Люблю визуальные системы, которые масштабируются, и интерфейсы, которые ощущаются лёгкими.",
    projectsTitle: "Проекты",
    cta: "Написать в Telegram",
    projectTitle: "Название проекта",
    projectSubtitle: "Крупнейшая авиакомпания России с более чем 100-летней историей",
    overviewTitle: "Обзор",
    overviewP1: "Ведущий дизайнер в Аэрофлоте — национальном авиаперевозчике России и участнике глобального альянса SkyTeam.",
    overviewP2:
      "Руковожу редизайном мобильного приложения и личного кабинета Аэрофлот Бонус, выступаю арт-директором продуктовой команды дизайна.",
    otherProjects: "Другие проекты",
    copied: "Скопировано",
  },
};

let currentLang = localStorage.getItem("lang") || "en";

function applyLang(lang) {
  const dict = I18N[lang];
  $$("[data-i18n]").forEach((el) => {
    const t = dict[el.dataset.i18n];
    if (t) el.textContent = t;
  });
  document.documentElement.lang = lang;
  $$(".lang-toggle__btn").forEach((b) => b.classList.toggle("is-active", b.dataset.lang === lang));
}

function moveLangIndicator(animate) {
  const indicator = $(".lang-toggle__indicator");
  const active = $(".lang-toggle__btn.is-active");
  if (!indicator || !active) return;
  const props = { left: active.offsetLeft, width: active.offsetWidth };
  if (animate && window.gsap) {
    gsap.to(indicator, { ...props, duration: 0.35, ease: "power3.out" });
  } else {
    indicator.style.left = props.left + "px";
    indicator.style.width = props.width + "px";
  }
}

function switchLang(lang) {
  if (lang === currentLang) return;
  currentLang = lang;
  localStorage.setItem("lang", lang);

  $$(".lang-toggle__btn").forEach((b) => b.classList.toggle("is-active", b.dataset.lang === lang));
  moveLangIndicator(true);

  const els = $$("[data-i18n]");
  gsap.to(els, {
    y: -8,
    autoAlpha: 0,
    duration: 0.18,
    stagger: 0.006,
    ease: "power1.in",
    overwrite: "auto",
    onComplete: () => {
      applyLang(lang);
      gsap.fromTo(
        els,
        { y: 10, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.35, stagger: 0.008, ease: "power2.out", overwrite: "auto" }
      );
    },
  });
}

// Apply saved language synchronously, before first paint and SplitText
applyLang(currentLang);

$$(".lang-toggle__btn").forEach((btn) => {
  btn.addEventListener("click", () => switchLang(btn.dataset.lang));
});

// ---------- Tabs ----------

function initTabs() {
  const tabs = $$(".tabs__item");
  const panels = $$(".tab-panel");
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Slide the tab strip so a partially clipped tab glides fully into view
      const strip = tab.parentElement;
      const pad = 12;
      let target = strip.scrollLeft;
      if (tab.offsetLeft - pad < target) {
        target = tab.offsetLeft - pad;
      } else if (tab.offsetLeft + tab.offsetWidth + pad > target + strip.clientWidth) {
        target = tab.offsetLeft + tab.offsetWidth + pad - strip.clientWidth;
      }
      gsap.to(strip, { scrollLeft: target, duration: 0.45, ease: "power2.out" });
      if (tab.classList.contains("is-active")) return;
      tabs.forEach((t) => t.classList.toggle("is-active", t === tab));

      const current = panels.find((p) => !p.hidden);
      const next = panels.find((p) => p.dataset.panel === tab.dataset.tab);
      if (!next || current === next) return;

      gsap.to(current, {
        y: -12,
        autoAlpha: 0,
        duration: 0.2,
        ease: "power1.in",
        onComplete: () => {
          current.hidden = true;
          gsap.set(current, { clearProps: "all" });
          next.hidden = false;
          const items = next.children.length > 1 ? next.children : next;
          gsap.fromTo(
            items,
            { y: 16, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.45, stagger: 0.07, ease: "power3.out" }
          );
        },
      });
    });
  });
}

// ---------- Copy email ----------

$$("[data-copy]").forEach((btn) => {
  btn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(btn.dataset.copy);
      const label = btn.querySelector("span:last-of-type") || btn.querySelector("span");
      const original = label.textContent;
      label.textContent = I18N[currentLang].copied;
      setTimeout(() => (label.textContent = original), 1200);
      if (window.gsap) {
        gsap.fromTo(btn, { scale: 0.94 }, { scale: 1, duration: 0.6, ease: "elastic.out(1, 0.45)" });
      }
    } catch (_) {
      /* clipboard unavailable */
    }
  });
});

// ---------- View Transitions: morph clicked card into project hero ----------

const vtCards = $$(".card, .mini-card");
vtCards.forEach((card, i) => {
  card.addEventListener("click", () => {
    // Only one element may carry the name on the outgoing page: when navigating
    // case → case, strip it from the current hero so the clicked tile wins
    const hero = $(".project-hero");
    if (hero) hero.style.viewTransitionName = "none";
    const media = card.querySelector(".card__media");
    if (media) media.style.viewTransitionName = "project-hero";
    // remember which card was clicked so back-navigation can morph in reverse
    sessionStorage.setItem("vt-card", String(i));
  });
});

// Did we arrive via a cross-document view transition?
let vtArrival = false;
window.addEventListener("pagereveal", (e) => {
  if (!e.viewTransition) return;
  vtArrival = true;
  // Home page, arriving back from a case: morph the hero back into the stored card.
  // On a case page the hero itself is the morph target, so nothing to do there.
  if (!$(".project-hero")) {
    const i = Number(sessionStorage.getItem("vt-card"));
    const media = vtCards[i] && vtCards[i].querySelector(".card__media");
    if (media) {
      media.style.viewTransitionName = "project-hero";
      e.viewTransition.finished.then(() => (media.style.viewTransitionName = ""));
    }
  }
});

// ---------- GSAP ----------

let lenis = null;

if (window.gsap) {
  gsap.registerPlugin(ScrollTrigger, SplitText);

  // Lenis smooth scroll driven by the GSAP ticker
  if (window.Lenis) {
    lenis = new Lenis({ autoRaf: false, lerp: 0.12 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Split after fonts load so line breaks are correct
  document.fonts.ready.then(() => {
    moveLangIndicator(false);
    initHoverEffects();
    initTabs();
    initToc();
    if (vtArrival) {
      // Seamless page transition: content must stand still, no intro replay
      const pre = $(".preloader");
      if (pre) pre.remove();
    } else {
      // Scroll-in sections stay hidden until the intro sequence has finished,
      // so the page always reveals strictly top to bottom
      gsap.set(SCROLL_FX_TARGETS, { autoAlpha: 0 });
      initPreloader(initLoadSequence);
    }
  });
}

// ---------- Preloader (home page only) ----------

function initPreloader(onDone) {
  const pre = $(".preloader");
  if (!pre) {
    onDone(false);
    return;
  }
  // Full counter only once per session; instant on repeat visits
  if (sessionStorage.getItem("preloaded")) {
    pre.remove();
    onDone(false);
    return;
  }
  sessionStorage.setItem("preloaded", "1");

  if (lenis) lenis.stop();
  const counter = $(".preloader__counter", pre);
  const state = { v: 0 };

  gsap
    .timeline()
    .to(state, {
      v: 100,
      duration: 1.1,
      ease: "power2.inOut",
      onUpdate: () => (counter.textContent = Math.round(state.v)),
    })
    .to(counter, { yPercent: -40, autoAlpha: 0, duration: 0.35, ease: "power2.in" })
    .to(pre, {
      yPercent: -100,
      duration: 0.7,
      ease: "power4.inOut",
      onStart: () => {
        if (lenis) lenis.start();
        onDone(true);
      },
      onComplete: () => pre.remove(),
    }, "-=0.1");
}

// ---------- Case page table of contents ----------

function initToc() {
  const sections = $$(".overview, .other-projects");
  if (!sections.length) return;

  const toc = document.createElement("nav");
  toc.className = "toc";
  toc.setAttribute("aria-label", "Page sections");

  const items = sections.map((sec) => {
    const title = sec.querySelector(".overview__title, .section-title");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "toc__item";
    btn.innerHTML = '<span class="toc__label mono"></span><span class="toc__line"></span>';
    // Read the label lazily so it always matches the current language
    btn.addEventListener("mouseenter", () => {
      btn.querySelector(".toc__label").textContent = title ? title.textContent : "";
    });
    btn.addEventListener("click", () => {
      const y = sec.getBoundingClientRect().top + window.scrollY - 72;
      if (lenis) lenis.scrollTo(y, { duration: 1, easing: (t) => 1 - Math.pow(1 - t, 3) });
      else window.scrollTo({ top: y, behavior: "smooth" });
    });
    toc.appendChild(btn);
    return btn;
  });
  document.body.appendChild(toc);

  const setActive = (i) => items.forEach((b, j) => b.classList.toggle("is-active", i === j));
  sections.forEach((sec, i) => {
    ScrollTrigger.create({
      trigger: sec,
      start: "top 55%",
      end: "bottom 55%",
      onToggle: (self) => self.isActive && setActive(i),
    });
  });
  setActive(0);
}

function initLoadSequence(firstVisit) {
  // Whatever races happen mid-load (language switch, tab clicks), the intro
  // must never end with elements stuck invisible — clear all inline props at the end.
  const INTRO_TARGETS =
    ".header, .intro__divider, .intro__links > *, .tabs__item, " +
    '[data-panel="experience"] .exp-card, .project-intro p, ' +
    ".project-intro__tags .tag, .project-hero, .contact-bar__btn";
  const tl = gsap.timeline({
    defaults: { ease: "power3.out", duration: 0.8 },
    onComplete: () => {
      gsap.set(INTRO_TARGETS, { clearProps: "transform,opacity,visibility" });
      // Now the sections below may enter, in viewport order
      initScrollEffects();
    },
  });

  // The header animates only on the very first load of the site
  if (firstVisit) tl.from(".header", { y: -20, autoAlpha: 0, duration: 0.6 });

  // Home page
  // Strict top-down order: lead text → divider line → email/CV → tabs → experience
  const lead = $(".intro__lead");
  if (lead) {
    const split = SplitText.create(lead, { type: "lines", mask: "lines" });
    tl.from(split.lines, { yPercent: 110, stagger: 0.08, onComplete: () => split.revert() }, "-=0.3");
    tl.from(".intro__divider", { scaleX: 0, transformOrigin: "left center", duration: 0.5, ease: "power2.inOut" }, "-=0.1");
    tl.from(".intro__links > *", { y: 16, autoAlpha: 0, stagger: 0.08, duration: 0.5 }, "-=0.1");
    tl.from(".tabs__item", { y: 28, autoAlpha: 0, stagger: 0.07, duration: 0.6 }, "-=0.1");
    tl.from('[data-panel="experience"] .exp-card', { y: 16, autoAlpha: 0, stagger: 0.06, duration: 0.5 }, "-=0.15");
  }

  // Project page
  const projectTitle = $(".project-intro .section-title");
  if (projectTitle) {
    const split = SplitText.create(projectTitle, { type: "lines", mask: "lines" });
    tl.from(split.lines, { yPercent: 110, stagger: 0.08, onComplete: () => split.revert() }, "-=0.3");
    tl.from(".project-intro p", { y: 16, autoAlpha: 0, duration: 0.6 }, "-=0.4");
    tl.from(".project-intro__tags .tag", { y: 12, autoAlpha: 0, stagger: 0.05, duration: 0.4 }, "-=0.45");
  }

  tl.from(".contact-bar__btn", { y: 64, scale: 0.8, autoAlpha: 0, duration: 0.7, ease: "back.out(1.6)" }, "-=0.5");
}

const SCROLL_FX_TARGETS =
  ".projects .section-title, .other-projects .section-title, .overview__title, " +
  ".overview__text, .overview__image, .card, .mini-card";

function initScrollEffects() {
  // Release the pre-hidden state; the from-tweens below take over per element
  gsap.set(SCROLL_FX_TARGETS, { clearProps: "opacity,visibility" });

  // Section titles slide up out of a line mask
  $$(".projects .section-title, .other-projects .section-title, .overview__title").forEach((el) => {
    const split = SplitText.create(el, { type: "lines", mask: "lines" });
    gsap.from(split.lines, {
      yPercent: 110,
      duration: 0.8,
      ease: "power3.out",
      stagger: 0.08,
      onComplete: () => split.revert(),
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });

  // Overview blocks fade in
  $$(".overview").forEach((sec) => {
    gsap.from([sec.querySelector(".overview__text"), sec.querySelector(".overview__image")], {
      y: 32,
      autoAlpha: 0,
      duration: 0.8,
      ease: "power3.out",
      stagger: 0.15,
      scrollTrigger: { trigger: sec, start: "top 80%", once: true },
    });
  });

  // Cards gently fade in as they enter
  $$(".card, .mini-card").forEach((card) => {
    gsap.from(card, {
      y: 40,
      autoAlpha: 0,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: { trigger: card, start: "top 92%", once: true },
    });
  });

}

function initHoverEffects() {
  // Tilt on hover: card media follows the cursor with a light glare
  $$(".card, .mini-card").forEach((card) => {
    const media = card.querySelector(".card__media");
    if (!media) return;
    gsap.set(media, { transformPerspective: 800 });
    const rotX = gsap.quickTo(media, "rotationX", { duration: 0.35, ease: "power2.out" });
    const rotY = gsap.quickTo(media, "rotationY", { duration: 0.35, ease: "power2.out" });

    card.addEventListener("mousemove", (e) => {
      const r = media.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      rotY(x * 10);
      rotX(-y * 10);
    });
    card.addEventListener("mouseleave", () => {
      rotY(0);
      rotX(0);
    });
  });

  // Magnetic CTA button (soft)
  const ctaBtn = $(".contact-bar__btn");
  const ctaBar = $(".contact-bar");
  if (ctaBtn && ctaBar) {
    const moveX = gsap.quickTo(ctaBtn, "x", { duration: 0.5, ease: "power3.out" });
    const moveY = gsap.quickTo(ctaBtn, "y", { duration: 0.5, ease: "power3.out" });
    const scale = gsap.quickTo(ctaBtn, "scale", { duration: 0.5, ease: "power3.out" });

    window.addEventListener(
      "mousemove",
      (e) => {
        // Rest center: current rect minus the button's own translation,
        // so the magnet never feeds back on itself
        const r = ctaBtn.getBoundingClientRect();
        const cx = r.left + r.width / 2 - (gsap.getProperty(ctaBtn, "x") || 0);
        const cy = r.top + r.height / 2 - (gsap.getProperty(ctaBtn, "y") || 0);
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        if (Math.hypot(dx, dy) < 100) {
          moveX(dx * 0.12);
          moveY(dy * 0.12);
          scale(1.02);
        } else {
          moveX(0);
          moveY(0);
          scale(1);
        }
      },
      { passive: true }
    );
  }
}
