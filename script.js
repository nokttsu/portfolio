const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

// Always open the page at the top: stop the browser from restoring the previous
// scroll on refresh, and pin scroll to 0 through load (Lenis can otherwise latch
// onto a restored offset before it's cleared). Manual restoration alone is enough
// once set, so unlike before we don't also reset scroll on the way out — a
// beforeunload reset fires ahead of the outgoing page's view-transition snapshot
// and would snap a scrolled-down source card to the top before it morphs.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);

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

function revalidateContent(cached) {
  // Runs in the background, independent of loadContent()'s returned promise —
  // callers past their first page already have content and shouldn't wait on
  // the network for it again.
  fetch("content.json?ts=" + Date.now())
    .then((r) => (r.ok ? r.text() : null))
    .then((raw) => {
      if (!raw || raw === cached) return;
      CONTENT = JSON.parse(raw);
      sessionStorage.setItem("content-cache", raw);
      mergeContentIntoDicts();
      renderContent();
      applyLang(currentLang);
    })
    .catch(() => {});
}

async function loadContent() {
  // A same-session navigation (card click, back/forward) needs content available
  // synchronously — a cross-document view transition snapshots the new page's
  // DOM essentially at first paint, well before a fresh fetch could resolve, so
  // an await here would morph into placeholder markup and pop the real content
  // in afterward. Reuse this session's last fetch instead, and revalidate it in
  // the background (not awaited) so edits still show up on the next navigation.
  const cached = sessionStorage.getItem("content-cache");
  if (cached) {
    try {
      CONTENT = JSON.parse(cached);
      mergeContentIntoDicts();
      renderContent();
      revalidateContent(cached);
      return;
    } catch (_) {
      /* fall through to a fresh fetch below */
    }
  }
  try {
    const r = await fetch("content.json?ts=" + Date.now());
    if (!r.ok) return;
    const raw = await r.text();
    CONTENT = JSON.parse(raw);
    sessionStorage.setItem("content-cache", raw);
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
        if (b.text) d["proj" + i + "b" + k] = g(b.text);
        if (b.author) d["proj" + i + "b" + k + "a"] = g(b.author);
      });
    });
  }
}

