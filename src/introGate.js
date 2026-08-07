// The hero's reveal has to wait for the preloader curtain to open, otherwise it
// plays behind it and the page arrives already revealed. The preloader marks the
// moment; anything that should start with it subscribes here.
let opened = false
const waiting = []

export function markIntroOpen() {
  if (opened) return
  opened = true
  waiting.splice(0).forEach((fn) => fn())
}

export function onIntroOpen(fn) {
  if (opened) fn()
  else waiting.push(fn)
}
