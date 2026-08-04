/**
 * Resolve a path from /public against the deploy base.
 * Vite rewrites asset URLs it sees in HTML/CSS, but plain runtime strings like
 * "/img/x.png" are left alone — on a project page (served from /<repo>/) those
 * would 404, so build them with BASE_URL instead.
 */
export const asset = (path) => `${import.meta.env.BASE_URL}${String(path).replace(/^\//, '')}`