// Sliding mouse trail (after madewithgsap effect 020): a pool of images from
// all cases; each step of the cursor grabs the next image and
// slides it from where the cursor came from to where it is now, then it
// shrinks away — pure scale, no opacity fade
function buildImageTrail(projects) {
  // Router transitions call this again on every project-page visit; the pool
  // + mousemove listener only need to exist once per session.
  if ($(".img-trail")) return;
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

  // Reusable pool — the images live in the DOM once, hidden at scale 0
  const pool = uniq.map((src) => {
    const img = document.createElement("img");
    img.className = "img-trail__item";
    img.src = src;
    img.alt = "";
    layer.appendChild(img);
    gsap.set(img, { xPercent: -50, yPercent: -50, scale: 0 });
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

      // x/y and scale live in separate tweens: the long slide would otherwise
      // keep writing scale after the shrink tween ends, freezing the image at full size
      gsap
        .timeline()
        .fromTo(img, { x: from.x, y: from.y }, { x: cur.x, y: cur.y, duration: 0.85, ease: "power3.out" })
        .fromTo(img, { scale: 0.9 }, { scale: 1, duration: 0.4, ease: "power3.out" }, 0)
        .to(img, { scale: 0, duration: 0.35, ease: "power2.in" }, 0.4);

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
  $$(".contact-bar__btn, .hero__cta").forEach((a) => (a.href = C.site.telegram));
  $$("[data-copy]").forEach((b) => {
    b.dataset.copy = C.site.email;
    b.querySelector("span").textContent = C.site.email;
  });
  $$("[data-cv]").forEach((a) => (a.href = C.site.cvUrl));

  // Cursor image trail in the first viewport — case pages only for now
  if ($(".project-hero")) buildImageTrail(C.projects);

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
          const i18n = `data-i18n="proj${idx}b${k}"`;
          if (b.type === "h2") return `<h2 class="case-h2" ${i18n}></h2>`;
          if (b.type === "h3") return `<h3 class="case-h3" ${i18n}></h3>`;
          if (b.type === "quote") return `<blockquote class="case-quote" ${i18n}></blockquote>`;
          if (b.type === "ul") return `<ul class="case-ul" ${i18n} data-i18n-list></ul>`;
          if (b.type === "facts") return `<dl class="case-facts" ${i18n} data-i18n-facts></dl>`;
          if (b.type === "stats") return `<div class="case-stats" ${i18n} data-i18n-stats></div>`;
          if (b.type === "testimonial")
            return `<figure class="case-testimonial"><blockquote ${i18n}></blockquote><figcaption data-i18n="proj${idx}b${k}a"></figcaption></figure>`;
          if (b.type === "compare")
            return `<div class="case-compare" data-compare tabindex="0" role="slider" aria-label="Before and after comparison" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50">
              ${b.after ? `<img src="${esc(b.after)}" alt="">` : ""}
              <div class="case-compare__top">${b.before ? `<img src="${esc(b.before)}" alt="">` : ""}</div>
              <div class="case-compare__handle"></div>
              <span class="case-compare__tag case-compare__tag--a mono">Before</span>
              <span class="case-compare__tag case-compare__tag--b mono">After</span>
            </div>`;
          if (b.type === "grid")
            return `<div class="case-grid">${(b.images || [])
              .map((s) => (s ? `<img class="case-img" src="${esc(s)}" alt="" loading="lazy">` : '<div class="case-img"></div>'))
              .join("")}</div>`;
          if (b.type === "callout")
            return `<div class="case-callout"><span class="case-callout__icon">${esc(b.icon || "💡")}</span><p ${i18n}></p></div>`;
          if (b.type === "divider") return '<hr class="case-divider">';
          if (b.type === "img")
            return b.src
              ? `<img class="case-img" src="${esc(b.src)}" alt="" loading="lazy">`
              : '<div class="case-img"></div>';
          return `<div class="case-p"><p ${i18n}></p></div>`;
        })
        .join("");
      body.insertBefore(wrap, other);
      initCompares(wrap);
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

// Before/after sliders: drag or arrow keys move the split, GSAP glides it
function initCompares(scope) {
  $$("[data-compare]", scope).forEach((box) => {
    const top = $(".case-compare__top", box);
    const handle = $(".case-compare__handle", box);
    const pos = { p: 50 };
    const apply = () => {
      top.style.clipPath = `inset(0 ${100 - pos.p}% 0 0)`;
      handle.style.left = pos.p + "%";
      box.setAttribute("aria-valuenow", Math.round(pos.p));
    };
    apply();
    const glide = (v) => {
      v = Math.max(0, Math.min(100, v));
      if (window.gsap) gsap.to(pos, { p: v, duration: 0.3, ease: "power2.out", overwrite: true, onUpdate: apply });
      else { pos.p = v; apply(); }
    };
    const fromEvent = (e) => {
      const r = box.getBoundingClientRect();
      glide(((e.clientX - r.left) / r.width) * 100);
    };
    box.addEventListener("pointerdown", (e) => { box.setPointerCapture(e.pointerId); fromEvent(e); });
    box.addEventListener("pointermove", (e) => { if (e.buttons) fromEvent(e); });
    box.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { e.preventDefault(); glide(pos.p - 8); }
      if (e.key === "ArrowRight") { e.preventDefault(); glide(pos.p + 8); }
    });
  });
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
    if (!t) return;
    const lines = () => t.split("\n").map((s) => s.trim()).filter(Boolean);
    // List blocks store one item per line — rebuild the <li> set
    if (el.hasAttribute("data-i18n-list")) {
      el.innerHTML = lines().map((s) => `<li>${esc(s)}</li>`).join("");
    } else if (el.hasAttribute("data-i18n-facts")) {
      // "Label: value" per line
      el.innerHTML = lines()
        .map((line) => {
          const m = line.indexOf(":");
          const label = m > -1 ? line.slice(0, m).trim() : "";
          const val = (m > -1 ? line.slice(m + 1) : line).trim();
          return `<div class="case-facts__item"><dt>${esc(label)}</dt><dd>${esc(val)}</dd></div>`;
        })
        .join("");
    } else if (el.hasAttribute("data-i18n-stats")) {
      // "Value | label" per line
      el.innerHTML = lines()
        .map((line) => {
          const m = line.indexOf("|");
          const val = (m > -1 ? line.slice(0, m) : line).trim();
          const label = m > -1 ? line.slice(m + 1).trim() : "";
          return `<div class="case-stats__item"><span class="case-stats__value">${esc(val)}</span><span class="case-stats__label">${esc(label)}</span></div>`;
        })
        .join("");
    } else {
      el.textContent = t;
    }
  });
  document.documentElement.lang = lang;
  $$(".lang-toggle__btn").forEach((b) => b.classList.toggle("is-active", b.dataset.lang === lang));
  // Menu language chip shows the language you'd switch TO
  const ml = $("[data-menu-lang] span");
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

