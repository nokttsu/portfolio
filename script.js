const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

// ---------- i18n ----------

const I18N = {
  en: {
    name: "Vadim Prisyachev",
    intro: "Leading visual systems and UI for digital products",
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
    intro: "Развиваю визуальные системы и интерфейсы цифровых продуктов",
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

// ---------- Content: single source of truth is content.json ----------

let CONTENT = null;
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

async function loadContent() {
  try {
    const r = await fetch("content.json?ts=" + Date.now());
    if (!r.ok) return;
    CONTENT = await r.json();
    mergeContentIntoDicts();
    renderContent();
  } catch (_) {
    /* embedded I18N defaults keep the site working */
  }
}

function mergeContentIntoDicts() {
  const C = CONTENT;
  for (const L of ["en", "ru"]) {
    const d = I18N[L];
    const g = (v) => (v && typeof v === "object" ? (v[L] ?? v.en ?? "") : v ?? "");
    d.name = g(C.site.name);
    d.intro = g(C.site.intro);
    d.cta = g(C.site.cta);
    d.tabExperience = g(C.tabs.experience);
    d.tabSkills = g(C.tabs.skills);
    d.tabAbout = g(C.tabs.about);
    d.skillsText = g(C.skillsText);
    d.aboutText = g(C.aboutText);
    d.currentlyIn = g(C.ui.currentlyIn);
    d.copied = g(C.ui.copied);
    d.projectsTitle = g(C.ui.projectsTitle);
    d.otherProjects = g(C.ui.otherProjects);
    C.experience.forEach((e, i) => (d["exp" + i] = g(e.role)));
    C.projects.forEach((p, i) => {
      d["proj" + i + "name"] = g(p.name);
      d["proj" + i + "sub"] = g(p.subtitle);
      caseBlocks(p).forEach((b, k) => {
        if (b.type !== "img") d["proj" + i + "b" + k] = g(b.text);
      });
    });
  }
}

// Sliding mouse trail (after madewithgsap effect 020): a fixed pool of images
// gathered from all cases — covers and in-body images alike; each step of the
// cursor grabs the next image and slides it from where the cursor came from
// to where it is now, then fades it out
function buildImageTrail(projects) {
  const srcs = [];
  projects.forEach((p) => {
    if (p.image) srcs.push(p.image);
    caseBlocks(p).forEach((b) => {
      if (b.type === "img" && b.src) srcs.push(b.src);
    });
  });
  const uniq = [...new Set(srcs)];
  if (!uniq.length || !window.gsap) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const layer = document.createElement("div");
  layer.className = "img-trail";
  document.body.appendChild(layer);

  // Reusable pool — the images live in the DOM once, like the tutorial's .medias
  const pool = uniq.map((src) => {
    const img = document.createElement("img");
    img.className = "img-trail__item";
    img.src = src;
    img.alt = "";
    layer.appendChild(img);
    gsap.set(img, { xPercent: -50, yPercent: -50, autoAlpha: 0 });
    return img;
  });

  const SPAWN_DISTANCE = 130;
  let last = null;
  let idx = 0;
  let stack = 0;

  window.addEventListener(
    "mousemove",
    (e) => {
      // The trail lives only in the first viewport of the page
      if (window.scrollY > innerHeight * 0.8) {
        last = null;
        return;
      }
      const cur = { x: e.clientX, y: e.clientY };
      if (last && Math.hypot(cur.x - last.x, cur.y - last.y) < SPAWN_DISTANCE) return;
      const from = last || cur;

      const img = pool[idx++ % pool.length];
      gsap.killTweensOf(img);
      img.style.zIndex = ++stack; // the freshest image rides on top

      gsap
        .timeline()
        .fromTo(
          img,
          { x: from.x, y: from.y, scale: 0.9, autoAlpha: 1 },
          { x: cur.x, y: cur.y, scale: 1, duration: 0.85, ease: "power3.out" }
        )
        .to(img, { scale: 0.05, autoAlpha: 0, duration: 0.35, ease: "power2.in" }, 0.4);

      last = cur;
    },
    { passive: true }
  );
}

// Case body is a flat list of Notion-style blocks; legacy `sections` are converted
function caseBlocks(p) {
  if (p.body) return p.body;
  const blocks = [];
  (p.sections || []).forEach((s) => {
    if (s.title && (s.title.en || s.title.ru)) blocks.push({ type: "h2", text: s.title });
    if (s.text && (s.text.en || s.text.ru)) blocks.push({ type: "p", text: s.text });
    blocks.push({ type: "img", src: s.image || "" });
  });
  return blocks;
}

function renderContent() {
  const C = CONTENT;

  // Shared bits
  $$(".contact-bar__btn").forEach((a) => (a.href = C.site.telegram));
  const emailBtn = $("button.email__value");
  if (emailBtn) {
    emailBtn.dataset.copy = C.site.email;
    emailBtn.querySelector("span").textContent = C.site.email;
  }
  const cvLink = $("a.email__value");
  if (cvLink) cvLink.href = C.site.cvUrl;

  // Home: sliding mouse trail from every image of every case
  if (!$(".project-hero")) buildImageTrail(C.projects);

  // Home: experience cards
  const panel = $('[data-panel="experience"]');
  if (panel) {
    panel.innerHTML = C.experience
      .map(
        (e, i) => `
      <div class="exp-card${e.current ? " is-current" : ""}">
        <img class="exp-card__logo${e.round ? " exp-card__logo--round" : ""}" src="${esc(e.logo)}" alt="${esc(e.company)}">
        <div class="exp-card__info">
          <span class="exp-card__company">${esc(e.company)}</span>
          ${(e.role && (e.role.en || e.role.ru)) ? `<span class="exp-card__role mono" data-i18n="exp${i}"></span>` : ""}
        </div>
        <span class="exp-card__pill${e.current ? " exp-card__pill--current" : ""} mono"${e.current ? ' data-i18n="currentlyIn"' : ""}>${e.current ? "" : esc(e.period)}</span>
      </div>`
      )
      .join("");
  }

  // Home: project cards — reuse existing nodes so view transitions stay stable
  const list = $(".projects__list");
  if (list) {
    const tpl = list.children[0];
    while (list.children.length < C.projects.length) list.appendChild(tpl.cloneNode(true));
    while (list.children.length > C.projects.length) list.lastElementChild.remove();
    [...list.children].forEach((card, i) => {
      const p = C.projects[i];
      card.setAttribute("href", "project.html?p=" + (i + 1));
      card.querySelector(".card__media").innerHTML = p.image
        ? `<img src="${esc(p.image)}" alt="${esc(p.name && p.name.en)}"${i ? ' loading="lazy"' : ""}>`
        : "";
      card.querySelector(".tag:not(.tag--award)").setAttribute("data-i18n", `proj${i}name`);
      card.querySelector(".card__awards").innerHTML = (p.awards || [])
        .map((a) => `<span class="tag tag--award">${esc(a)}</span>`)
        .join("");
    });
  }

  // Project page
  const hero = $(".project-hero");
  if (hero) {
    const total = C.projects.length;
    const idx = Math.min(Math.max(parseInt(new URLSearchParams(location.search).get("p"), 10) || 1, 1), total) - 1;
    const p = C.projects[idx];
    $(".project-intro .section-title").setAttribute("data-i18n", `proj${idx}name`);
    $(".project-intro p").setAttribute("data-i18n", `proj${idx}sub`);
    $(".project-intro__tags").innerHTML = (p.awards || [])
      .map((a) => `<span class="tag tag--award">${esc(a)}</span>`)
      .join("");
    hero.innerHTML = p.image ? `<img src="${esc(p.image)}" alt="">` : "";
    document.title = ((p.name && p.name.en) || "Project") + " — " + ((C.site.name && C.site.name.en) || "");

    const body = $(".project-body");
    const other = $(".other-projects");
    $$(".overview, .case-body", body).forEach((s) => s.remove());
    const blocks = caseBlocks(p);
    if (blocks.length) {
      const wrap = document.createElement("div");
      wrap.className = "case-body";
      wrap.innerHTML = blocks
        .map((b, k) => {
          if (b.type === "h2") return `<h2 class="case-h2" data-i18n="proj${idx}b${k}"></h2>`;
          if (b.type === "img")
            return b.src
              ? `<img class="case-img" src="${esc(b.src)}" alt="" loading="lazy">`
              : '<div class="case-img"></div>';
          return `<div class="case-p"><p data-i18n="proj${idx}b${k}"></p></div>`;
        })
        .join("");
      body.insertBefore(wrap, other);
    }

    // Other projects: everything except the current one, first four
    const others = C.projects.map((_, i) => i).filter((i) => i !== idx).slice(0, 4);
    $$(".mini-card").forEach((mc, k) => {
      if (k >= others.length) {
        mc.remove();
        return;
      }
      const i = others[k];
      mc.setAttribute("href", "project.html?p=" + (i + 1));
      mc.querySelector(".card__media").innerHTML = C.projects[i].image
        ? `<img src="${esc(C.projects[i].image)}" alt="" loading="lazy">`
        : "";
      mc.querySelector(".tag").setAttribute("data-i18n", `proj${i}name`);
    });
  }
}

// Re-stamp one element's text after SplitText.revert(), which restores the
// HTML snapshot taken at split time and may resurrect a stale language
function stampI18n(el) {
  const t = el && el.dataset.i18n && I18N[currentLang][el.dataset.i18n];
  if (t) el.textContent = t;
}

function applyLang(lang) {
  const dict = I18N[lang];
  $$("[data-i18n]").forEach((el) => {
    const t = dict[el.dataset.i18n];
    if (t) el.textContent = t;
  });
  document.documentElement.lang = lang;
  $$(".lang-toggle__btn").forEach((b) => b.classList.toggle("is-active", b.dataset.lang === lang));
  // Menu language row shows the language you'd switch TO
  const ml = $("[data-menu-lang]");
  if (ml) ml.textContent = lang === "en" ? "Русский язык" : "English";
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

// Delegated so cards created from content.json get the behaviour too
document.addEventListener("click", (e) => {
  const card = e.target.closest(".card, .mini-card");
  if (!card) return;
  // Only one element may carry the name on the outgoing page: when navigating
  // case → case, strip it from the current hero so the clicked tile wins
  const hero = $(".project-hero");
  if (hero) hero.style.viewTransitionName = "none";
  const media = card.querySelector(".card__media");
  if (media) media.style.viewTransitionName = "project-hero";
  // remember which card was clicked so back-navigation can morph in reverse
  sessionStorage.setItem("vt-card", String($$(".card, .mini-card").indexOf(card)));
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
    const cards = $$(".card, .mini-card");
    const media = cards[i] && cards[i].querySelector(".card__media");
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

  // Content first (it builds the DOM), fonts second (SplitText needs final metrics)
  Promise.all([loadContent(), document.fonts.ready]).then(() => {
    applyLang(currentLang);
    moveLangIndicator(false);
    initHoverEffects();
    initTabs();
    initToc();
    initMenu();
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

// ---------- Mobile menu: drops from the kebab, closes into iOS-style blur ----------

function initMenu() {
  const btn = $(".menu-btn");
  const menu = $(".menu");
  if (!btn || !menu) return;

  const panel = $(".menu__panel", menu);
  const iconOpen = $(".menu-btn__open", btn);
  const iconClose = $(".menu-btn__close", btn);
  let open = false;
  let anim;

  const openMenu = () => {
    open = true;
    btn.setAttribute("aria-expanded", "true");
    iconOpen.hidden = true;
    iconClose.hidden = false;
    menu.hidden = false;
    anim && anim.kill();
    // Drop out of the button: scale + fade from the top-right origin
    gsap.fromTo(menu, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, ease: "power2.out" });
    anim = gsap.fromTo(
      panel,
      { autoAlpha: 0, scale: 0.7, y: -10, filter: "blur(4px)" },
      { autoAlpha: 1, scale: 1, y: 0, filter: "blur(0px)", duration: 0.5, ease: "back.out(1.7)" }
    );
  };

  const closeMenu = () => {
    open = false;
    btn.setAttribute("aria-expanded", "false");
    iconOpen.hidden = false;
    iconClose.hidden = true;
    anim && anim.kill();
    // Melt into blur, iOS-style
    gsap.to(menu, { autoAlpha: 0, duration: 0.35, ease: "power2.in" });
    anim = gsap.to(panel, {
      autoAlpha: 0,
      scale: 1.06,
      filter: "blur(14px)",
      duration: 0.35,
      ease: "power2.in",
      onComplete: () => {
        menu.hidden = true;
        gsap.set(panel, { clearProps: "filter" });
      },
    });
  };

  btn.addEventListener("click", () => (open ? closeMenu() : openMenu()));
  // Click on the blurred backdrop (not the panel) closes it
  menu.addEventListener("click", (e) => {
    if (!e.target.closest(".menu__panel")) closeMenu();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && open) closeMenu();
  });
  // Language row inside the menu
  const langBtn = $("[data-menu-lang]", menu);
  if (langBtn) {
    langBtn.addEventListener("click", () => {
      switchLang(currentLang === "en" ? "ru" : "en");
      closeMenu();
    });
  }
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
  // Anchors: every case heading block + the "other projects" section
  const anchors = [...$$(".case-h2"), ...$$(".other-projects .section-title")].map((titleEl) => ({
    el: titleEl.closest(".other-projects") || titleEl,
    titleEl,
  }));
  // A single lonely dash is noise — show the toc only when there is a real outline
  if (anchors.length < 2 || !$(".project-hero")) return;

  const toc = document.createElement("nav");
  toc.className = "toc";
  toc.setAttribute("aria-label", "Page sections");

  const items = anchors.map(({ el: sec, titleEl }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "toc__item";
    btn.innerHTML = '<span class="toc__label mono"></span><span class="toc__line"></span>';
    // Read the label lazily so it always matches the current language
    btn.addEventListener("mouseenter", () => {
      btn.querySelector(".toc__label").textContent = titleEl.textContent;
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
  // Active anchor = the last one above the 55% viewport line;
  // at the very bottom of the page the last anchor always wins
  const track = () => {
    const line = innerHeight * 0.55;
    let act = 0;
    anchors.forEach((a, i) => {
      if (a.el.getBoundingClientRect().top <= line) act = i;
    });
    if (Math.ceil(scrollY + innerHeight) >= document.documentElement.scrollHeight - 2) act = anchors.length - 1;
    setActive(act);
  };
  if (lenis) lenis.on("scroll", track);
  else window.addEventListener("scroll", track, { passive: true });
  track();
}

function initLoadSequence(firstVisit) {
  // Whatever races happen mid-load (language switch, tab clicks), the intro
  // must never end with elements stuck invisible — clear all inline props at the end.
  const INTRO_TARGETS =
    ".header, .hero__signature, .intro__links, .hero__cta, .tabs__item, " +
    '[data-panel="experience"] .exp-card, .project-intro p, ' +
    ".project-intro__tags .tag, .project-hero, .contact-bar__btn";
  const tl = gsap.timeline({
    defaults: { ease: "power3.out", duration: 0.8 },
    onComplete: () => {
      gsap.set(INTRO_TARGETS, { clearProps: "transform,opacity,visibility" });
      // A language switch mid-intro may have been undone by split.revert() —
      // re-stamp every translated node to the current language
      applyLang(currentLang);
      // Now the sections below may enter, in viewport order
      initScrollEffects();
    },
  });

  // The header animates only on the very first load of the site
  if (firstVisit) tl.from(".header", { y: -20, autoAlpha: 0, duration: 0.6 });

  // Home hero — signature → heading → CTA → email/CV → tabs → experience
  const lead = $(".hero .intro__lead");
  if (lead) {
    tl.from(".hero__signature", { y: 12, scale: 0.96, autoAlpha: 0, duration: 0.6 });
    const split = SplitText.create(lead, { type: "lines", mask: "lines" });
    tl.from(split.lines, { yPercent: 110, stagger: 0.08, onComplete: () => split.revert() }, "-=0.25");
    tl.from(".hero__cta", { y: 16, scale: 0.9, autoAlpha: 0, duration: 0.55, ease: "back.out(1.6)" }, "-=0.1");
    // Tween the wrapper, not the links themselves: the links carry a CSS
    // opacity transition (hover) that corrupts GSAP's from() value capture
    tl.from(".intro__links", { y: 16, autoAlpha: 0, duration: 0.5 }, "-=0.15");
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
  ".projects .section-title, .other-projects .section-title, .case-h2, " +
  ".case-p, .case-img, .card, .mini-card";

function initScrollEffects() {
  // Release the pre-hidden state; the from-tweens below take over per element
  gsap.set(SCROLL_FX_TARGETS, { clearProps: "opacity,visibility" });

  // Section titles slide up out of a line mask
  $$(".projects .section-title, .other-projects .section-title, .case-h2").forEach((el) => {
    const split = SplitText.create(el, { type: "lines", mask: "lines" });
    gsap.from(split.lines, {
      yPercent: 110,
      duration: 0.8,
      ease: "power3.out",
      stagger: 0.08,
      onComplete: () => {
        split.revert();
        stampI18n(el);
      },
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });

  // Case text and image blocks fade in
  $$(".case-p, .case-img").forEach((elm) => {
    gsap.from(elm, {
      y: 32,
      autoAlpha: 0,
      duration: 0.8,
      ease: "power3.out",
      scrollTrigger: { trigger: elm, start: "top 85%", once: true },
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

  // Magnetic CTA button (soft) — works whether the button is in the hero or the fixed bar
  const ctaBtn = $(".contact-bar__btn");
  if (ctaBtn) {
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
