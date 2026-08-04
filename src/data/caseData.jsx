import { Fragment } from 'react'

// tiny inline formatter: **bold**, *italic* and ==highlight==
export function rich(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*|==[^=]+==)/g)
  return parts.map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) return <strong key={i}>{p.slice(2, -2)}</strong>
    if (/^==[^=]+==$/.test(p)) return <mark className="cs-mark" key={i}>{p.slice(2, -2)}</mark>
    if (/^\*[^*]+\*$/.test(p)) return <em key={i}>{p.slice(1, -1)}</em>
    return <Fragment key={i}>{p}</Fragment>
  })
}

const IMG = (n) => `/img/covers/cover${n}.png`
const PHOTO = (n) => `/img/about/${n}.jpg`

// Structured after the Marimba "Mercer Mass Timber" case study: hero + at-a-glance
// meta, then numbered sections (Overview, Challenge, My Role, Phase Breakdown,
// Outcome) and a closing CTA. Later this is what the Notion-like admin produces.
export const CASE = {
  title: 'Colozeo',
  tagline: 'Product design & design system — multi‑phase partnership',
  intro:
    'Colozeo turns raw match footage into scouted careers. Across two years I partnered with the team to design the scouting platform, build its design system, and craft the flows that make a player’s level legible in seconds.',
  cta: { label: 'Visit live site', href: '#' },
  meta: [
    { k: 'Role', v: 'UX, UI Design, Design System, Creative Lead' },
    { k: 'Duration', v: '2 years (2023 to 2024)' },
    { k: 'Platform', v: 'Web & iOS, React, GSAP' },
  ],
  blocks: [
    { type: 'section', num: '01', name: 'Overview', title: 'A startup inside the football industry' },
    {
      type: 'paragraph',
      text: 'Colozeo set out to fix a broken discovery market: thousands of talented players never get seen, and scouts drown in unstructured footage. My job was to turn that ambition into a product people actually reach for — one that makes ability ==comparable and trustworthy== in a glance.',
    },
    { type: 'image', src: IMG(1), size: 'full', caption: 'The scouting home — level‑first, evidence second.' },

    { type: 'section', num: '02', name: 'The challenge', title: 'A technical product for a fragmented audience' },
    {
      type: 'paragraph',
      text: 'Two audiences, opposite needs. Scouts want a fast, defensible signal; players want a fair shot at being seen. Designing for both without diluting either was the core constraint.',
    },
    { type: 'subheading', text: 'User personas' },
    {
      type: 'paragraph',
      text: 'I built three personas from 14 interviews — the *time‑pressed scout*, the *ambitious academy player*, and the *club analyst* — and used them to arbitrate every hard trade‑off along the way.',
    },
    { type: 'image', src: PHOTO(2), size: 'wide', caption: 'Persona synthesis from interviews and a two‑club diary study.' },

    { type: 'section', num: '03', name: 'My role', title: 'Leading design across the platform' },
    {
      type: 'paragraph',
      text: 'I owned product design end‑to‑end and set the creative direction, then grew and guided a small team as the product scaled across web and iOS.',
    },
    { type: 'image', src: IMG(2), size: 'full', caption: 'The design system that kept four phases coherent.' },

    { type: 'section', num: '04', name: 'Phase breakdown', title: 'Four phases. Two years. One evolving platform.' },

    { type: 'subheading', text: 'Phase 1 — 2023 · Foundations' },
    {
      type: 'paragraph',
      text: 'We started by mapping the scout’s real decision path, not the data we happened to have. Paper sketches killed a “timeline of everything” direction fast.',
    },
    {
      type: 'list',
      title: 'Key decisions',
      items: ['Lead every profile with a single, comparable level score.', 'Cut onboarding to three steps.', 'Design in the open with weekly scout reviews.'],
    },

    { type: 'subheading', text: 'Phase 2 — 2023 · IA & visual language' },
    {
      type: 'paragraph',
      text: 'A restructured information architecture and a moodboard set the tone — confident, sporty, data‑literate — before a pixel was polished.',
    },
    {
      type: 'list',
      title: 'Key decisions',
      items: ['One profile template for every role and position.', 'A tokenised type + colour system shared across web and iOS.'],
    },
    { type: 'gallery', columns: 2, images: [IMG(3), IMG(4)], caption: 'Sitemap, moodboard, and the first component explorations.' },

    { type: 'subheading', text: 'Phase 3 — 2024 · The scouting flow' },
    {
      type: 'paragraph',
      text: 'The core flow — ==the 10‑second signal== — shipped: a level read, a 3‑clip highlight reel, and one‑tap outreach, all above the fold.',
    },
    {
      type: 'list',
      title: 'Key decisions',
      items: ['Side‑by‑side compare for shortlists.', 'Instant upload feedback to push profile completion.'],
    },
    { type: 'image', src: PHOTO(1), size: 'wide', caption: 'Scouts began using Colozeo during live matches.' },

    { type: 'subheading', text: 'Phase 4 — 2024 · Polish & system' },
    {
      type: 'paragraph',
      text: 'The last phase hardened the system and sanded the details — motion, empty states, accessibility — so the product could keep growing without me in every review.',
    },
    {
      type: 'list',
      title: 'UI improvements',
      items: ['Consistent motion language via GSAP.', 'Accessible contrast + focus states.', 'A documented component library for the team.'],
    },

    { type: 'section', num: '05', name: 'Outcome', title: 'A platform that grew with the business' },
    {
      type: 'list',
      items: ['Click‑through on player profiles rose **+20%**.', 'Monthly active users grew **+10%** in three months.', 'Time per scout review dropped **−48%**.'],
    },
    {
      type: 'paragraph',
      text: 'Two years on, the design system still holds and the scouting flow is unchanged at its core — the strongest sign the foundations were right.',
    },
    {
      type: 'quote',
      text: 'The moment scouts started opening Colozeo *during* matches, we knew the product had earned a place in their day.',
      author: 'Founder, Colozeo',
      href: '#',
    },
    { type: 'image', src: IMG(1), size: 'full', caption: 'The platform, two years and four phases later.' },
  ],
}