// Progressive blur under the header and contact-bar gradients: five stacked
// backdrop-filter bands (styles in .pblur) injected on every page that has them
function initProgressiveBlur() {
  $$(".header, .contact-bar").forEach((el) => {
    if ($(".pblur", el)) return;
    const wrap = document.createElement("div");
    wrap.className = "pblur";
    wrap.setAttribute("aria-hidden", "true");
    // <i> = masked blur bands (backdrop), <b> = tint fill painted above them
    wrap.innerHTML = "<i></i><i></i><i></i><i></i><b></b>";
    el.prepend(wrap);
  });
}
initProgressiveBlur();

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
// Bound once at boot; see bindCopy() for the per-element logic and why the
// hero's copy chip needs a second, separate bind from syncHero().

$$("[data-copy]").forEach(bindCopy);

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

// Did we arrive via an in-app navigation (link click or back/forward), as
// opposed to a fresh load (typed URL, external referrer, refresh)? The
// Navigation API answers this synchronously, unlike the pagereveal event —
// pagereveal can fire before this script's listener is even attached, which
// would otherwise race whatever reads its result.
const vtArrival = !!(window.navigation && navigation.activation && navigation.activation.from);

// Home page, arriving back from a case: morph the hero back into the stored card.
// On a case page the hero itself is the morph target, so nothing to do there.
window.addEventListener("pagereveal", (e) => {
  if (!e.viewTransition || $(".project-hero")) return;
  const i = Number(sessionStorage.getItem("vt-card"));
  const cards = $$(".card, .mini-card");
  const target = cards[i];
  const media = target && target.querySelector(".card__media");
  if (media) {
    // The load-time reset above puts us at scrollTop 0; jump straight to the
    // card so the morph-back is actually on screen instead of animating
    // somewhere below the fold.
    target.scrollIntoView({ block: "center" });
    media.style.viewTransitionName = "project-hero";
    e.viewTransition.finished.then(() => (media.style.viewTransitionName = ""));
  }
});

// ---------- Client-side router (GSAP Flip) ----------
//
// Progressive enhancement over the native cross-document view transition
// above: intercept clicks on the site's own index.html/project.html links,
// fetch + swap the <main class="page"> region in place, and morph the
// shared card/hero image with GSAP Flip instead of the browser's own
// ::view-transition-group() (which is a UA pseudo-element GSAP can't reach,
// and wouldn't survive a real cross-document navigation anyway). Direct
// loads, no-JS, and any fetch failure all fall through to a real navigation
// and the native @view-transition CSS above — that block stays intact as
// the permanent fallback, never removed.

const ROUTABLE = /^(index\.html|project\.html)(\?[^#]*)?$/;

function resolveInternal(href) {
  if (!href) return null;
  let url;
  try {
    url = new URL(href, location.href);
  } catch (_) {
    return null;
  }
  if (url.origin !== location.origin) return null;
  const rel = url.pathname.split("/").pop() + url.search;
  return ROUTABLE.test(rel) ? rel : null;
}

async function fetchDoc(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("fetch failed: " + res.status);
  const html = await res.text();
  return new DOMParser().parseFromString(html, "text/html");
}

function extractRegion(doc) {
  const main = doc.querySelector("main.page");
  if (!main) throw new Error("no main.page in fetched document");
  return {
    title: doc.title,
    mainHTML: main.innerHTML,
    heroHTML: doc.querySelector(".hero")?.outerHTML ?? null,
  };
}

// index.html's <section class="hero"> sits before <main>, so project.html
// has none at all — swapping main alone would leave it stale either way.
// Reconcile it against what the target page needs, animating it in/out
// with GSAP independently of the Flip morph of the card/hero image.
function syncHero(heroHTML) {
  const existing = $(".hero");
  if (heroHTML && !existing) {
    $(".header").insertAdjacentHTML("afterend", heroHTML);
    const hero = $(".hero");
    gsap.from(hero, { y: 16, autoAlpha: 0, duration: 0.5, ease: "power3.out" });
    const copyBtn = hero.querySelector("[data-copy]");
    if (copyBtn) bindCopy(copyBtn);
    const cta = hero.querySelector(".hero__cta");
    if (cta) bindMagneticCta(cta);
    applyHeroFade();
  } else if (!heroHTML && existing) {
    gsap.to(existing, {
      y: -16,
      autoAlpha: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => existing.remove(),
    });
  }
}

function swapMain(mainHTML) {
  $("main.page").innerHTML = mainHTML;
}

async function navigate(url, opts = {}) {
  const { push = true, originEl = null } = opts;
  const fromHero = $(".project-hero");
  const toHome = /^index\.html/.test(url);

  // Capture Flip state on the shared element BEFORE any DOM mutation.
  let flipState = null;
  let flipKind = null;
  const card = originEl && originEl.closest(".card, .mini-card");
  if (card) {
    // Forward: clicked card/mini-card -> new hero. The existing click
    // listener above already tagged sessionStorage["vt-card"] for us.
    const media = card.querySelector(".card__media");
    flipState = Flip.getState(media, { props: "borderRadius" });
    flipKind = "toHero";
  } else if (fromHero && toHome) {
    // Backward: hero -> the stored origin card.
    flipState = Flip.getState(fromHero, { props: "borderRadius" });
    flipKind = "toCard";
  } else if (fromHero && !toHome) {
    // project <-> project via browser back/forward, no click involved.
    flipState = Flip.getState(fromHero, { props: "borderRadius" });
    flipKind = "toHero";
  }

  let doc, region;
  try {
    doc = await fetchDoc(url);
    region = extractRegion(doc);
  } catch (_) {
    // Nothing has been mutated yet — a real navigation is a clean fallback.
    location.href = url;
    return;
  }

  syncHero(region.heroHTML);
  swapMain(region.mainHTML);
  document.title = region.title;

  // Before renderContent(): it derives the current project purely from
  // location.search (same code path a direct load uses), so the URL must
  // already point at the target before it runs — otherwise it renders
  // whichever project the *previous* URL named. Popstate arrivals already
  // have the right URL (the browser changed it before firing popstate).
  if (push) history.pushState({ url }, "", url);

  if (CONTENT) {
    renderContent();
    applyLang(currentLang);
  }

  // Scroll BEFORE runPageEnter()/initScrollEffects(): the reveal-on-scroll
  // ScrollTriggers it creates check the current scroll position right at
  // creation time, so if we scrolled afterward instead, the card we just
  // landed on would fire no scroll event Lenis/ScrollTrigger ever sees and
  // stay stuck invisible (autoAlpha: 0) — the exact bug this session's
  // earlier native-view-transition fix was for, in the opposite order.
  let flipTarget = null;
  if (flipKind === "toHero") {
    window.scrollTo(0, 0);
    flipTarget = $(".project-hero");
  } else if (flipKind === "toCard") {
    const i = Number(sessionStorage.getItem("vt-card"));
    const targetCard = $$(".card, .mini-card")[i];
    if (targetCard) {
      targetCard.scrollIntoView({ block: "center" });
      flipTarget = targetCard.querySelector(".card__media");
    }
  } else {
    window.scrollTo(0, 0);
  }

  runPageEnter();

  if (flipTarget && flipState) {
    Flip.from(flipState, { targets: flipTarget, duration: 0.4, ease: "power2.inOut", absolute: true, scale: true });
  }
}

function bindRouterLinks() {
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest("a[href]");
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
    const url = resolveInternal(a.getAttribute("href"));
    if (!url) return;
    e.preventDefault();
    navigate(url, { originEl: a });
  });

  window.addEventListener("popstate", () => {
    const url = location.pathname.split("/").pop() + location.search;
    navigate(url, { push: false });
  });

  history.replaceState({ url: location.pathname.split("/").pop() + location.search }, "", location.href);
}

const routerReady = !!(window.Flip && window.fetch && window.DOMParser && window.history && history.pushState);

// ---------- GSAP ----------

let lenis = null;

if (window.gsap) {
  gsap.registerPlugin(ScrollTrigger, SplitText);
  if (window.Flip) gsap.registerPlugin(Flip);

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
    // Chrome (header/menu/contact-bar) and whichever hero exists at boot are
    // bound exactly once here — the hero is the only one of these that can
    // later be swapped away/back in by the router, via syncHero()'s own
    // bindCopy()/bindMagneticCta() calls on the fresh node.
    initMenu();
    initHeroScroll();
    $$(".contact-bar__btn").forEach(bindMagneticCta);
    const heroCta = $(".hero__cta");
    if (heroCta) bindMagneticCta(heroCta);
    if (routerReady) bindRouterLinks();
    if (vtArrival) {
      // Seamless page transition: content must stand still, no intro replay —
      // but scroll-in sections still need their triggers, or anything below
      // the fold stays invisible forever (initLoadSequence would normally set
      // these up, but it's skipped here on purpose)
      const pre = $(".preloader");
      if (pre) pre.remove();
      runPageEnter();
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
  const closeBtn = $(".menu__close", menu);
  let open = false;
  let anim;

  const openMenu = () => {
    open = true;
    btn.setAttribute("aria-expanded", "true");
    menu.hidden = false;
    anim && anim.kill();
    // Backdrop fades in, chips drop out of the kebab from the top-right origin
    gsap.fromTo(menu, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, ease: "power2.out" });
    gsap.fromTo(closeBtn, { autoAlpha: 0, rotation: -90 }, { autoAlpha: 1, rotation: 0, duration: 0.4, ease: "power3.out" });
    anim = gsap.fromTo(
      $$(".chip", panel),
      { autoAlpha: 0, y: -14, scale: 0.8 },
      { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.06, ease: "back.out(1.7)" }
    );
  };

  const closeMenu = () => {
    open = false;
    btn.setAttribute("aria-expanded", "false");
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
        gsap.set(panel, { clearProps: "all" });
        gsap.set($$(".chip", panel), { clearProps: "all" });
      },
    });
  };

  btn.addEventListener("click", openMenu);
  closeBtn.addEventListener("click", closeMenu);
  // Tap on the blurred backdrop (not the chips) closes it
  menu.addEventListener("click", (e) => {
    if (!e.target.closest(".menu__panel") && !e.target.closest(".menu__close")) closeMenu();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && open) closeMenu();
  });
  // Language chip inside the menu
  const langBtn = $("[data-menu-lang]", menu);
  if (langBtn) {
    langBtn.addEventListener("click", () => {
      switchLang(currentLang === "en" ? "ru" : "en");
      closeMenu();
    });
  }
}

// Re-applied after the intro timeline finishes: its clearProps wipes the fade's
// inline styles, and with no further scroll events nothing would restore them
let applyHeroFade = () => {};


// Home page: the hero is pinned (CSS sticky) while the page scrolls over it;
// as the blocks cover it, the hero content melts into transparency and blur.
// Applied directly on every scroll event — a scrubbed tween here loses a race
// with the intro timeline's clearProps and can freeze the CTA fully visible.
//
// Bound once at boot regardless of whether a hero exists yet — a boot on
// project.html has none, but the router can insert one later via syncHero(),
// which calls applyHeroFade() directly. apply() below re-queries selectors
// live each time, so it tracks whatever hero is currently in the DOM without
// needing to be rebound.
function initHeroScroll() {
  if (!$(".page")) return;

  const mobile = window.matchMedia("(max-width: 599px)");
  applyHeroFade = () => apply();
  // Back on desktop, the chips are viewport-fixed and must not stay faded
  mobile.addEventListener("change", (e) => {
    if (!e.matches) gsap.set(".hero__chips", { clearProps: "opacity,visibility,filter" });
  });

  const apply = () => {
    // 0 at the top → 1 when the page content has covered 75% of the viewport
    const p = Math.min(1, Math.max(0, window.scrollY / (innerHeight * 0.75)));
    const state = {
      opacity: 1 - p,
      visibility: p >= 1 ? "hidden" : "visible",
      filter: "blur(" + (12 * p).toFixed(2) + "px)",
    };
    gsap.set([".hero__head", ".hero__cta"], state);
    // Mobile chips sit inside the hero flow and dissolve with it
    if (mobile.matches) gsap.set(".hero__chips", state);
  };

  window.addEventListener("scroll", apply, { passive: true });
  window.addEventListener("resize", apply);
  apply();
}

// Desktop, home page: the fixed Telegram bar slides in only after
// the first viewport has been scrolled past.
//
// Called from runPageEnter() on every view-enter (not just once at boot) —
// a boot on project.html has no .hero yet, and this trigger needs one to
// exist at creation time (unlike apply() above, ScrollTrigger.create can't
// track a selector live). Always kills its own previous trigger first, so
// it's safe to call repeatedly across router transitions and resizes.
let ctaScrollTrigger = null;
function initCtaOnScroll() {
  const bar = $(".contact-bar");
  const hero = $(".hero");
  if (ctaScrollTrigger) {
    ctaScrollTrigger.kill();
    ctaScrollTrigger = null;
  }
  if (!bar || !hero || window.innerWidth < 600) {
    if (bar) gsap.set(bar, { clearProps: "opacity,visibility,transform" });
    return;
  }
  gsap.set(bar, { autoAlpha: 0, y: 24 });
  ctaScrollTrigger = ScrollTrigger.create({
    trigger: hero,
    start: "bottom 80%",
    onEnter: () => gsap.to(bar, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power3.out" }),
    onLeaveBack: () => gsap.to(bar, { autoAlpha: 0, y: 24, duration: 0.35, ease: "power2.in" }),
  });
}
window.addEventListener("resize", () => {
  if (window.gsap && $(".hero")) initCtaOnScroll();
});

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

// Router transitions call this again on every project-page visit — tear
// down the previous instance's DOM node and scroll listener first, or
// repeat visits accumulate duplicate nav elements and stale trackers.
let tocTrack = null;
function initToc() {
  $(".toc")?.remove();
  if (tocTrack) {
    if (lenis) lenis.off("scroll", tocTrack);
    else window.removeEventListener("scroll", tocTrack);
    tocTrack = null;
  }

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
  tocTrack = track;
  if (lenis) lenis.on("scroll", track);
  else window.addEventListener("scroll", track, { passive: true });
  track();
}

function initLoadSequence(firstVisit) {
  // Whatever races happen mid-load (language switch, tab clicks), the intro
  // must never end with elements stuck invisible — clear all inline props at the end.
  const INTRO_TARGETS =
    ".header, .hero__chips, .hero__cta, .tabs__item, " +
    '[data-panel="experience"] .exp-card, .project-intro p, ' +
    ".project-intro__tags .tag, .project-hero, .contact-bar__btn";
  const tl = gsap.timeline({
    defaults: { ease: "power3.out", duration: 0.8 },
    onComplete: () => {
      gsap.set(INTRO_TARGETS, { clearProps: "transform,opacity,visibility" });
      // A language switch mid-intro may have been undone by split.revert() —
      // re-stamp every translated node to the current language
      applyLang(currentLang);
      // The user may have scrolled during the intro: clearProps just wiped the
      // hero fade state, and no new scroll event will come to restore it
      applyHeroFade();
      // Now the sections below may enter, in viewport order — and every
      // other per-view binding (tilt, tabs, toc, cta-on-scroll) needs
      // setting up too, exactly as it would after a router transition.
      runPageEnter();
    },
  });

  // The header animates only on the very first load of the site
  if (firstVisit) tl.from(".header", { y: -20, autoAlpha: 0, duration: 0.6 });

  // Home hero — signature → heading → chips → CTA → tabs → experience
  const lead = $(".hero__title");
  if (lead) {
    const split = SplitText.create(lead, { type: "lines", mask: "lines" });
    tl.from(split.lines, { yPercent: 110, stagger: 0.08, onComplete: () => split.revert() }, "-=0.25");
    // Tween the wrapper, not the chips: they carry CSS hover transitions
    // that corrupt GSAP's from() value capture
    tl.from(".hero__chips", { y: 14, autoAlpha: 0, duration: 0.5 }, "-=0.15");
    tl.from(".hero__cta", { y: 16, scale: 0.9, autoAlpha: 0, duration: 0.55, ease: "back.out(1.6)" }, "-=0.25");
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
  ".projects .section-title, .other-projects .section-title, .case-h2, .case-h3, " +
  ".case-p, .case-img, .case-quote, .case-ul, .case-callout, .case-divider, " +
  ".case-facts, .case-stats, .case-testimonial, .case-compare, .case-grid, .card, .mini-card";

function initScrollEffects() {
  // Router transitions call this again on every view — kill every existing
  // trigger first (including ones from initCtaOnScroll, recreated right
  // after this runs) so nothing stays bound to elements the last swap just
  // removed from the DOM.
  ScrollTrigger.getAll().forEach((st) => st.kill());

  // Release the pre-hidden state; the from-tweens below take over per element
  gsap.set(SCROLL_FX_TARGETS, { clearProps: "opacity,visibility" });

  // Section titles slide up out of a line mask
  $$(".projects .section-title, .other-projects .section-title, .case-h2, .case-h3").forEach((el) => {
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
  $$(
    ".case-p, .case-img, .case-quote, .case-ul, .case-callout, .case-divider, " +
      ".case-facts, .case-stats, .case-testimonial, .case-compare, .case-grid"
  ).forEach((elm) => {
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

// Everything that needs (re)binding whenever a view becomes current — true
// first load (from initLoadSequence's completion), a real cross-document
// view-transition arrival (vtArrival), or a router-driven transition
// (navigate()). Each of these fires exactly once per view, so nothing here
// needs its own once-only guard beyond what the individual functions do.
function runPageEnter() {
  initScrollEffects();
  bindCardTilt();
  initTabs();
  initToc();
  initCtaOnScroll();
}

// Tilt on hover: card media follows the cursor with a light glare.
// Router transitions replace .card/.mini-card wholesale each time, so this
// is called again per transition — always fresh nodes, safe to re-run.
function bindCardTilt() {
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
}

// Magnetic CTA button (soft pull toward the cursor). Takes a single element
// so it can be bound once for the persistent contact-bar pill and again for
// each freshly-inserted hero pill (the hero lives outside <main>, so a
// router swap never touches — or rebinds — it on its own).
function bindMagneticCta(ctaBtn) {
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

// Copy-email chip click handler. Same rationale as bindMagneticCta: the
// menu's copy chip is persistent chrome (bound once), the hero's copy chip
// is not (bound again by syncHero() each time a hero is inserted).
function bindCopy(btn) {
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
}
